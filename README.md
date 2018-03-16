# Periscope

Periscope displays and manages systemd units from your browser.

## Quickstart

Compile the binary with:
```bash
$ make
```

Configuration is done via Environment variables:

```bash
$ periscope -h
This application is configured via the environment. The following environment
variables can be used:

KEY                         TYPE                              DEFAULT    REQUIRED    DESCRIPTION
PERISCOPE_STATEPATTERN      Comma-separated list of String               False       the state filter to be applied to all systemd services
PERISCOPE_SERVICEPATTERN    Comma-separated list of String               False       the service filter to be applied to all systemd services
PERISCOPE_PORT              String                            8080       False       the port to listen on
PERISCOPE_DEBUG             True or False                     false      False       turn on debug log
```

To start simply type:
```bash
$ ./periscope
```

or from a docker container:
```bash
docker-compose up
```

Open your Browser at http://localhost:8080
