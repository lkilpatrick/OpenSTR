FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
COPY api/package.json ./api/
COPY shared/package.json ./shared/
RUN npm ci --workspace=api --workspace=shared

# Copy source
COPY shared/ ./shared/
COPY api/ ./api/

WORKDIR /app/api

# Build
RUN npm run build

# Production image
FROM node:20-alpine AS production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

COPY --from=base /app/api/dist ./dist
COPY --from=base /app/api/package.json ./
COPY --from=base /app/node_modules ./node_modules

# Include source for migrations and seed scripts (run via tsx)
COPY --from=base /app/api/migrations ./migrations
COPY --from=base /app/api/src/db ./src/db
COPY --from=base /app/api/src/config ./src/config

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000
CMD ["node", "dist/index.js"]
