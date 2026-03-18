# ── Stage 1: build ────────────────────────────────────────────────────────────
# Full dev-dep install so Vite + esbuild + tsx are available for the build step.
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy source (respects .dockerignore)
COPY . .

# Produces:
#   dist/public/   – Vite-built client assets
#   dist/index.cjs – esbuild server bundle (all server deps inlined)
RUN npm run build

# ── Stage 2: production image ─────────────────────────────────────────────────
# The server bundle is self-contained; we only need Node + the built artefacts.
FROM node:22-alpine

# openssl is needed for pg TLS connections on some platforms
RUN apk add --no-cache openssl

WORKDIR /app

# Copy built artefacts from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app listens on
EXPOSE 5000

ENV NODE_ENV=production

# Health-check so Railway (and other orchestrators) know when the app is ready
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "dist/index.cjs"]
