FROM ubuntu:24.04

RUN apt-get update && apt-get install -y build-essential make

WORKDIR /app

COPY . .

RUN make

EXPOSE 8080

CMD ["./plagiscan_server"]