#!/usr/bin/env bash
# P0-T350 smoke: pulse-api (backend=minio) POST crop -> list -> get -> signed content -> object in MinIO.
# Env: API (default http://127.0.0.1:3350/api/v1), KEY (default dev-operator), VIEWER_KEY, MINIO_CONTAINER (optional, for bucket ls)
set -euo pipefail
API="${API:-http://127.0.0.1:3350/api/v1}"; KEY="${KEY:-dev-operator}"; VKEY="${VIEWER_KEY:-dev-viewer}"
U="${UTILITY:-util-demo-01}"
PNG=iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==
echo "# 1 POST crop";  ID=$(curl -fsS -X POST "$API/evidence" -H "X-API-Key: $KEY" -H 'Content-Type: application/json' \
  -d "{\"utility_id\":\"$U\",\"inspection_id\":\"insp-smoke\",\"kind\":\"crop\",\"content_type\":\"image/png\",\"data_base64\":\"$PNG\",\"class_id\":\"corrosion\",\"confidence\":0.9}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])'); echo "id=$ID"
echo "# 2 GET list (viewer)"; curl -fsS "$API/evidence?utility_id=$U&inspection_id=insp-smoke" -H "X-API-Key: $VKEY" | python3 -c 'import sys,json;d=json.load(sys.stdin)["items"];print(len(d),"item(s); key =",d[0]["object_key"],"; backend =",d[0]["backend"])'
echo "# 3 GET one -> signed content (no key)"; PATH_=$(curl -fsS "$API/evidence/$ID" -H "X-API-Key: $VKEY" | python3 -c 'import sys,json;print(json.load(sys.stdin)["content_path"])')
curl -fsS -D- -o /tmp/p0t350.out "$API$PATH_" | grep -i -E '^HTTP|content-type'; echo "bytes=$(stat -c%s /tmp/p0t350.out) sha256=$(sha256sum /tmp/p0t350.out | cut -c1-16) expect=$(echo $PNG | base64 -d | sha256sum | cut -c1-16)"
echo "# 4 tampered sig -> 401"; curl -s -o /dev/null -w '%{http_code}\n' "$API/evidence/$ID/content?exp=9999999999&sig=00"
echo "# 5 unauth list -> 401 / wrong tenant -> 403"; curl -s -o /dev/null -w '%{http_code} ' "$API/evidence?utility_id=$U"; curl -s -o /dev/null -w '%{http_code}\n' "$API/evidence?utility_id=other" -H "X-API-Key: $VKEY"
if [ -n "${MINIO_CONTAINER:-}" ]; then echo "# 6 MinIO bucket contents"; docker exec "$MINIO_CONTAINER" sh -c 'find /bitnami/minio/data -path "*insp_insp-smoke*" -type f 2>/dev/null || find /data -path "*insp_insp-smoke*" -type f'; fi
