#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
export XDG_CONFIG_HOME=/workspace/.config
export WRANGLER_SEND_METRICS=false
export CI=true
export PATH="$PWD/node_modules/.bin:$PATH"
node scripts/setup-db.mjs
exec node_modules/.bin/concurrently -n ui,api -c cyan,green vite 'wrangler dev --port 8787'
