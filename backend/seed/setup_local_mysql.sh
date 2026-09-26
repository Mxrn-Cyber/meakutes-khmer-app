#!/usr/bin/env bash
#
# Local MySQL setup for Meakutes-Khmer (macOS + Homebrew).
#
#   cd ~/Desktop/meakutes-khmer-app/backend
#   bash seed/setup_local_mysql.sh
#
# Safe to run repeatedly: if the app user already works it changes nothing.
# It never changes your MySQL root password and never disables authentication.

set -uo pipefail

DB_NAME="meakutes_khmer"
DB_USER="meakutes"
DB_PASS="changeme"
SQL_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/setup_mysql.sql"

say()  { printf "\n\033[1m==> %s\033[0m\n" "$1"; }
fail() { printf "\n\033[31mERROR: %s\033[0m\n" "$1"; exit 1; }

# A plain TCP probe, not `lsof`: lsof hides sockets owned by other users when
# run unprivileged, which would make a running MySQL look stopped.
listening() { (echo > /dev/tcp/127.0.0.1/3306) >/dev/null 2>&1; }

app_user_works() {
  mysql -h 127.0.0.1 -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT 1;" >/dev/null 2>&1
}

[ -f "$SQL_FILE" ] || fail "Cannot find $SQL_FILE"

# ----------------------------------------------------------- 1. is it up?
# Homebrew lives in /usr/local on Intel Macs and /opt/homebrew on Apple
# Silicon, so never hardcode either — ask brew where it is.
BREW_PREFIX="$(brew --prefix 2>/dev/null || true)"

if listening; then
  say "MySQL is already running"
else
  if [ -z "$BREW_PREFIX" ]; then
    fail "Homebrew is not installed, so this script cannot start MySQL.
Either install MySQL yourself, or skip it entirely and use the container:

  cd $(dirname "$SQL_FILE")/..
  docker compose up -d"
  fi

  # `brew services start mysql` succeeds quietly even when mysql was never
  # installed, so check for the formula before blaming the server.
  if ! brew list --versions mysql >/dev/null 2>&1; then
    INSTALLED_MARIA=""
    brew list --versions mariadb >/dev/null 2>&1 && INSTALLED_MARIA=" (you have mariadb installed instead)"
    fail "MySQL is not installed via Homebrew${INSTALLED_MARIA}.
Install it:

  brew install mysql

Or skip local MySQL altogether and use the container:

  cd $(dirname "$SQL_FILE")/..
  docker compose up -d"
  fi

  say "MySQL is not running — starting it"
  brew services start mysql >/dev/null 2>&1 || true
  for _ in $(seq 1 20); do listening && break; sleep 1; done
  listening || fail "MySQL would not start.
Check the log for the real reason:

  tail -40 $BREW_PREFIX/var/mysql/*.err

A data directory left behind by an older MySQL is the usual cause. If that is
what the log says, the container avoids the problem entirely:

  cd $(dirname "$SQL_FILE")/..
  docker compose up -d"
  say "MySQL is now listening on 3306"
fi

# ------------------------------------------------------ 2. already set up?
if app_user_works; then
  say "User '$DB_USER' can already connect — nothing to do."
  echo "You're ready to run: alembic upgrade head"
  exit 0
fi

say "User '$DB_USER' cannot connect yet — creating the database and user"

# -------------------------------------------------- 3a. root, no password
if mysql -u root -e "SELECT 1;" >/dev/null 2>&1; then
  say "Connected as root with no password"
  mysql -u root < "$SQL_FILE" || fail "Failed to create the database and user"

# ------------------------------------------------ 3b. root, with password
else
  say "root needs a password. Enter it below (or press Ctrl-C to skip)."
  if ! mysql -u root -p < "$SQL_FILE"; then
    cat <<'EOF'

Could not authenticate as root.

If you don't know the root password, MySQL can be started with authentication
switched off for long enough to create this one user. That is a deliberate
step with real security implications, so it is not automated here — run it
yourself, and only on a machine you trust:

  # Terminal 1 — stop MySQL, restart it with auth off and networking closed
  brew services stop mysql
  mysqld_safe --skip-grant-tables --skip-networking &

  # Terminal 2 — create the user (FLUSH PRIVILEGES first is required,
  # otherwise MySQL refuses CREATE USER in this mode)
  cd ~/Desktop/meakutes-khmer-app/backend
  (echo "FLUSH PRIVILEGES;"; cat seed/setup_mysql.sql) | mysql -u root

  # Then put MySQL back to normal
  killall mysqld mysqld_safe
  sleep 4
  brew services start mysql

Then run this script again to verify.

EOF
    exit 1
  fi
fi

# ------------------------------------------------------------- 4. verify
say "Verifying"
if app_user_works; then
  mysql -h 127.0.0.1 -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
    -e "SELECT 'connection works' AS status;" 2>/dev/null
  cat <<'EOF'

Done. Next:

  source venv/bin/activate
  alembic upgrade head
  python seed/migrate_from_js.py --trips seed/tripsData.json \
      --news seed/newsEvents.json --images-dir ../frontend/public
  uvicorn app.main:app --reload

EOF
else
  fail "The user still cannot connect. Copy everything above and send it over."
fi
