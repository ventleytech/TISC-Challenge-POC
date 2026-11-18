# pulse-store HTTP app — build context: repo root (see infra/compose/docker-compose.yml)
ARG NODE_IMAGE=node:24-alpine

FROM ${NODE_IMAGE} AS build
WORKDIR /srv/apps/pulse-store
COPY apps/pulse-store/package.json apps/pulse-store/package-lock.json ./
RUN npm ci
COPY apps/pulse-store/tsconfig.json ./
COPY apps/pulse-store/src ./src
RUN npm run build && npm prune --omit=dev

FROM ${NODE_IMAGE}
ENV NODE_ENV=production
WORKDIR /srv/apps/pulse-store
COPY --from=build /srv/apps/pulse-store/node_modules ./node_modules
COPY --from=build /srv/apps/pulse-store/dist ./dist
COPY apps/pulse-store/package.json ./
# Retention meta index (PULSE_STORE_FS_ROOT) lands under /data/store (writable by node).
RUN mkdir -p /data/store && chown -R node:node /data
USER node
EXPOSE 3030
# Port comes from PULSE_STORE_HTTP_PORT (compose); /health is unauthenticated.
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=6 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PULSE_STORE_HTTP_PORT||3030)+'/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "dist/main.js"]
