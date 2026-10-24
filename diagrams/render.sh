#!/usr/bin/env bash
# Render every diagrams/src/*.mmd to svg/ and png/ with mermaid-cli and a local Chromium.
# Usage: MMDC=/path/to/mmdc PUPPETEER_EXECUTABLE_PATH=/path/to/chrome bash diagrams/render.sh
set -euo pipefail
cd "$(dirname "$0")"
MMDC=${MMDC:-mmdc}
for f in src/*.mmd; do
  n=$(basename "$f" .mmd)
  "$MMDC" -q -p puppeteer.json -b white -w 1800 -i "$f" -o "svg/$n.svg"
  "$MMDC" -q -p puppeteer.json -b white -w 1800 -s 2 -i "$f" -o "png/$n.png"
done
