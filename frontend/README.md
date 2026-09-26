# Frontend

React + Vite. See the [repository README](../README.md) for setup and
[TESTING.md](../TESTING.md) for a walkthrough.

Environment variables live in `frontend/.env`:

| Variable | What it's for |
| --- | --- |
| `VITE_API_BASE_URL` | Where the backend is. `http://localhost:8000` in development. |
| `VITE_GOOGLE_CLIENT_ID` | Google Sign-In. Must match `GOOGLE_CLIENT_ID` in `backend/.env`. |
| `VITE_GOOGLE_MAPS_API_KEY` | Maps on the destination detail page. |

All data goes through `src/api/client.js`, which talks to the FastAPI backend
over HTTP with a session cookie. Nothing here reaches a database directly.
