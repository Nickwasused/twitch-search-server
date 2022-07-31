FROM denoland/deno:alpine-1.24.1

EXPOSE 8000

WORKDIR /app

COPY *.ts /app
COPY deno.json /app

CMD ["cache", "index.ts"]
CMD ["task", "run"]