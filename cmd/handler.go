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

	serviceRegex, err = regexp.Compile(spec.ServicePattern)
	if err != nil {
		log.Fatalf("unable to compile servicepattern: %v", err)
	}

	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.GET("/units", p.UnitsHandler)
	e.GET("/unit", p.UnitHandler)
	e.GET("/journal", p.JournalHandler)
	e.GET("/readonly", p.ReadonlyHandler)
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
	if !serviceRegex.Match([]byte(name)) {
		log.WithFields(log.Fields{"service": name, "does not match servicepattern": p.spec.ServicePattern}).Warn("unithandler")
		return c.JSON(http.StatusForbidden, "given unit does not match servicepattern")
	}
	log.WithFields(log.Fields{"service": name, "action": action}).Info("unithandler")
	names := []string{name}
	unit, err := p.dbusConn.ListUnitsByNames(names)
	if err != nil {
		log.WithFields(log.Fields{"service": name, "action": action, "error": err}).Error("unithandler")
		return c.JSON(http.StatusInternalServerError, err)
	}

	var id int
	switch action {
	case "start":
		if p.spec.Readonly {
			return c.JSON(http.StatusOK, unit)
		}
		id, err = p.dbusConn.StartUnit(name, "replace", nil)
	case "stop":
		if p.spec.Readonly {
			return c.JSON(http.StatusOK, unit)
		}
		id, err = p.dbusConn.StopUnit(name, "replace", nil)
	case "restart":
		if p.spec.Readonly {
			return c.JSON(http.StatusOK, unit)
		}
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

// JournalHandler returns a list of journalentries
func (p *Periscope) JournalHandler(c echo.Context) error {
	name := c.QueryParam("name")
	if !serviceRegex.Match([]byte(name)) {
		log.WithFields(log.Fields{"service": name, "does not match servicepattern": p.spec.ServicePattern}).Warn("journalhandler")
		return c.JSON(http.StatusForbidden, "given unit does not match servicepattern")
	}
	journal, err := p.getJournal(name)
	if err != nil {
		log.WithFields(log.Fields{"service": name, "error": err, "message": "reading journal failed"}).Error("journalhandler")
		return c.JSON(http.StatusInternalServerError, err)
	}
	return c.JSON(http.StatusOK, journal)
}

// ReadonlyHandler returns the readonly status
func (p *Periscope) ReadonlyHandler(c echo.Context) error {
	return c.JSON(http.StatusOK, p.spec.Readonly)
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
	if !serviceRegex.Match([]byte(name)) {
		log.WithFields(log.Fields{"service": name, "does not match servicepattern": p.spec.ServicePattern}).Warn("getjournal")
		return nil, fmt.Errorf("given unit does not match servicepattern")
	}

	var journal []string
	r, err := sdjournal.NewJournalReader(
		sdjournal.JournalReaderConfig{
			Since: time.Duration(-10) * time.Hour,
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
	for _, entry := range journal {
		log.WithFields(log.Fields{"service": name, "journal": entry}).Info("getJournal")
	}
	return journal, nil
}
