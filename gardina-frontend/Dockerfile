# ============================================
# GARDINA FRONTEND — production Dockerfile
# ============================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments
ARG VITE_API_URL=https://api.gardina.kz/api

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Set environment variable for build
ENV VITE_API_URL=$VITE_API_URL

# Build
RUN npm run build

# ============================================
# Production image with Nginx
# ============================================
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy PWA files
COPY --from=builder /app/dist/sw.js /usr/share/nginx/html/
COPY --from=builder /app/public/sw-push.js /usr/share/nginx/html/

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1/health | grep -q OK || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
