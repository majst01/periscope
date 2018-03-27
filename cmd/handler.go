package cmd

import (
	"bytes"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"

	"github.com/coreos/go-systemd/dbus"
	"github.com/coreos/go-systemd/sdjournal"
	log "github.com/sirupsen/logrus"
)

var (
	stateRegex   *regexp.Regexp
	serviceRegex *regexp.Regexp
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

	stateRegex, err = regexp.Compile(spec.StatePattern)
	if err != nil {
		log.Fatalf("unable to compile statepattern: %v", err)
	}
	serviceRegex, err = regexp.Compile(spec.ServicePattern)
	if err != nil {
		log.Fatalf("unable to compile servicepattern: %v", err)
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
	case "describe":
		_, err = p.getJournal(name)
	case "journal":
		_, err = p.getJournal(name)
	default:
		log.WithFields(log.Fields{"service": name, "action": action, "error": "unknown action"}).Warn("unithandler")
		return c.JSON(http.StatusOK, unit)
	}
	if err != nil {
		log.WithFields(log.Fields{"service": name, "action": action, "error": err, "message": "action failed"}).Error("unithandler")
		return c.JSON(http.StatusInternalServerError, unit)
	}

	log.WithFields(log.Fields{"service": name, "action": action, "id": id, "message": "action succeeded"}).Info("unithandler")
	return c.JSON(http.StatusOK, unit)
}

func (p *Periscope) getUnits() ([]dbus.UnitStatus, error) {
	units, err := p.dbusConn.ListUnits()
	if err != nil {
		return nil, fmt.Errorf("unable to list units:%v", err)
	}
	var result []dbus.UnitStatus
	for _, unit := range units {
		if serviceRegex.Match([]byte(unit.Name)) {
			result = append(result, unit)
		}
	}
	return result, nil
}

func (p *Periscope) getJournal(name string) ([]string, error) {
	var journal []string
	r, err := sdjournal.NewJournalReader(
		sdjournal.JournalReaderConfig{
			Since: time.Duration(-1) * time.Hour,
			Matches: []sdjournal.Match{
				{
					Field: sdjournal.SD_JOURNAL_FIELD_SYSTEMD_UNIT,
					Value: name,
				},
			},
		})
	if err != nil {
		return journal, fmt.Errorf("Error opening journal: %s", err)
	}
	if r == nil {
		return journal, fmt.Errorf("Got a nil reader")
	}
	defer r.Close()

	buff := new(bytes.Buffer)
	var e error
	for c := -1; c != 0 && e == nil; {
		b := make([]byte, 2)
		c, e = r.Read(b)
		_, _ = buff.Write(b)
	}

	journal = strings.Split(buff.String(), "\n")
	log.WithFields(log.Fields{"service": name, "journal": journal}).Info("getJournal")
	return journal, nil
}
