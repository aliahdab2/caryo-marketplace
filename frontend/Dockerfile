# Production image for the Caryo Next.js frontend (standalone output)
#
# NEXT_PUBLIC_* variables are baked into the bundle at BUILD time, so they
# are passed as build args by docker-compose.prod.yml, not runtime env.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MINIO_URL
ARG NEXT_PUBLIC_IMGPROXY_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXTAUTH_URL
ARG SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_MINIO_URL=$NEXT_PUBLIC_MINIO_URL \
    NEXT_PUBLIC_IMGPROXY_URL=$NEXT_PUBLIC_IMGPROXY_URL \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXTAUTH_URL=$NEXTAUTH_URL \
    SITE_URL=$SITE_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
# Port 3100: stays clear of jawab24's 3000-3002 range when co-hosted
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3100 \
    HOSTNAME=0.0.0.0

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Standalone output needs public/ and .next/static copied in manually
COPY --from=build --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=build --chown=appuser:appgroup /app/.next/static ./.next/static
COPY --from=build --chown=appuser:appgroup /app/public ./public

USER appuser
EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3100/ || exit 1

CMD ["node", "server.js"]
