# grid-perception — CPU stub image (no torch/ultralytics; GPU/CUDA image = follow-up card).
# Runs /health + inbox watcher (GP_INBOX_DIR → GP_DETECT_FILE). Fallback detectors work on CPU;
# Gate0 weights need ultralytics (host venv / future CUDA image).
# Build context: repo root.
ARG PYTHON_IMAGE=python:3.12-alpine

FROM ${PYTHON_IMAGE}
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /srv
COPY apps/grid-perception/grid_perception apps/grid-perception/grid_perception
COPY packages/detector-fallbacks packages/detector-fallbacks
ENV PYTHONPATH=/srv/apps/grid-perception GP_HEALTH_PORT=8081
# /data/bus (detect.v1 JSONL) and /data/inbox are named volumes in compose; pre-own so `vp` can write.
RUN adduser -D vp && mkdir -p /data/bus /data/inbox && chown -R vp /data
USER vp
EXPOSE 8081
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=6 \
  CMD python -c "import os,urllib.request as u;u.urlopen('http://127.0.0.1:'+os.environ['GP_HEALTH_PORT']+'/health',timeout=3)"
CMD ["python", "-m", "grid_perception.serve"]
