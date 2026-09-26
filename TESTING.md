# Testing Meakutes-Khmer

A step-by-step check that everything works, from an empty database to a working
admin panel. Do it in order the first time — each part depends on the one before.

You need two terminals open: one for the backend, one for the frontend.

---

## Part 0 — Prerequisites

| Tool         | Check with          | Notes                              |
| ------------ | ------------------- | ---------------------------------- |
| Python 3.11+ | `python3 --version` |                                    |
| Node 18+     | `node --version`    |                                    |
| MySQL 8.0    | `mysql --version`   | Either your own install, or Docker |

Check whether MySQL is already running before doing anything else:

```bash
lsof -nP -i :3306
```

If that prints a `mysqld` line, **you already have MySQL — use it** and skip
every `docker compose` command below. That's the common case on a Mac with MySQL
installed via Homebrew or the official installer. Docker is only needed if you
have no MySQL at all.

---

## Part 1 — Start the backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Open `backend/.env` and set at minimum:

- `SECRET_KEY` — any long random string. Generate one with:
  `python3 -c "import secrets; print(secrets.token_urlsafe(64))"`
- `DATABASE_URL` — leave as-is unless your MySQL uses a different port or password.

### Create the database and user

**If you already have MySQL running** (the usual case — check with
`lsof -nP -i :3306`), run the provided script as a user that can create
databases. On Homebrew installs that's often `mysql -u root` with no password;
with the official installer it's the root password you set:

```bash
mysql -u root -p < seed/setup_mysql.sql
```

It prints `meakutes_khmer  utf8mb4  utf8mb4_unicode_ci` when it worked.

**Only if you have no MySQL at all**, and Docker is installed, you can use the
bundled container instead — it creates the database and user for you:

```bash
docker compose up -d
```

### Create the tables

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

**✅ Expected:** terminal shows `Uvicorn running on http://127.0.0.1:8000`.

**Check it:**

```bash
curl http://localhost:8000/health
```

**✅ Expected:** `{"status":"ok"}`

**If MySQL isn't ready yet** you'll see `Can't connect to MySQL server`. A Docker
container takes 10–20 seconds to start the first time. Wait, then retry
`alembic upgrade head`.

### Confirm the tables were created

```bash
mysql -h 127.0.0.1 -umeakutes -pchangeme meakutes_khmer -e "SHOW TABLES;"
```

**✅ Expected:** 18 rows — 17 application tables plus `alembic_version`:

`users`, `roles`, `user_roles`, `oauth_accounts`, `sessions`, `destinations`,
`categories`, `tags`, `destination_categories`, `destination_tags`,
`destination_media`, `media`, `news_events`, `reviews`, `favorites`, `comments`,
`user_activity`.

---

## Part 2 — Load the existing content

This imports the original 20 destinations and 6 news items, and copies the trip
images into the backend's media folder.

```bash
# still in backend/, venv active
python seed/migrate_from_js.py \
  --trips seed/tripsData.json \
  --news seed/newsEvents.json \
  --images-dir ../frontend/public
```

**✅ Expected:** output reporting 20 destinations and 6 news items created.

**Check it:**

```bash
curl -s "http://localhost:8000/api/destinations" | python3 -m json.tool | head -40
```

**✅ Expected:** a JSON list starting with a destination that has `name`, `slug`,
`province`, `images`, `rating`, `reviews_count`.

> The seeded content is created as **published**, so it appears on the public
> site immediately.

---

## Part 3 — Poke the API directly (no frontend needed)

Open **http://localhost:8000/docs** in a browser. This is the interactive API
documentation — every endpoint is listed and you can call it from the page.

Quick checks:

| Try                                | Expected                                                              |
| ---------------------------------- | --------------------------------------------------------------------- |
| `GET /api/destinations`            | 200, list of 20                                                       |
| `GET /api/destinations/angkor-wat` | 200, one destination (by slug)                                        |
| `GET /api/destinations/1`          | 200, same idea (by numeric id — this is what old `/trip/1` links use) |
| `GET /api/news`                    | 200, list of 6                                                        |
| `GET /api/admin/users`             | **401** — correct! You're not logged in                               |
| `POST /api/destinations`           | **401** — correct! Writing requires a login                           |

Those 401s are the point: public reading is open, writing is not.

---

## Part 4 — Start the frontend

In your **second** terminal:

```bash
cd frontend
npm install
npm run dev
```

**✅ Expected:** `Local: http://localhost:5173/`

Open it. **✅ Expected:** the homepage loads with destinations and images — and
those are now coming from MySQL, not from a JS file.

**To be sure it's really the database:** stop the backend (Ctrl-C in terminal 1)
and reload the page. The destinations should disappear or fail to load. Start the
backend again and they come back. That proves the content is dynamic.

