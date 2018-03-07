package cmd

import (
	"fmt"
	"html/template"
	"net/http"

	"github.com/coreos/go-systemd/dbus"
	"github.com/gorilla/mux"
	log "github.com/sirupsen/logrus"
)

const (
	tpl = `
<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<title>Systemd Services</title>
	</head>
	<form action="/">
		State Pattern:<br>
		<input type="text" name="statepattern"><br>
		Service Pattern:<br>
		<input type="text" name="servicepattern"><br><br>
		<input type="submit" value="Submit">
  	</form>
	<table>
	<tr>
		<th>Service</th><th>State</th><th>Actions</th>
	</tr>
	{{range .Items}}
	<tr>
		<td><div>{{ .Name }}</div></td><td><div>{{ .ActiveState }}</div></td><td>stop|start|restart</td>
	</tr>
	{{else}}
	<tr>
		<td><strong>no services</strong></td>
	</tr>
	{{end}}
	</table>
</html>`
)

// ListenAndServe starts the listener with appropriate parameters from Specification
func ListenAndServe(spec Specification) {
	dbc, err := dbus.New()
	if err != nil {
		log.Fatalf("unable to connect to dbus: %v", err)
	}

	p := &Periscope{
		dbusConn: dbc,
		spec:     &spec,
	}
	r := mux.NewRouter()
	// Routes consist of a path and a handler function.
	r.HandleFunc("/", p.SystemdHandler).Queries("servicepattern", "{servicepattern}", "statepattern", "{statepattern}")
	r.HandleFunc("/service/{name}", p.ServiceHandler).Methods("GET", "PUT")

	// Bind to a port and pass our router in
	addr := fmt.Sprintf(":%s", spec.Port)
	log.Fatal(http.ListenAndServe(addr, r))
}

// SystemdHandler returns all systemd services
func (p *Periscope) SystemdHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	servicepattern := vars["servicepattern"]
	statepattern := vars["statepattern"]
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
		Items []dbus.UnitStatus
	}{
		Items: units,
	}

	for _, unit := range units {
		log.WithFields(log.Fields{"unit": unit.Name, "state": unit.ActiveState}).Debug("systemdHandler")
	}

	// FIXME can be done once
	t, err := template.New("webpage").Parse(tpl)

	if err != nil {
		log.Fatalf("unable to parse template:%v", err)
	}
	err = t.Execute(w, u)
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
