# pulse-train — build context: repo root (see infra/compose/docker-compose.yml)
ARG NODE_IMAGE=node:24-alpine

FROM ${NODE_IMAGE} AS build
WORKDIR /srv/apps/pulse-train
COPY apps/pulse-train/package.json apps/pulse-train/package-lock.json ./
RUN npm ci
COPY apps/pulse-train/tsconfig.json ./
COPY apps/pulse-train/src ./src
RUN npm run build && npm prune --omit=dev

FROM ${NODE_IMAGE}
ENV NODE_ENV=production
WORKDIR /srv/apps/pulse-train
COPY --from=build /srv/apps/pulse-train/node_modules ./node_modules
COPY --from=build /srv/apps/pulse-train/dist ./dist
COPY apps/pulse-train/package.json ./
# Label queue (jsonl) lands under /data/train (writable by node).
RUN mkdir -p /data/train && chown -R node:node /data
USER node
EXPOSE 3020
# Port comes from PULSE_TRAIN_PORT (compose); /health is unauthenticated.
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=6 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PULSE_TRAIN_PORT||3020)+'/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "dist/index.js"]
