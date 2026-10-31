FROM ghcr.io/puppeteer/puppeteer:23.11.1

# Install Manrope as a system font so Puppeteer renders it without network requests
USER root
COPY fonts /usr/local/share/fonts/manrope
RUN fc-cache -f
RUN mkdir -p /home/pptruser/app && chown pptruser:pptruser /home/pptruser/app
USER pptruser

WORKDIR /home/pptruser/app
COPY --chown=pptruser:pptruser package.json ./
RUN npm install --omit=dev
COPY --chown=pptruser:pptruser src ./src
COPY --chown=pptruser:pptruser packs ./packs
ENV NODE_ENV=production
CMD ["node","src/server.js"]
