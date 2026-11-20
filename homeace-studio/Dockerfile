# Built from the folder that scripts/build-addon.mjs assembles:
#   config.yaml, Dockerfile, frontend/, backend/  (sources only, no node_modules)
# Released images come from the GitHub workflow (.github/workflows/build-images.yml); a local app
# (development) is built by the HA Supervisor itself. BUILD_FROM is ignored: the official Node image
# exists for every arch.
#
# Stages 1 and 2 produce plain JavaScript, so they run on the platform of the build machine
# (BUILDPLATFORM); only the small runtime stage is built for the target arch. That keeps the
# aarch64 image fast to build on an amd64 runner. No dependency has native code.

# Set by BuildKit; the default only helps an old builder that does not set it.
ARG BUILDPLATFORM=linux/amd64

# ---- 1. Frontend: lint, test, build -------------------------------------------------------
FROM --platform=$BUILDPLATFORM node:22-alpine AS frontend
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Shown in the settings; the Supervisor and the GitHub workflow pass it.
ARG BUILD_VERSION=dev
RUN npm run lint:check && npm test && BUILD_VERSION=$BUILD_VERSION npm run build

# ---- 2. Backend: lint, test, build, keep only runtime dependencies ----------------------
FROM --platform=$BUILDPLATFORM node:22-alpine AS backend
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
