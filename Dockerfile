FROM node:19-slim as node-builder
WORKDIR /periscope/
COPY . /periscope/
RUN npm install \
 && node_modules/.bin/webpack -p \
 && rm -rf node_modules

FROM golang:1.20-bullseye AS go-builder
WORKDIR /periscope/
RUN apt update \
 && apt install -y \
        libsystemd-dev \
        make \
        libssl-dev
COPY . /periscope/
RUN make periscope

FROM debian:bullseye
COPY --from=go-builder /periscope/periscope /periscope/
COPY --from=node-builder /periscope/static /periscope/static
WORKDIR /periscope

CMD ["/periscope/periscope"]
