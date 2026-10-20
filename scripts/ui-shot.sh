#!/usr/bin/env bash
# Headless Chrome screenshot of a running dev server page.
# Usage: bash scripts/ui-shot.sh <url-path> <desktop|mobile> <out.png> [height]
# Mobile: Chrome headless cannot go below ~500px window width, so pass
# `?w=390` in the path — /dev/ui then renders itself inside a 390px iframe.
set -euo pipefail
path=$1; dev=$2; out=$3
BASE=${UI_BASE:-http://localhost:3000}
CHROME=${CHROME:-"/c/Program Files/Google/Chrome/Application/chrome.exe"}
if [ "$dev" = "mobile" ]; then W=500; H=${4:-1600}; else W=1440; H=${4:-1400}; fi
mkdir -p "$(dirname "$out")"
OUT_WIN=$(cygpath -w "$(cd "$(dirname "$out")" && pwd)")\\$(basename "$out")
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=8000 \
  --window-size=$W,$H --screenshot="$OUT_WIN" "$BASE$path" 2>/dev/null
echo "$out"
