FROM node:24-alpine
WORKDIR /app
COPY server.mjs ./server.mjs
ENV PORT=8787 DATA_DIR=/data NODE_ENV=production
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME ["/data"]
EXPOSE 8787
CMD ["node", "server.mjs"]
