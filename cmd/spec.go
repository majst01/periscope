package cmd

import (
	log "github.com/sirupsen/logrus"
)

// Specification defines all configuration parameters.
type Specification struct {
	StatePattern   []string `default:"" desc:"the state filter to be applied to all systemd services" required:"False"`
	ServicePattern []string `default:"" desc:"the service filter to be applied to all systemd services" required:"False"`
	Port           string   `default:"8080" desc:"the port to listen on" required:"False"`
	Debug          bool     `default:"false" desc:"turn on debug log" required:"False"`
}

// Log prints all config to log
func (s *Specification) Log() {
	log.WithFields(log.Fields{
		"statepattern":   s.StatePattern,
		"servicepattern": s.ServicePattern,
		"port":           s.Port,
		"debug":          s.Debug,
	}).Info("config:")
}
