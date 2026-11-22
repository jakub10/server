#!/bin/sh
# Spuštění na Linuxu. Pokud je dostupný Node, použije se server.js (umí
# ukládat bug reporty do složky bugreporty/), jinak obyčejný statický server.
PORT="${1:-8080}"

if command -v node >/dev/null 2>&1; then
  echo "Rodina bezi na http://localhost:${PORT} (Node server + bug reporty)"
  exec node server.js "${PORT}"
else
  echo "Rodina bezi na http://localhost:${PORT} (Python, bez ukladani bug reportu)"
  exec python3 -m http.server "${PORT}"
fi
