# ── Stage 1: Build frontend ──────────────────────────────────────────
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --ignore-scripts 2>/dev/null || npm install

COPY frontend/ ./
RUN npm run build


# ── Stage 2: Build backend ──────────────────────────────────────────
# Use Debian slim (glibc) — required by @livekit/rtc-node native binaries.
# Alpine (musl) lacks prebuilt binaries for @livekit/rtc-node-linux-x64-musl.
FROM node:22-slim AS backend-build

# Install native build tools required by better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json* ./
RUN npm ci || npm install

COPY backend/ ./
RUN npx nest build


# ── Stage 3: Production image ───────────────────────────────────────
# Must also be Debian-based to match the glibc native binaries built above.
FROM node:22-slim AS production

RUN apt-get update && apt-get install -y --no-install-recommends \
    tini \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/package.json ./

COPY --from=frontend-build /app/frontend/dist ./public

RUN mkdir -p data agent-runners

ENV NODE_ENV=production
ENV PORT=3001

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/main.js"]
