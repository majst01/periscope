periscope:
	go mod download
	go build

test:
	go test -v -race -cover $(shell go list ./...)

clean:
	rm -rf periscope

container:
	docker build -t periscope .
