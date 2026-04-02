FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
COPY admin/package.json ./admin/
COPY shared/package.json ./shared/
RUN npm ci --workspace=admin --workspace=shared

COPY shared/ ./shared/
COPY admin/ ./admin/

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app/admin
RUN npm run build

# Production: just the static files
FROM nginx:alpine AS production
COPY --from=build /app/admin/dist /usr/share/nginx/html
