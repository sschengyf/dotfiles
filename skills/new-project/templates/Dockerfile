# Pin the Node image to an exact version.
FROM node:__NODE_VERSION__-slim

WORKDIR /app
ENV NODE_ENV=production COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# pnpm at the version pinned in package.json's packageManager.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod && rm -rf /root/.cache /root/.local

COPY tsconfig.json ./
COPY src ./src
RUN mkdir -p data && chown node:node data

USER node
STOPSIGNAL SIGTERM
# Node itself is pid 1 so it receives SIGTERM directly (tsx must be a prod dependency).
CMD ["node", "--import", "tsx", "src/index.ts"]