---

## Part 5 — Test as an ordinary visitor

| Step                                | Expected                                  |
| ----------------------------------- | ----------------------------------------- |
| Browse **Discover** and **Popular** | Destination cards load, images show       |
| Use the province filter and search  | List narrows correctly                    |
| Click a destination                 | Detail page with description, map, images |
| Click **News**                      | 6 news/event items                        |
| Open a news article                 | Full article page                         |

---

## Part 6 — Create your admin account

Register through the site: click **Sign Up**, use a real email and a password of
at least 8 characters.

**✅ Expected:** you're signed in, your name appears in the navbar.

You are a normal `user` at this point — there's no Admin link yet. That's correct:
the first admin has to be promoted directly in the database, because no admin
exists yet to do it for you.

```bash
docker compose exec mysql mysql -umeakutes -pchangeme meakutes_khmer -e \
"INSERT INTO user_roles (user_id, role_id)
 SELECT u.id, r.id FROM users u, roles r
 WHERE u.email = 'you@example.com' AND r.name = 'admin';"
```

Replace `you@example.com` with the email you registered.

Now **log out and log back in** (the role is read when your session starts).

**✅ Expected:** an **Admin Panel** link now appears in the navbar.

---

## Part 7 — Test the admin panel

Go to **http://localhost:5173/#/admin**

| Page                  | Test                      | Expected                                 |
| --------------------- | ------------------------- | ---------------------------------------- |
| **Dashboard**         | Load it                   | Counts: 20 destinations, 6 news, 1 user  |
| **Media Library**     | Upload a JPG or PNG       | Thumbnail appears in the grid            |
| **Categories & Tags** | Add a category "Temples"  | Appears in the list; rename works        |
| **Destinations**      | Click **New Destination** | Empty form opens                         |
| **News & Events**     | Click **New Item**        | Empty form opens                         |
| **Reviews**           | Load it                   | Empty for now — you'll fill it in Part 9 |
| **Users & Roles**     | Load it                   | Your account, with `admin` highlighted   |

### The important test: draft → published

This is the whole point of the rebuild, so test it properly.

1. **Destinations → New Destination**
2. Fill in a name (e.g. "Test Temple"), a province, a short description
3. Tick the category you made, and click an image to attach it
4. Leave **Status** as `draft`
5. Save

**✅ Expected:** it appears in the admin list with a grey `draft` badge.

6. Now open the public site (**Discover** or **Popular**) and look for it.

**✅ Expected:** it is **not** there. Drafts are invisible to visitors.

7. Back in admin, edit it and set **Status** to `published`. Save.
8. Reload the public site.

**✅ Expected:** it now appears, with its image and category — **and you never
touched a line of code.** That's the test that matters.

9. Delete it from the admin list to clean up.

Repeat the same draft → published check on **News & Events** if you want.

---

## Part 8 — Test permissions

