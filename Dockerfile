FROM node:20-slim

# Chromium + fonts for headless rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      fonts-liberation fonts-noto fonts-noto-color-emoji ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Use the system Chromium; don't let puppeteer download its own
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
EXPOSE 8080
CMD ["node","src/server.js"]
