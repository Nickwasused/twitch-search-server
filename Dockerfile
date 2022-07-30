FROM denoland/deno:1.24.1

EXPOSE 8000

WORKDIR /

USER deno

ADD . .
RUN deno cache index.ts

CMD ["task", "run"]