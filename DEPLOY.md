# Deploying Meakutes-Khmer

```
browser ──> Cloudflare Worker (frontend/)  ──/api /auth /media──> Render (backend/) ──> cloud MySQL
            serves the React build
```

The browser only talks to the Cloudflare domain. The Worker forwards API
calls to Render, so the login cookie is first-party and works in every browser.

## 1. Cloud MySQL

Create a MySQL 8 database (for example Aiven or TiDB Cloud). Build the URL:

```
mysql+pymysql://USER:PASSWORD@HOST:PORT/DBNAME?ssl_ca=/etc/ssl/certs/ca-certificates.crt
```

## 2. Backend on Render

1. Push to GitHub.
2. Render → **New → Blueprint** → pick this repo (uses `render.yaml`).
3. Fill in the secret values:
   - `DATABASE_URL`: from step 1
   - `GOOGLE_CLIENT_ID`: same as the frontend's `VITE_GOOGLE_CLIENT_ID`
   - `CORS_ORIGINS`: your Cloudflare URL, e.g. `https://meakutes-khmer-frontend.<you>.workers.dev`
4. Every deploy runs `alembic upgrade head` first, so migrations apply by themselves.
5. Check `https://<render-service>.onrender.com/health` returns `{"status":"ok"}`.

The free plan sleeps after about 15 minutes idle, so the first request after that takes about 30–60 seconds.

## 3. Frontend on Cloudflare

1. In `frontend/wrangler.jsonc`, set `BACKEND_URL` to your Render URL.
2. Build and deploy:

```
cd frontend
npm run build      # uses .env.production (API on same domain)
npx wrangler deploy
```

`VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_MAPS_API_KEY` must be in
`frontend/.env` (or `.env.production.local`) when you build.

## 4. Google Sign-In

In Google Cloud Console → OAuth client → **Authorized JavaScript origins**,
add the Cloudflare URL (and any custom domain).

## 5. First admin

Sign up on the live site, then in MySQL:

```sql
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'you@example.com' AND r.name = 'admin';
```
