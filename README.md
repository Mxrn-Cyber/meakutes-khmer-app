# Meakutes-Khmer

Cambodian tourism platform — discover destinations, read tourism news and events,
save favourites, and leave reviews. Content is managed from an admin panel in the
site itself, not by editing code.

## Layout

```
.
├── frontend/   React + Vite app (the public site and the /admin panel)
└── backend/    FastAPI + MySQL API
```

Both halves live in one git repository. The frontend talks to the backend over
HTTP only — it never reaches the database directly.

## Running it locally

You need two terminals: one for the backend, one for the frontend.

### 1. Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then set SECRET_KEY

# Create the database and user in the MySQL you already have:
mysql -u root -p < seed/setup_mysql.sql
# (No MySQL installed? `docker compose up -d` starts one instead.)

alembic upgrade head          # creates all 17 tables
uvicorn app.main:app --reload # http://localhost:8000
```

API docs (interactive): http://localhost:8000/docs

To load the original 20 destinations and 6 news items into the database, along
with their images:

```bash
python seed/migrate_from_js.py \
  --trips seed/tripsData.json \
  --news seed/newsEvents.json \
  --images-dir ../frontend/public
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

The frontend reads these from `frontend/.env`:

| Variable | What it's for |
| --- | --- |
| `VITE_API_BASE_URL` | Where the backend is. `http://localhost:8000` in development. |
| `VITE_GOOGLE_CLIENT_ID` | Google Sign-In. Must match `GOOGLE_CLIENT_ID` in `backend/.env`. |
| `VITE_GOOGLE_MAPS_API_KEY` | Maps on the destination detail page. |

## Testing it

See [TESTING.md](TESTING.md) for a step-by-step walkthrough — from an empty
database through to creating a destination from the admin panel and seeing it
appear on the public site.

## The admin panel

Sign in, then go to `/admin` (a link also appears in the navbar for admin and
editor accounts). From there you can manage destinations, news and events,
categories and tags, the image library, reviews, and user roles.

Roles:

- **admin** — everything, including managing users and deleting content
- **editor** — create and edit content, moderate reviews
- **user** — normal visitor: favourites and reviews

### Creating the first admin

There is no UI for this, because it has to happen before any admin exists.
Register a normal account through the site, then promote it in MySQL:

```sql
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'you@example.com' AND r.name = 'admin';
```

After that, manage every other account from the Users & Roles page.

## Accounts and passwords

Firebase is gone; the backend owns sign-in. From `/profile` a signed-in user can
change their name and phone, change their email address (which requires their
current password, since email is what signs them in), change their password, and
upload a profile photo. Photos go to `backend/media/avatars/` and stay out of the
admin image library.

There is no self-service password reset. An admin resets a locked-out user's
password directly — see [TESTING.md](TESTING.md) for the snippet.
