# Dockerfile for local development and testing only

# Image with Node.js and Wrangler CLI installed
FROM jfxs/wrangler

# We need the whole monorepo setup, so we can resolve dependencies across workspace packages.
# This also lets us make changes without having to publish an image,
# at the cost of being a big image due to all the workspace dependencies
COPY ./ ./

# Wrangler needs the Node runtime, but we can still use Bun.js as the package manager
RUN npm i -g bun
RUN bun install


CMD ["npx", "wrangler", "dev", "--ip", "0.0.0.0", "--env", "dev_docker"]
