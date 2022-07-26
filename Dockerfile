FROM denoland/deno:1.19.0

EXPOSE 80
EXPOSE 443

WORKDIR /

USER deno

ADD . .
RUN deno cache main.ts

CMD ["run", "--watch", "--allow-net", "--allow-read", "--allow-env", "./main.ts"]