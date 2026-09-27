#!/usr/bin/env bash
# Start Meakutes-Khmer backend for local development (MySQL in Docker).
#   cd ~/Desktop/meakutes-khmer-app/backend
#   bash start_dev.sh

set -uo pipefail
cd "$(dirname "$0")"

say()  { printf "\n\033[1m==> %s\033[0m\n" "$1"; }
fail() { printf "\n\033[31mERROR: %s\033[0m\n" "$1"; exit 1; }

say "Stopping Homebrew MySQL (it is broken and not needed)"
brew services stop mysql >/dev/null 2>&1 || true

say "Checking Docker"
if ! docker info >/dev/null 2>&1; then
  open -a Docker 2>/dev/null
  printf "Waiting for Docker Desktop to start"
  for _ in $(seq 1 60); do
    docker info >/dev/null 2>&1 && break
    printf "."; sleep 2
  done
  echo
  docker info >/dev/null 2>&1 || fail "Docker Desktop is not running. Open it, wait for it to finish starting, then run this again."
fi

say "Starting MySQL container"
docker compose up -d || fail "docker compose up failed (see message above)"

say "Waiting for MySQL to accept connections"
for i in $(seq 1 60); do
  if docker compose exec -T mysql mysqladmin ping -h 127.0.0.1 -umeakutes -pchangeme --silent >/dev/null 2>&1; then
    echo "MySQL is ready"; break
  fi
  [ "$i" -eq 60 ] && { docker compose logs --tail 30 mysql; fail "MySQL did not start in time (log above)"; }
  sleep 2
done

say "Activating Python venv"
[ -f venv/bin/activate ] || python3 -m venv venv
# shellcheck disable=SC1091
source venv/bin/activate
pip install -q -r requirements.txt || fail "pip install failed"

say "Creating / updating tables"
alembic upgrade head || fail "alembic upgrade failed (see message above)"

say "Starting API on http://localhost:8000  (docs: http://localhost:8000/docs)"
exec uvicorn app.main:app --reload
