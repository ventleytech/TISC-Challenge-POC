# grid-perception — CPU stub image (no torch/ultralytics; GPU/CUDA image = follow-up card).
# Build context: repo root.
ARG PYTHON_IMAGE=python:3.12-alpine

FROM ${PYTHON_IMAGE}
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /srv
COPY apps/grid-perception/grid_perception apps/grid-perception/grid_perception
COPY packages/detector-fallbacks packages/detector-fallbacks
ENV PYTHONPATH=/srv/apps/grid-perception GP_HEALTH_PORT=8081
RUN adduser -D vp
USER vp
EXPOSE 8081
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=6 \
  CMD python -c "import os,urllib.request as u;u.urlopen('http://127.0.0.1:'+os.environ['GP_HEALTH_PORT']+'/health',timeout=3)"
CMD ["python", "-m", "grid_perception.serve"]
