# ================================================================
# LifeOS Frontend Dockerfile
#
# Targets:
#   dev  — hot-reload dev server (used by root docker-compose.yml)
#   prod — standalone production server
# ================================================================

# ── Dev ──────────────────────────────────────────────────────────
FROM node:20-alpine AS dev

WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Source is bind-mounted at runtime (see docker-compose volumes)
EXPOSE 9002
CMD ["npm", "run", "dev"]

# ── Build ─────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .

ARG NEXT_PUBLIC_API_BASE_URL=/spring-api
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV DOCKER_BUILD=1

RUN npm run build

# ── Production ────────────────────────────────────────────────────
FROM node:20-alpine AS prod

WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static     ./.next/static
COPY --from=build /app/public           ./public

EXPOSE 3000
ENV PORT=3000 \
    NODE_ENV=production \
    HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
