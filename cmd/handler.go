package cmd

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"github.com/coreos/go-systemd/v22/dbus"
	"github.com/coreos/go-systemd/v22/sdjournal"
	log "github.com/sirupsen/logrus"
)

var (
	serviceRegex *regexp.Regexp
)

// ListenAndServe starts the listener with appropriate parameters from Specification
func ListenAndServe(spec Specification) error {
	ctx := context.Background()
	dbc, err := dbus.NewWithContext(ctx)
	if err != nil {
		log.Fatalf("unable to connect to dbus: %v", err)
	}
	defer dbc.Close()

	p := &Periscope{
		dbusConn: dbc,
		spec:     &spec,
	}

	hostname, err := os.Hostname()
	if err != nil {
		hostname = "unknown"
	}
	log.Infof("hostname: %s", hostname)

	if p.spec.DisplayName == "" {
		p.spec.DisplayName = hostname
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
	e.POST("/login", p.LoginHandler)
	e.GET("/config", p.ConfigHandler)
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
	unit, err := p.getUnit(name)
	if err != nil {
		log.WithFields(log.Fields{"service": name, "action": action, "error": err}).Error("unithandler")
		return c.JSON(http.StatusInternalServerError, err)
	}

	ctx := context.Background()
	var id int
	switch action {
	case "start":
		if p.spec.Readonly {
			return c.JSON(http.StatusOK, unit)
		}
		id, err = p.dbusConn.StartUnitContext(ctx, name, "replace", nil)
	case "stop":
		if p.spec.Readonly {
			return c.JSON(http.StatusOK, unit)
		}
		id, err = p.dbusConn.StopUnitContext(ctx, name, "replace", nil)
	case "restart":
		if p.spec.Readonly {
			return c.JSON(http.StatusOK, unit)
		}
		id, err = p.dbusConn.RestartUnitContext(ctx, name, "replace", nil)
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

	r, err := p.getJournal(name)
	if err != nil {
		log.WithFields(log.Fields{"service": name, "error": err, "message": "reading journal failed"}).Error("journalhandler")
		return c.JSON(http.StatusInternalServerError, err)
	}

	pr, pw := io.Pipe()
	until := make(chan time.Time)
	go func() {
		ctx := c.Request().Context()
		select {
		case t := <-time.After(time.Duration(15) * time.Minute):
			until <- t
			log.Println("stop following because of timeout")
		case <-ctx.Done():
			if errors.Is(ctx.Err(), context.Canceled) {
				until <- time.Now()
				log.Println("stop following because of cancellation")
			}
		}
	}()

	go func() {
		if err = r.Follow(until, pw); !errors.Is(err, sdjournal.ErrExpired) {
			log.Fatalf("Error during follow: %s", err)
		}
		pw.Close()
	}()

	c.Response().Header().Set(echo.HeaderContentType, echo.MIMETextPlain)
	c.Response().WriteHeader(http.StatusOK)
	writeOutput(c.Response().Writer, pr)

	return nil
}

func writeOutput(w http.ResponseWriter, r io.ReadCloser) {
	buffer := make([]byte, 1024)
	for {
		n, err := r.Read(buffer)
		if err != nil {
			r.Close()
			break
		}

		data := buffer[0:n]
		_, err = w.Write(data)
		if err != nil {
			continue
		}
		if f, ok := w.(http.Flusher); ok {
			f.Flush()
		}

		for i := 0; i < n; i++ {
			buffer[i] = 0
		}
	}
}

type Config struct {
	DisplayName string `json:"displayName"`
	ReadOnly    bool   `json:"readonly"`
}

// ConfigHandler returns the client configuration
func (p *Periscope) ConfigHandler(c echo.Context) error {
	config := &Config{
		DisplayName: p.spec.DisplayName,
		ReadOnly:    p.spec.Readonly,
	}
	log.Infof("config: %v", config)
	return c.JSON(http.StatusOK, config)
}

func (p *Periscope) getUnit(name string) (dbus.UnitStatus, error) {
	units, err := p.getUnits()
	var result dbus.UnitStatus
	if err != nil {
		return result, fmt.Errorf("unable to list units:%w", err)
	}
	for _, unit := range units {
		if unit.Name == name {
			result = unit
			break
		}
	}
	return result, nil
}

func (p *Periscope) getUnits() ([]dbus.UnitStatus, error) {
	units, err := p.dbusConn.ListUnitsContext(context.Background())
	if err != nil {
		return nil, fmt.Errorf("unable to list units:%w", err)
	}
	var result []dbus.UnitStatus
	for _, unit := range units {
		if serviceRegex.Match([]byte(unit.Name)) {
			result = append(result, unit)
		}
	}
	return result, nil
}

func (p *Periscope) getJournal(name string) (*sdjournal.JournalReader, error) {
	if !serviceRegex.Match([]byte(name)) {
		log.WithFields(log.Fields{"service": name, "does not match servicepattern": p.spec.ServicePattern}).Warn("getjournal")
		return nil, fmt.Errorf("given unit does not match servicepattern")
	}

	journalReader, err := sdjournal.NewJournalReader(
		sdjournal.JournalReaderConfig{
			NumFromTail: 100,
			Matches: []sdjournal.Match{
				{
					Field: sdjournal.SD_JOURNAL_FIELD_SYSTEMD_UNIT,
					Value: name,
				},
			},
		})
	if err != nil {
		return nil, fmt.Errorf("Error opening journal: %w", err)
	}
	if journalReader == nil {
		return nil, fmt.Errorf("Got a nil reader")
	}

	return journalReader, nil
}

// LoginHandler check if user and password are correct.
func (p *Periscope) LoginHandler(c echo.Context) error {
	username := c.FormValue("username")
	password := c.FormValue("password")
	log.WithFields(log.Fields{"username": username, "password": password}).Info("loginhandler")
	if len(username) < 1 || len(password) < 1 {
		return c.JSON(http.StatusForbidden, false)
	}

	return c.JSON(http.StatusOK, true)
}
