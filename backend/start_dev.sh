#!/usr/bin/env bash
# Start the Meakutes-Khmer backend for local development (MySQL from MAMP, port 8889).
#   cd ~/Desktop/meakutes-khmer-app/backend
#   bash start_dev.sh

set -uo pipefail
cd "$(dirname "$0")"

say()  { printf "\n\033[1m==> %s\033[0m\n" "$1"; }
fail() { printf "\n\033[31mERROR: %s\033[0m\n" "$1"; exit 1; }

say "Checking MAMP MySQL on 127.0.0.1:8889"
if ! nc -z 127.0.0.1 8889 >/dev/null 2>&1; then
  open -a MAMP 2>/dev/null
  echo "MAMP opened. Click Start in MAMP if MySQL doesn't start on its own."
  printf "Waiting for MySQL"
  for _ in $(seq 1 60); do
    nc -z 127.0.0.1 8889 >/dev/null 2>&1 && break
    printf "."; sleep 2
  done
  echo
  nc -z 127.0.0.1 8889 >/dev/null 2>&1 || fail "MySQL is not running. Open MAMP, click Start, then run this again."
fi
echo "MySQL is ready"

say "Activating Python venv"
[ -f venv/bin/activate ] || python3 -m venv venv
# shellcheck disable=SC1091
source venv/bin/activate
pip install -q -r requirements.txt || fail "pip install failed"

say "Creating / updating tables"
alembic upgrade head || fail "alembic upgrade failed (see message above)"

say "Starting API on http://localhost:8000  (docs: http://localhost:8000/docs)"
exec uvicorn app.main:app --reload
