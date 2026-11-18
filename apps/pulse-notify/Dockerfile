# pulse-notify — build context: repo root (see infra/compose/docker-compose.yml)
ARG NODE_IMAGE=node:24-alpine

FROM ${NODE_IMAGE} AS build
WORKDIR /srv/apps/pulse-notify
COPY apps/pulse-notify/package.json apps/pulse-notify/package-lock.json ./
RUN npm ci
COPY apps/pulse-notify/tsconfig.json ./
COPY apps/pulse-notify/src ./src
RUN npm run build && npm prune --omit=dev

FROM ${NODE_IMAGE}
ENV NODE_ENV=production
WORKDIR /srv/apps/pulse-notify
COPY --from=build /srv/apps/pulse-notify/node_modules ./node_modules
COPY --from=build /srv/apps/pulse-notify/dist ./dist
COPY apps/pulse-notify/package.json ./
# adapter=file sink lands under /data/notify (writable by node).
RUN mkdir -p /data/notify && chown -R node:node /data
USER node
EXPOSE 3010
# Port comes from PULSE_NOTIFY_PORT (compose); /health is unauthenticated.
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=6 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PULSE_NOTIFY_PORT||3010)+'/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "dist/index.js"]
