FROM oven/bun:1.3.9-debian AS builder
WORKDIR /workspace
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl tar unzip && rm -rf /var/lib/apt/lists/*
COPY package.json bun.lock ./
COPY patches ./patches
COPY packages ./packages
COPY scripts ./scripts
RUN bun install --frozen-lockfile --ignore-scripts
COPY . .
RUN bun run package && PACK_PLATFORM=linux PACK_ARCH=x64 bun scripts/pack-web-cli.js

FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates libicu72 && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 10001 workspace \
    && useradd --system --uid 10001 --gid workspace --home-dir /data workspace
WORKDIR /app
COPY --from=builder --chown=workspace:workspace /workspace/dist-web-cli/staging/aionui-web/ ./
ENV AIONUI_PORT=3000 AIONUI_ALLOW_REMOTE=true AIONUI_OPEN_BROWSER=false AIONUI_DATA_DIR=/data
USER workspace
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 CMD ["/app/aionui-web", "version"]
CMD ["/app/aionui-web", "start", "--remote", "--no-open", "--port", "3000", "--data-dir", "/data"]
