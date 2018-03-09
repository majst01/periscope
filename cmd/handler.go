package cmd

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"

	"github.com/coreos/go-systemd/dbus"
	log "github.com/sirupsen/logrus"
)

// ListenAndServe starts the listener with appropriate parameters from Specification
func ListenAndServe(spec Specification) error {
	dbc, err := dbus.New()
	if err != nil {
		log.Fatalf("unable to connect to dbus: %v", err)
	}

	p := &Periscope{
		dbusConn: dbc,
		spec:     &spec,
	}

	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.GET("/units", p.UnitsHandler)
	e.GET("/unit", p.UnitHandler)
	e.Static("/", "static")

	srv := &http.Server{
		Addr: fmt.Sprintf(":%s", spec.Port),
	}

	return e.StartServer(srv)
}

// UnitsHandler returns all systemd services
func (p *Periscope) UnitsHandler(c echo.Context) error {
	units, err := p.getUnits()
	if err != nil {
		log.Fatalf("unable to list units:%v", err)
	}
	u := struct {
		Units []dbus.UnitStatus
	}{
		Units: units,
	}

	for _, unit := range units {
		log.WithFields(log.Fields{"unit": unit.Name, "state": unit.ActiveState}).Debug("systemdHandler")
	}

	return c.JSON(http.StatusOK, u)
}

// UnitHandler describe a Service
func (p *Periscope) UnitHandler(c echo.Context) error {
	name := c.QueryParam("name")
	action := c.QueryParam("action")
	log.WithFields(log.Fields{"service": name, "action": action}).Info("unithandler")
	var names []string
	names = append(names, name)
	unit, err := p.dbusConn.ListUnitsByNames(names)
	if err != nil {
		log.WithFields(log.Fields{"service": name, "action": action, "error": err}).Error("unithandler")
		return c.JSON(http.StatusInternalServerError, err)
	}
	var id int
	switch action {
	case "start":
		id, err = p.dbusConn.StartUnit(name, "replace", nil)
	case "stop":
		id, err = p.dbusConn.StopUnit(name, "replace", nil)
	case "restart":
		id, err = p.dbusConn.RestartUnit(name, "replace", nil)
	default:
		log.WithFields(log.Fields{"service": name, "action": action, "error": "unknown action"}).Error("unithandler")
		return c.JSON(http.StatusOK, unit)
	}

	if err != nil {
		log.WithFields(log.Fields{"service": name, "action": action, "error": err, "message": "action failed"}).Error("unithandler")
		return c.JSON(http.StatusInternalServerError, unit)
	}
	log.WithFields(log.Fields{"service": name, "action": action, "id": id, "message": "action succeeded"}).Error("unithandler")
	return c.JSON(http.StatusOK, unit)
}

func (p *Periscope) getUnits() ([]dbus.UnitStatus, error) {
	units, err := p.dbusConn.ListUnitsByPatterns(p.spec.StatePattern, p.spec.ServicePattern)
	if err != nil {
		return nil, fmt.Errorf("unable to list units:%v", err)
	}
	return units, nil
}
