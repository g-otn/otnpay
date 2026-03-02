# Dockerfile for local development and testing only
FROM oven/bun:1.3.9-slim

WORKDIR /app

COPY package.json ./
RUN bun install

COPY src/ src/
COPY wrangler.jsonc ./
COPY tsconfig.json ./

EXPOSE 9010

CMD ["bunx", "wrangler", "dev", "--ip", "0.0.0.0"]