Register a **second** account (use a different email, or a private browser
window so you don't lose your admin session).

| Test                                        | Expected                     |
| ------------------------------------------- | ---------------------------- |
| Look for an Admin link as the new user      | Not there                    |
| Type `/#/admin` in the address bar directly | Bounced back to the homepage |

Then, as admin, go to **Users & Roles** and give the second account the `editor`
role. Log in as them again.

| Test                                | Expected                   |
| ----------------------------------- | -------------------------- |
| Admin link appears                  | Yes                        |
| They can edit destinations and news | Yes                        |
| **Users & Roles** in the sidebar    | **Not shown** — admin only |

---

## Part 9 — Test favourites and reviews

Signed in as any user, on a destination detail page:

| Test                                           | Expected                                                         |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| Click the heart                                | Fills in; destination appears under favourites in the navbar     |
| Reload the page                                | Heart still filled — it's saved in the database, not the browser |
| Leave a star rating and a comment              | Appears in the reviews list below                                |
| Check the destination's rating                 | Average updates to include your score                            |
| Submit a second review on the same destination | Replaces your first one, doesn't duplicate                       |

Then as admin: **Admin → Reviews**.

**✅ Expected:** your review is listed. Try **Flag** — its badge turns amber and it
disappears from the public page. Set it back to **Publish** and it returns.

---

## Part 10 — Google Sign-In (optional)

Skip this if you don't need Google login yet — everything else works without it.

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   create an **OAuth 2.0 Client ID** of type **Web application**
2. Add `http://localhost:5173` under **Authorised JavaScript origins**
3. Put the client ID in **both** files — they must match exactly:
   - `backend/.env` → `GOOGLE_CLIENT_ID=...`
   - `frontend/.env` → `VITE_GOOGLE_CLIENT_ID=...`
4. Restart both servers

| Test                                                                         | Expected                                       |
| ---------------------------------------------------------------------------- | ---------------------------------------------- |
| Google button on the Login page                                              | Appears (it's hidden when no client ID is set) |
| Sign in with a Google account                                                | Logged in, name in navbar                      |
| Sign out, then sign in with **email/password** using that same email address | Lands on the **same** account, not a duplicate |

That last row is the account-linking test — one person, one profile, whichever way
they sign in.

---

## Troubleshooting

### `Access denied for user 'meakutes'@'localhost'`

MySQL _is_ running and reachable — it just rejected the username/password. Almost
always this means you're talking to a **different MySQL** than the one in
`docker-compose.yml`. First find out what's actually listening:

```bash
docker compose ps              # is the project's container up?
lsof -nP -i :3306 | head       # what owns port 3306?
```

**If `lsof` shows a `mysqld`**, you have your own MySQL on port 3306 and it simply
doesn't have the `meakutes` user yet. Create it:

```bash
cd backend
mysql -u root -p < seed/setup_mysql.sql
```

If you get `Access denied` for **root** too, you don't know your root password.
On Homebrew installs try `mysql -u root` with no password at all. Otherwise reset
it — `brew services stop mysql`, then follow MySQL's documented
`--skip-grant-tables` recovery.

**If you'd rather run Docker's MySQL alongside your own**, move it off the
contested port: in `backend/docker-compose.yml` change the mapping to
`"3307:3306"`, and change the port in `DATABASE_URL` to `3307`.

**If `docker compose ps` shows the container running but access is still denied**,
you likely have a leftover data volume from an earlier run with different
credentials — MySQL only applies `MYSQL_USER`/`MYSQL_PASSWORD` when it initialises
an _empty_ volume. Wipe it and start clean (safe — there's no real data yet):

```bash
docker compose down -v
docker compose up -d
```

### `ModuleNotFoundError: No module named 'requests'`

Fixed — `requests` was missing from `requirements.txt`. Update and reinstall:

```bash
cd backend && source venv/bin/activate
pip install -r requirements.txt
```

### Everything else

| Symptom                                  | Cause                                    | Fix                                                                        |
| ---------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------- |
| `Can't connect to MySQL server`          | MySQL still starting, or not running     | `docker compose up -d`, wait 20s                                           |
| Site loads but no destinations           | Backend not running, or wrong URL        | Check `VITE_API_BASE_URL` in `frontend/.env` is `http://localhost:8000`    |
| `CORS` error in browser console          | Frontend origin not allowed              | Add your frontend URL to `CORS_ORIGINS` in `backend/.env`, restart backend |
| Logged in but stays logged out on reload | Cookie rejected                          | Use `http://localhost` (not `127.0.0.1`) consistently for both servers     |
| Admin link never appears                 | Role not applied, or session predates it | Log out and back in after running the SQL                                  |
| Uploaded images give 404                 | `MEDIA_ROOT` unwritable                  | Check `backend/media/` exists and the backend can write to it              |
| Google button missing                    | Client ID not set                        | Set `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`, restart `npm run dev`      |
| `alembic: command not found`             | venv not active                          | `source venv/bin/activate`                                                 |

---

## Checking the profile page

Firebase is gone — the whole app now runs on the FastAPI backend. The profile
page is the last piece that moved across, so it is worth a pass:

1. Sign in and go to `/profile`.
2. **Edit** -> change the first or last name and phone, **Save Changes**. The
   name in the navbar updates too.
3. **Edit** -> change the email address. A "Current Password" box appears as
   soon as the address differs. Save with the wrong password: you get *Current
   password is incorrect*. Save with the right one, then sign out and sign back
   in with the new address.
4. **Change Password** -> current password, then a new one of at least 8
   characters with an uppercase letter, a lowercase letter and a number. You
   stay signed in on this device; other devices are signed out.
5. **Update Profile Photo** -> pick a PNG/JPEG/WebP/GIF under 4MB and upload.
   The file lands in `backend/media/avatars/`, and replacing it deletes the old
   one.

Accounts created through Google Sign-In have no password, so steps 3 and 4
return a clear message telling you to ask an admin instead.

## Resetting a forgotten password

There is no self-service reset — no "forgot password" email. An admin sets a new
password for the user. With `backend/venv` active, from the `backend/` folder:

```bash
python -c "
from app.database import SessionLocal
from app.models.user import User
from app.security import hash_password
db = SessionLocal()
u = db.query(User).filter(User.email == 'them@example.com').first()
u.password_hash = hash_password('a-temporary-password')
db.commit()
print('password set for', u.email)
"
```

Tell the user the temporary password and have them change it from `/profile`.
