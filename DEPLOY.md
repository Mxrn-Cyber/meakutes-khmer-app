# Deploying Meakutes-Khmer

Same pattern as eTnakRean, but a separate app with its own accounts' projects,
names and database.

```
browser ─► Cloudflare Worker  meakutes-khmer.laothomorn.workers.dev
             │  serves the React build (frontend/dist)
             └─ /api /auth /media ─► Render  meakutes-khmer-api.onrender.com  (FastAPI)
                                         ├─► TiDB Cloud  (MySQL)
                                         └─► Cloudflare R2  meakutes-khmer-media  (images)
```

The browser only talks to the workers.dev address. The Worker forwards API
calls to Render, so the login cookie is first-party.

| Piece | Service | Name |
|---|---|---|
| Website | Cloudflare Workers | `meakutes-khmer` |
| API | Render (free, Singapore) | `meakutes-khmer-api` |
| Database | TiDB Cloud Serverless (free, MySQL) | `meakutes_khmer` |
| Images | Cloudflare R2 | `meakutes-khmer-media` |

Do the steps in this order. Keep every password and key out of git.

---

## 1. Database: TiDB Cloud (MySQL)

1. Sign up at https://tidbcloud.com → **Create Cluster** → **Serverless**, region **Singapore**.
2. Cluster → **Connect** → *Connect With*: **General** → **Generate password**.
3. **SQL Editor**: run `CREATE DATABASE meakutes_khmer;`
4. Build the URL (host, port and user come from the Connect dialog):

```
mysql+pymysql://USER:PASSWORD@HOST:4000/meakutes_khmer?ssl_ca=/etc/ssl/certs/ca-certificates.crt
```

On macOS the CA file is `/etc/ssl/cert.pem` instead. Use that path in `.env.cloud` (step 4).

## 2. Images: Cloudflare R2

1. Cloudflare dashboard → **R2** → **Create bucket** → `meakutes-khmer-media`.
2. Bucket → **Settings** → **Public access** → enable the **r2.dev** URL. Copy it (`https://pub-….r2.dev`).
3. R2 → **Manage API tokens** → **Create API token**, permission **Object Read & Write**, only this bucket.
   Copy the **Access Key ID**, **Secret Access Key** and your **Account ID**.

## 3. API: Render

1. Push the repo to GitHub.
2. Render → **New → Blueprint** → pick the repo (uses `render.yaml`).
3. Fill in the values Render asks for:

| Key | Value |
|---|---|
| `DATABASE_URL` | step 1 URL |
| `GOOGLE_CLIENT_ID` | from Google Cloud (same as `VITE_GOOGLE_CLIENT_ID`) |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | step 2 |
| `R2_PUBLIC_URL` | step 2 r2.dev URL |

4. Deploy. Every deploy runs `alembic upgrade head` first, which creates the tables.
5. Check `https://meakutes-khmer-api.onrender.com/health` → `{"status":"ok"}`.
   (If Render gave the service a different URL, use that everywhere below.)

The free plan sleeps after about 15 minutes idle, so the first visit afterwards takes 30–60 seconds.

## 4. Content: 20 places, 6 news items, 78 images

On your Mac, create `backend/.env.cloud` (git ignores it):

```
DATABASE_URL=mysql+pymysql://USER:PASSWORD@HOST:4000/meakutes_khmer?ssl_ca=/etc/ssl/cert.pem
STORAGE_BACKEND=r2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=meakutes-khmer-media
R2_PUBLIC_URL=https://pub-....r2.dev
```

Then:

```
cd ~/Desktop/meakutes-khmer-app/backend
ENV_FILE=.env.cloud bash seed/load_content.sh
```

Safe to run again; existing items are skipped.

## 5. Website: Cloudflare Workers

1. `frontend/wrangler.jsonc`: check `BACKEND_URL` matches the Render URL.
2. `frontend/.env` must have `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_MAPS_API_KEY`.
3. Build and deploy:

```
cd ~/Desktop/meakutes-khmer-app/frontend
npm run build
npx wrangler login        # once
npx wrangler deploy
```

Open https://meakutes-khmer.laothomorn.workers.dev

## 6. Google (Sign-in and Maps)

- **OAuth client** → Authorized JavaScript origins: add `https://meakutes-khmer.laothomorn.workers.dev`
- **Maps API key** → Website restrictions: add `https://meakutes-khmer.laothomorn.workers.dev/*`

## 7. First admin

Sign in on the live site, then on your Mac:

```
cd ~/Desktop/meakutes-khmer-app/backend
set -a; source .env.cloud; set +a
source venv/bin/activate
python seed/make_admin.py laothomorn@gmail.com
```

---

## Updating later

- **Backend:** `git push` → Render redeploys automatically and runs migrations.
- **Frontend:** `cd frontend && npm run build && npx wrangler deploy`.
