#!/bin/zsh
# Regenerates src/assets/alexander-key-resume.pdf from the built /resume page.
# Edit resume content in src/_data/resume.json, then run this script.
set -e
cd "$(dirname "$0")/.."

npm run build
python3 -m http.server 8123 -d dist --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER_PID=$!
trap "kill $SERVER_PID 2>/dev/null" EXIT
sleep 1

"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="src/assets/alexander-key-resume.pdf" \
  "http://127.0.0.1:8123/resume/" 2>/dev/null

npm run build
echo "PDF regenerated: src/assets/alexander-key-resume.pdf"
