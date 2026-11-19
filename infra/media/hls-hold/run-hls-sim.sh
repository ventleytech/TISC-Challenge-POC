#!/usr/bin/env bash
# C01 hold — loop sample MP4 to HLS (no camera claim).
set -euo pipefail
SRC="${1:?usage: run-hls-sim.sh <sample.mp4> [out_dir]}"
OUT="${2:-./out}"
mkdir -p "$OUT"
exec ffmpeg -hide_banner -loglevel error -re -stream_loop -1 -i "$SRC" \
  -c:v libx264 -pix_fmt yuv420p -c:a aac -f hls \
  -hls_time 2 -hls_list_size 5 -hls_flags delete_segments \
  "$OUT/index.m3u8"
