# ================================================================
# LifeOS — Hugging Face Spaces Dockerfile
# Exposes port 7860 (HF requirement)
# nginx:7860  →  /spring-api/* → Spring Boot:8000
#             →  /*            → Next.js:3000
# ================================================================

# ── Stage 1: Build Spring Boot JAR ──────────────────────────────
FROM maven:3.9-eclipse-temurin-17-alpine AS backend-build

WORKDIR /build

# Cache Maven dependencies separately from source
COPY backend/mvnw mvnw
COPY backend/.mvn .mvn
COPY backend/pom.xml pom.xml
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY backend/src src
RUN ./mvnw package -DskipTests -B

# ── Stage 2: Build Next.js (standalone output) ───────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps

COPY frontend .

# NEXT_PUBLIC_API_BASE_URL must be a relative path so it works on
# any domain. nginx strips the /spring-api prefix before forwarding
# to Spring Boot on port 8000.
ARG NEXT_PUBLIC_API_BASE_URL=/spring-api
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
# Tell next.config.mjs to enable standalone output
ENV DOCKER_BUILD=1

RUN npm run build

# ── Stage 3: Runtime ─────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

# nginx + supervisord + nodejs (to run Next.js standalone server)
RUN apk add --no-cache nginx supervisor nodejs npm && \
    mkdir -p /var/log/supervisor /app/logs /run/nginx

# ── Spring Boot ──
COPY --from=backend-build /build/target/backend-0.0.1-SNAPSHOT.jar /app/backend.jar

# ── Next.js standalone ──
# standalone/server.js + static assets + public files
COPY --from=frontend-build /app/.next/standalone /app/frontend
COPY --from=frontend-build /app/.next/static     /app/frontend/.next/static
COPY --from=frontend-build /app/public           /app/frontend/public

# ── Config files ──
COPY nginx.conf       /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# HF Spaces requires port 7860
EXPOSE 7860

# Default runtime env (can be overridden via HF Spaces secrets)
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
