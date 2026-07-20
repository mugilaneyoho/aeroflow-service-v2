# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build
RUN npm prune --production
RUN touch .env

# Stage 2: Runtime
FROM node:20-slim
WORKDIR /app

# Install system chromium and all of its required dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Configure Puppeteer to use the system chromium instead of downloading one
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/template ./src/template
COPY --from=builder /app/.env ./
CMD ["node", "dist/main"]

