# Built by the HA Supervisor from the folder that scripts/build-addon.mjs assembles:
#   config.yaml, Dockerfile, frontend/, backend/  (sources only, no node_modules)
# The Supervisor passes BUILD_FROM; we use the official Node image instead, which every arch has.

# ---- 1. Frontend: lint, test, build -------------------------------------------------------
FROM node:22-alpine AS frontend
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run lint:check && npm test && npm run build

# ---- 2. Backend: lint, test, build, keep only runtime dependencies ----------------------
FROM node:22-alpine AS backend
WORKDIR /build/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
RUN npm run lint:check && npm test && npm run build && npm prune --omit=dev

# ---- 3. Runtime: one Node process serves UI and API ---------------------------------------
FROM node:22-alpine
ENV NODE_ENV=production \
    PORT=8099 \
    STATIC_DIR=/app/public \
    OVERLAY_FILE=/config/overlay.json
WORKDIR /app
COPY --from=backend /build/backend/package.json ./
COPY --from=backend /build/backend/node_modules ./node_modules
COPY --from=backend /build/backend/dist ./dist
COPY --from=frontend /build/frontend/dist ./public
CMD ["node", "dist/main"]
