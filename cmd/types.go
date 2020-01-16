package cmd

import "github.com/coreos/go-systemd/v22/dbus"

// Periscope is the main config struct of this application
type Periscope struct {
	dbusConn *dbus.Conn
	spec     *Specification
}
