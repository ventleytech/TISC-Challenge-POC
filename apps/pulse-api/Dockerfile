# pulse-api — build context: repo root (see infra/compose/docker-compose.yml)
ARG NODE_IMAGE=node:24-alpine

FROM ${NODE_IMAGE} AS build
WORKDIR /srv
# file: dep @voltpulse/work-order must be built before pulse-api tsc
COPY packages/work-order packages/work-order
RUN cd packages/work-order && npm ci && npm run build
WORKDIR /srv/apps/pulse-api
COPY apps/pulse-api/package.json apps/pulse-api/package-lock.json ./
RUN npm ci
COPY apps/pulse-api/ ./
RUN npm run build && npm prune --omit=dev

FROM ${NODE_IMAGE}
ENV NODE_ENV=production
WORKDIR /srv/apps/pulse-api
COPY --from=build /srv/apps/pulse-api/node_modules ./node_modules
COPY --from=build /srv/apps/pulse-api/dist ./dist
COPY --from=build /srv/apps/pulse-api/sql ./sql
COPY apps/pulse-api/package.json ./
COPY --from=build /srv/packages/work-order/package.json /srv/packages/work-order/package.json
COPY --from=build /srv/packages/work-order/dist /srv/packages/work-order/dist
# defaultOpenApi resolves to /srv/packages/contracts/openapi/openapi.yaml
COPY packages/contracts/openapi /srv/packages/contracts/openapi
USER node
EXPOSE 3000
# Port comes from PULSE_API_PORT (compose); health route is unauthenticated.
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=6 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PULSE_API_PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
# Apply sql/ migrations (idempotent) then serve.
CMD ["sh", "-c", "node dist/db/migrate.js && exec node dist/main"]
