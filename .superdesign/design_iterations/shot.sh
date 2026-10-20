#!/usr/bin/env bash
# Használat: bash shot.sh <irány> <képernyő> <desktop|mobile> [magasság]
# Headless Chrome screenshot a mockupokról -> shots/<irány>-<képernyő>-<eszköz>.png
DIR="$(cd "$(dirname "$0")" && pwd)"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
mkdir -p "$DIR/shots"
d=$1; s=$2; dev=$3
if [ "$dev" = "mobile" ]; then W=500; H=${4:-1400}; Q="device=mobile&shot=1"; else W=1440; H=${4:-1500}; Q="device=desktop"; fi
WIN_DIR=$(cygpath -w "$DIR")
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=4000 \
  --window-size=$W,$H --screenshot="$WIN_DIR\\shots\\$d-$s-$dev.png" \
  "file:///${WIN_DIR//\\//}/$d.html?chrome=0&$Q#$s" 2>/dev/null
echo "shots/$d-$s-$dev.png"
