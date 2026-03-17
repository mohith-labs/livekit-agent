# ── Stage 1: Build backend ───────────────────────────────────────────
FROM node:22-alpine AS build

# Install native build tools required by better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .
RUN npx nest build

# ── Stage 2: Production image ───────────────────────────────────────
FROM node:22-alpine

RUN apk add --no-cache tini

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

RUN mkdir -p data agent-runners

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
