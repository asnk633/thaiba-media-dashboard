#!/usr/bin/env bash
set -euo pipefail
cp .eslintrc.cjs .eslintrc.cjs.autobak || true
cat > .eslintrc.cjs <<'CJS'
# (same contents as in Option B — copy/paste the block)
CJS
echo ".eslintrc.cjs written and backup created .eslintrc.cjs.autobak"
