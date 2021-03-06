package cmd

import (
	log "github.com/sirupsen/logrus"
)

// Specification defines all configuration parameters.
type Specification struct {
	ServicePattern string `default:"" desc:"the service filter to be applied to all systemd services" required:"False"`
	DisplayName    string `default:"" desc:"The name of the server/host this service is responsible for" required:"False"`
	Port           string `default:"8080" desc:"the port to listen on" required:"False"`
	Readonly       bool   `default:"false" desc:"do not allow write operations" required:"False"`
	Debug          bool   `default:"false" desc:"turn on debug log" required:"False"`
}

// Log prints all config to log
func (s *Specification) Log() {
	log.WithFields(log.Fields{
		"servicepattern": s.ServicePattern,
		"displayname":    s.DisplayName,
		"port":           s.Port,
		"readonly":       s.Readonly,
		"debug":          s.Debug,
	}).Info("config:")
}
