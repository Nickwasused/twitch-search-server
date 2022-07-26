FROM denoland/deno:1.16.2

WORKDIR /

USER deno

ADD . .

CMD deno run --allow-all ./index.ts