// Cloudflare Worker for Meakutes-Khmer.
// Serves the built React app from ./dist and forwards API calls to the
// FastAPI backend on Render. Because the browser only talks to this one
// domain, the backend's login cookie is first-party and is not blocked.

const PROXY_PREFIXES = ["/api/", "/auth/", "/media/", "/health"];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (PROXY_PREFIXES.some((p) => url.pathname === p.replace(/\/$/, "") || url.pathname.startsWith(p))) {
      if (!env.BACKEND_URL) {
        return new Response("BACKEND_URL is not set", { status: 500 });
      }
      const target = new URL(url.pathname + url.search, env.BACKEND_URL);
      const headers = new Headers(request.headers);
      headers.delete("host");
      headers.set("X-Forwarded-Host", url.host);
      headers.set("X-Forwarded-Proto", "https");
      return fetch(target, {
        method: request.method,
        headers,
        body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
        redirect: "manual",
      });
    }

    // Everything else: static files, with index.html for React Router paths.
    return env.ASSETS.fetch(request);
  },
};
