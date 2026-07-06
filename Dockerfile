FROM ghcr.io/puppeteer/puppeteer:23.11.1

WORKDIR /home/pptruser/app
COPY --chown=pptruser:pptruser package.json ./
RUN npm install --omit=dev
COPY --chown=pptruser:pptruser src ./src

ENV NODE_ENV=production
CMD ["node","src/server.js"]
