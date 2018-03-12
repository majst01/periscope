FROM golang:1.10 AS builder

WORKDIR /go/src/github.com/majst01/periscope/

COPY . /go/src/github.com/majst01/periscope/
RUN go get -u github.com/golang/dep/cmd/dep \
 && make dep all

FROM debian:9-slim

COPY --from=builder /go/src/github.com/majst01/periscope/periscope /periscope/
COPY --from=builder /go/src/github.com/majst01/periscope/static /periscope/static

WORKDIR /periscope

CMD ["/periscope/periscope"]
