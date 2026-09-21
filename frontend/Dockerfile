# ============================================================
# Frontend — React + Vite
# Multi-stage: build di Node, serve via Nginx
# ============================================================

# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy seluruh source
COPY . .

# Build production bundle
RUN npm run build

# ---- Stage 2: Serve via Nginx ----
FROM nginx:alpine

# Hapus config Nginx default
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx config (SPA routing)
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy hasil build Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
