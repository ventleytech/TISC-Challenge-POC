# pulse-web — build context: repo root (needs packages/ui-tokens)
ARG NODE_IMAGE=node:24-alpine
ARG NGINX_IMAGE=nginx:1.27-alpine

FROM ${NODE_IMAGE} AS build
WORKDIR /srv
COPY packages/ui-tokens packages/ui-tokens
WORKDIR /srv/apps/pulse-web
COPY apps/pulse-web/package.json apps/pulse-web/package-lock.json ./
RUN npm ci
COPY apps/pulse-web/ ./
# Browser-facing API base (baked at build time). Empty → mock client.
ARG PULSE_WEB_API_URL=""
ARG PULSE_WEB_API_KEY=""
ENV VITE_PULSE_API_URL=${PULSE_WEB_API_URL} VITE_PULSE_API_KEY=${PULSE_WEB_API_KEY}
RUN npm run build

FROM ${NGINX_IMAGE}
COPY --from=build /srv/apps/pulse-web/dist /usr/share/nginx/html
# envsubst on start: ${PULSE_WEB_PORT}
COPY apps/pulse-web/nginx.conf.template /etc/nginx/templates/default.conf.template
ENV PULSE_WEB_PORT=5173
EXPOSE 5173
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=6 \
  CMD wget -qO- "http://127.0.0.1:${PULSE_WEB_PORT}/" >/dev/null || exit 1
