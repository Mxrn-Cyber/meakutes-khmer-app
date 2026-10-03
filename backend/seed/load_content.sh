#!/usr/bin/env bash
# Load the original Meakutes-Khmer content (20 places, 6 news/events, their images)
# into the database in backend/.env. Safe to run again: existing items are skipped.
#
#   cd ~/Desktop/meakutes-khmer-app/backend
#   bash seed/load_content.sh                      # local database from .env
#   ENV_FILE=.env.cloud bash seed/load_content.sh  # cloud database + R2 images
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -n "${ENV_FILE:-}" ]; then
  [ -f "$ENV_FILE" ] || { echo "No such file: $ENV_FILE"; exit 1; }
  set -a; source "$ENV_FILE"; set +a
  echo "Using settings from $ENV_FILE (database host: ${DATABASE_URL#*@})"
fi
source venv/bin/activate
alembic upgrade head
python seed/migrate_from_js.py \
  --trips seed/tripsData.json \
  --news seed/newsEvents.json \
  --images-dir seed/images
echo
echo "Done."
