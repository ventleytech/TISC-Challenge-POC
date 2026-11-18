# grid-rules — build context: repo root (file: deps on packages/*)
ARG NODE_IMAGE=node:24-alpine

FROM ${NODE_IMAGE} AS build
WORKDIR /srv
COPY packages/alert-policy packages/alert-policy
COPY packages/responsibility packages/responsibility
RUN for p in alert-policy responsibility; do (cd packages/$p && npm ci && npm run build); done
WORKDIR /srv/apps/grid-rules
COPY apps/grid-rules/package.json apps/grid-rules/package-lock.json ./
RUN npm ci
COPY apps/grid-rules/ ./
RUN npm run build && npm prune --omit=dev

FROM ${NODE_IMAGE}
ENV NODE_ENV=production
WORKDIR /srv
COPY --from=build /srv/packages/alert-policy/package.json /srv/packages/alert-policy/package.json
COPY --from=build /srv/packages/alert-policy/dist /srv/packages/alert-policy/dist
COPY --from=build /srv/packages/alert-policy/config /srv/packages/alert-policy/config
COPY --from=build /srv/packages/responsibility/package.json /srv/packages/responsibility/package.json
COPY --from=build /srv/packages/responsibility/dist /srv/packages/responsibility/dist
COPY --from=build /srv/apps/grid-rules /srv/apps/grid-rules
WORKDIR /srv/apps/grid-rules
RUN mkdir -p /data/bus && chown node:node /data/bus
USER node
ENV GRID_RULES_HEALTH_PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=6 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.GRID_RULES_HEALTH_PORT+'/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "dist/serve.js"]
