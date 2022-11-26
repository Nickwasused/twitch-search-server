# build step
FROM denoland/deno:alpine-1.28.2 AS builder
WORKDIR /app

COPY *.ts /app/
COPY deno.json /app
RUN deno task build-linux

# runner image
FROM alpine:latest as runner
# copy some stuff
# https://github.com/denoland/deno_docker/issues/240#issuecomment-1205550359
COPY --from=builder /usr/glibc-compat /usr/glibc-compat
COPY --from=builder /lib/* /lib/
COPY --from=builder /lib64/* /lib64/
COPY --from=builder /usr/lib/* /usr/lib/
WORKDIR /app
EXPOSE 8000

COPY --from=builder "/app/twitch" "/app/twitch"
RUN chmod +x ./twitch
ENTRYPOINT ["./twitch"]