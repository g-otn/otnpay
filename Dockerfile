FROM oven/bun:1-alpine AS builder

WORKDIR /workspace
COPY . .
RUN bun i --frozen-lockfile

WORKDIR /workspace/apps/service-auth
RUN bun run build


FROM alpine:latest

# Install GCC runtime libraries required by Bun not present by default in Alpine Linux
RUN apk add libstdc++ libgcc

WORKDIR /app
COPY --from=builder /workspace/apps/service-auth/dist .

EXPOSE 9010
CMD ["./server"]