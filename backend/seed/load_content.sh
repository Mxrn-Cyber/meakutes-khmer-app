#!/usr/bin/env bash
# Load the original Meakutes-Khmer content (20 places, 6 news/events, their images)
# into the database in backend/.env. Safe to run again: existing items are skipped.
#
#   cd ~/Desktop/meakutes-khmer-app/backend
#   bash seed/load_content.sh
set -euo pipefail
cd "$(dirname "$0")/.."
source venv/bin/activate
alembic upgrade head
python seed/migrate_from_js.py \
  --trips seed/tripsData.json \
  --news seed/newsEvents.json \
  --images-dir ../frontend/public
echo
echo "Done. Open http://localhost:5173/discover to see the places."
