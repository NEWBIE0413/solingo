#!/bin/sh
# Solingo is static. serve.py = http.server + Cache-Control: no-cache, bound to the LAN so a phone can open it.
cd "$(dirname "$0")" && exec python3 serve.py
