FROM denoland/deno:alpine-1.24.1

EXPOSE 8000

WORKDIR /

ADD . .

CMD ["task", "build-bundle"]
CMD ["task", "run-bundle"]