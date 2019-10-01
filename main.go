package main

import (
	"os"

	"github.com/kelseyhightower/envconfig"
	"github.com/majst01/periscope/cmd"
	log "github.com/sirupsen/logrus"
)

func init() {
	log.SetFormatter(&log.TextFormatter{})
	log.SetOutput(os.Stdout)
}

func main() {
	var spec cmd.Specification
	envconfig.MustProcess("periscope", &spec)
	if len(os.Args) > 1 {
		err := envconfig.Usage("periscope", &spec)
		if err != nil {
			os.Exit(1)
		}
		os.Exit(1)
	}
	if spec.Debug {
		log.SetLevel(log.DebugLevel)
	} else {
		log.SetLevel(log.InfoLevel)
	}
	spec.Log()

	log.Fatal(cmd.ListenAndServe(spec))
}
