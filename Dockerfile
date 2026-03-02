# Dockerfile for local development and testing only
FROM jfxs/wrangler

# Copy workspace root manifests for dependency resolution
COPY ./ ./

RUN npm i -g bun
RUN bun install

WORKDIR /data/apps/service-auth

EXPOSE 9010

CMD ["npx", "wrangler", "dev", "--ip", "0.0.0.0", "--env", "dev_docker"]
