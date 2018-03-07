package cmd

import "github.com/coreos/go-systemd/dbus"

// Periscope is the main config struct of this application
type Periscope struct {
	dbusConn *dbus.Conn
	spec     *Specification
}
