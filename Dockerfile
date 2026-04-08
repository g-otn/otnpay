FROM oven/bun:1-alpine AS builder

ARG SERVICE_NAME

WORKDIR /workspace
COPY . .
RUN bun i --frozen-lockfile

WORKDIR /workspace/apps/${SERVICE_NAME}
RUN bun run build


FROM alpine:latest

ARG SERVICE_NAME
ARG PORT

# Install GCC runtime libraries required by Bun not present by default in Alpine Linux
RUN apk add libstdc++ libgcc

WORKDIR /app
COPY --from=builder /workspace/apps/${SERVICE_NAME}/dist .

# Change to non-root user
RUN adduser -D ${SERVICE_NAME}
RUN chown -R ${SERVICE_NAME}:${SERVICE_NAME} /app
USER ${SERVICE_NAME}

EXPOSE ${PORT}
CMD ["./server"]