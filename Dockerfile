FROM denoland/deno:distroless-1.24.1

EXPOSE 8000

WORKDIR /

ADD . .

CMD ["cache", "index.ts"]
CMD ["task", "run"]