#!/bin/sh
# Solingo is static. Any file server works; this one binds the LAN so a phone on the same Wi-Fi can open it.
cd "$(dirname "$0")" && exec python3 -m http.server "${PORT:-8765}" --bind 0.0.0.0
