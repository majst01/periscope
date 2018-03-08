package cmd

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"

	"github.com/coreos/go-systemd/dbus"
	"github.com/gorilla/mux"
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
	e.Static("/", "static")

	srv := &http.Server{
		Addr: fmt.Sprintf(":%s", spec.Port),
	}

	return e.StartServer(srv)
}

// UnitsHandler returns all systemd services
func (p *Periscope) UnitsHandler(c echo.Context) error {
	servicepattern := c.QueryParam("servicepattern")
	statepattern := c.QueryParam("statepattern")
	globalServicePattern := p.spec.ServicePattern
	globalStatePattern := p.spec.StatePattern

	if servicepattern != "" {
		globalServicePattern = append(p.spec.ServicePattern, servicepattern)
	}
	if statepattern != "" {
		globalStatePattern = append(p.spec.StatePattern, statepattern)
	}
	log.WithFields(log.Fields{"servicepattern": globalServicePattern, "statepattern": globalStatePattern}).Info("systemdhandler")

	units, err := p.dbusConn.ListUnitsByPatterns(globalStatePattern, globalServicePattern)
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

// ServiceHandler describe a Service
func (p *Periscope) ServiceHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	m := r.Method
	name := vars["name"]
	log.WithFields(log.Fields{"service": name, "method": m}).Info("stopservice")

	switch m {
	case http.MethodGet:

	case http.MethodDelete:
	default:
		log.WithFields(log.Fields{"method unknown": m}).Warn("stopservice")
	}
}
