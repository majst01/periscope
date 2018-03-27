all: clean dep test
	 go build

test:
	go test -v -race -cover $(shell go list ./...)

clean:
	rm -rf periscope

dep:
	dep ensure

container:
	docker build -t periscope .
