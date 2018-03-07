all: clean dep test
	go build

test:
	go test -v -race -cover $(shell go list ./...)

clean:
	rm -rf lib periscope

dep:
	dep ensure
