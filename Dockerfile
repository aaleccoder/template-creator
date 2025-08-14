# syntax=docker/dockerfile:1

# Builder stage: install deps and build Next.js
FROM node:20-alpine AS builder
WORKDIR /app

# System compatibility for some npm packages
RUN apk add --no-cache libc6-compat

# Avoid downloading Chromium at build time; runtime image provides it
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package.json bun.lock* ./
RUN npm install

COPY . .
# Build Next.js (standalone output enabled in next.config.ts)
RUN npm run build

# Runtime stage: Puppeteer-ready Node with Chromium
FROM ghcr.io/puppeteer/puppeteer:latest
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Defaults (overridden by docker-compose)
ENV NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090
ENV NEXT_PUBLIC_GOTENBERG_URL=http://localhost:3001

# Copy standalone server and static assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

# Next.js standalone entry
CMD ["node", "server.js"]