/* global HTMLRewriter */
// Cloudflare Worker for Meakutes-Khmer.
// Serves the built React app from ./dist and forwards API calls to the
// FastAPI backend on Render. Because the browser only talks to this one
// domain, the backend's login cookie is first-party and is not blocked.
//
// It also:
//  - fills in share-preview tags (Facebook, Telegram, X) for /trip/... and /article/...
//  - serves /sitemap.xml and /robots.txt for search engines
//  - pings the backend every 10 minutes (cron in wrangler.jsonc) so Render stays awake

const PROXY_PREFIXES = ["/api/", "/auth/", "/media/", "/health"];
const SITE_NAME = "Meakutes-Khmer";
const STATIC_PAGES = ["/", "/discover", "/popular", "/news", "/about", "/terms", "/privacy"];

function isProxyPath(pathname) {
  return PROXY_PREFIXES.some((p) => pathname === p.replace(/\/$/, "") || pathname.startsWith(p));
}

async function proxy(request, env, url) {
  const target = new URL(url.pathname + url.search, env.BACKEND_URL);
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.set("X-Forwarded-Host", url.host);
  headers.set("X-Forwarded-Proto", "https");
  // The visitor's real IP, used by the backend's login rate limits.
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) headers.set("X-Real-IP", ip);
  return fetch(target, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    redirect: "manual",
  });
}

// Reads JSON from the backend, giving up after `ms` so a sleeping server never blocks the page.
async function backendJson(env, path, ms = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(new URL(path, env.BACKEND_URL), {
      signal: controller.signal,
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function absolute(origin, path) {
  if (!path) return null;
  return path.startsWith("http") ? path : origin + (path.startsWith("/") ? path : `/${path}`);
}

function shorten(text, max = 200) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

// Finds the title, text and photo for a trip or article page.
async function pageMeta(env, url) {
  const [, kind, key] = url.pathname.split("/");
  if (!key) return null;
  const slug = decodeURIComponent(key);
  if (kind === "trip") {
    const d = await backendJson(env, `/api/destinations/${encodeURIComponent(slug)}`);
    if (!d) return null;
    return {
      title: `${d.name} · ${SITE_NAME}`,
      description: shorten(d.description || `${d.name}, ${d.province || "Cambodia"}`),
      image: absolute(url.origin, d.images?.[0]?.url),
    };
  }
  if (kind === "article") {
    let n = await backendJson(env, `/api/news/${encodeURIComponent(slug)}`);
    if (!n && /^\d+$/.test(slug)) {
      const all = await backendJson(env, "/api/news");
      n = all?.find((x) => String(x.id) === slug) || null;
    }
    if (!n) return null;
    return {
      title: `${n.title} · ${SITE_NAME}`,
      description: shorten(n.description || n.title),
      image: absolute(url.origin, n.image?.url),
    };
  }
  return null;
}

function rewritePage(response, url, meta) {
  const href = url.origin + url.pathname;
  const set = (value) => ({ element: (el) => el.setAttribute("content", value) });
  const makeAbsolute = { element: (el) => el.setAttribute("content", absolute(url.origin, el.getAttribute("content"))) };
  let rw = new HTMLRewriter()
    .on('meta[property="og:url"]', set(href))
    .on('link[rel="canonical"]', { element: (el) => el.setAttribute("href", href) });
  if (meta) {
    rw = rw
      .on("title", { element: (el) => el.setInnerContent(meta.title) })
      .on('meta[name="description"]', set(meta.description))
      .on('meta[property="og:title"]', set(meta.title))
      .on('meta[property="og:description"]', set(meta.description))
      .on('meta[property="og:type"]', set("article"))
      .on('meta[name="twitter:title"]', set(meta.title))
      .on('meta[name="twitter:description"]', set(meta.description));
  }
  const image = meta?.image;
  rw = rw
    .on('meta[property="og:image"]', image ? set(image) : makeAbsolute)
    .on('meta[name="twitter:image"]', image ? set(image) : makeAbsolute);
  return rw.transform(response);
}

function xmlEscape(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);
}

async function sitemap(env, url) {
  const [trips, news] = await Promise.all([
    backendJson(env, "/api/destinations", 15000),
    backendJson(env, "/api/news", 15000),
  ]);
  const entries = STATIC_PAGES.map((p) => ({ loc: url.origin + p }));
  for (const d of trips || []) {
    entries.push({ loc: `${url.origin}/trip/${encodeURIComponent(d.slug || d.id)}`, lastmod: d.updated_at });
  }
  for (const n of news || []) {
    entries.push({ loc: `${url.origin}/article/${encodeURIComponent(n.slug || n.id)}`, lastmod: n.created_at });
  }
  const rows = entries.map(
    (e) => `  <url><loc>${xmlEscape(e.loc)}</loc>${e.lastmod ? `<lastmod>${xmlEscape(String(e.lastmod).slice(0, 10))}</lastmod>` : ""}</url>`
  );
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    rows.join("\n") +
    "\n</urlset>\n";
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}

function robots(url) {
  const body = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /profile\nDisallow: /api/\n\nSitemap: ${url.origin}/sitemap.xml\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (isProxyPath(url.pathname)) {
      if (!env.BACKEND_URL) return new Response("BACKEND_URL is not set", { status: 500 });
      return proxy(request, env, url);
    }
    if (url.pathname === "/sitemap.xml") return sitemap(env, url);
    if (url.pathname === "/robots.txt") return robots(url);

    // Everything else: static files, with index.html for React Router paths.
    const response = await env.ASSETS.fetch(request);
    const isHtml = (response.headers.get("Content-Type") || "").includes("text/html");
    if (!isHtml || request.method !== "GET") return response;

    const meta = /^\/(trip|article)\/[^/]+\/?$/.test(url.pathname) ? await pageMeta(env, url) : null;
    return rewritePage(response, url, meta);
  },

  // Runs on the cron in wrangler.jsonc. Render's free plan sleeps after 15 idle minutes.
  async scheduled(_event, env, ctx) {
    if (!env.BACKEND_URL) return;
    ctx.waitUntil(fetch(new URL("/health", env.BACKEND_URL)).catch(() => null));
  },
};
