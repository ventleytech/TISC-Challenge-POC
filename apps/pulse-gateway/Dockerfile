# pulse-gateway — build context: repo root (see infra/compose/docker-compose.yml)
ARG NODE_IMAGE=node:24-alpine

FROM ${NODE_IMAGE} AS build
WORKDIR /srv/apps/pulse-gateway
COPY apps/pulse-gateway/package.json apps/pulse-gateway/package-lock.json ./
RUN npm ci
COPY apps/pulse-gateway/tsconfig.json ./
COPY apps/pulse-gateway/src ./src
RUN npm run build && npm prune --omit=dev

FROM ${NODE_IMAGE}
ENV NODE_ENV=production
WORKDIR /srv/apps/pulse-gateway
COPY --from=build /srv/apps/pulse-gateway/node_modules ./node_modules
COPY --from=build /srv/apps/pulse-gateway/dist ./dist
COPY apps/pulse-gateway/package.json ./
# Session registry + file detect bus land under /data (writable by node).
RUN mkdir -p /data/sessions /data/bus && chown -R node:node /data
ENV PULSE_GATEWAY_SESSION_DIR=/data/sessions
USER node
EXPOSE 3020
# Port comes from PULSE_GATEWAY_PORT (compose); /health is unauthenticated.
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=6 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PULSE_GATEWAY_PORT||3020)+'/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "dist/index.js"]
