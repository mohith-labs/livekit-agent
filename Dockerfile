# ── Stage 1: Build frontend ──────────────────────────────────────────
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --ignore-scripts 2>/dev/null || npm install

COPY frontend/ ./
RUN npm run build


# ── Stage 2: Build backend ──────────────────────────────────────────
FROM node:22-alpine AS backend-build

WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --ignore-scripts 2>/dev/null || npm install

COPY backend/ ./
RUN npx nest build


# ── Stage 3: Production image ───────────────────────────────────────
FROM node:22-alpine AS production

RUN apk add --no-cache tini

WORKDIR /app

# Copy backend build + node_modules
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/package.json ./

# Copy frontend build into backend's public dir
COPY --from=frontend-build /app/frontend/dist ./public

# Create directories for runtime data
RUN mkdir -p data agent-runners

ENV NODE_ENV=production
ENV PORT=3001

# Use tini as init to handle signals properly for child processes
ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "dist/main.js"]
