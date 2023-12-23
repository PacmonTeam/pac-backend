FROM golang:1.21 AS cloner

WORKDIR /app

RUN git clone --recurse-submodules -j8 https://github.com/ledgerwatch/erigon.git

FROM golang:1.21 AS maker

WORKDIR /app

COPY --from=cloner /app/erigon ./
RUN make BUILD_TAGS=nosqlite,noboltdb,nosilkworm erigon

FROM golang:1.21

WORKDIR /app

COPY --from=maker /app/build/bin ./
ENTRYPOINT [ "./erigon" ]