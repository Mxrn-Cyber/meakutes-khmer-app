// Thin fetch wrapper for the Meakutes-Khmer FastAPI backend.
// Replaces src/firebase.js as the app's data layer. The backend issues an
// httpOnly session cookie on login/register, so every request is sent with
// credentials: "include" and there is no token to manage on the client.

// Empty string in production: the Cloudflare Worker proxies /api, /auth and
// /media to the backend, so the session cookie stays on the site's own domain.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  if (!isForm && body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });

  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      (payload && payload.detail) || (typeof payload === "string" ? payload : "Request failed");
    throw new ApiError(res.status, message, payload);
  }
  return payload;
}

function toQueryString(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export const api = {
  // ---- auth ----
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  loginWithGoogle: (idToken) => request("/auth/google", { method: "POST", body: { id_token: idToken } }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),
  updateMe: (payload) => request("/auth/me", { method: "PATCH", body: payload }),
  changePassword: (payload) => request("/auth/me/password", { method: "POST", body: payload }),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/auth/me/avatar", { method: "POST", body: form, isForm: true });
  },

  // ---- destinations ----
  listDestinations: (params) => request(`/api/destinations${toQueryString(params)}`),
  getDestination: (idOrSlug) => request(`/api/destinations/${idOrSlug}`),
  createDestination: (payload) => request("/api/destinations", { method: "POST", body: payload }),
  updateDestination: (id, payload) =>
    request(`/api/destinations/${id}`, { method: "PUT", body: payload }),
  deleteDestination: (id) => request(`/api/destinations/${id}`, { method: "DELETE" }),

  // ---- categories & tags ----
  listCategories: () => request("/api/categories"),
  createCategory: (name) => request("/api/categories", { method: "POST", body: { name } }),
  renameCategory: (id, name) => request(`/api/categories/${id}`, { method: "PUT", body: { name } }),
  deleteCategory: (id) => request(`/api/categories/${id}`, { method: "DELETE" }),
  listTags: () => request("/api/tags"),
  createTag: (name) => request("/api/tags", { method: "POST", body: { name } }),
  renameTag: (id, name) => request(`/api/tags/${id}`, { method: "PUT", body: { name } }),
  deleteTag: (id) => request(`/api/tags/${id}`, { method: "DELETE" }),

  // ---- news & events ----
  listNews: (params) => request(`/api/news${toQueryString(params)}`),
  getNews: (slug) => request(`/api/news/${slug}`),
  createNews: (payload) => request("/api/news", { method: "POST", body: payload }),
  updateNews: (id, payload) => request(`/api/news/${id}`, { method: "PUT", body: payload }),
  deleteNews: (id) => request(`/api/news/${id}`, { method: "DELETE" }),

  // ---- media ----
  listMedia: () => request("/api/media"),
  uploadMedia: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/api/media", { method: "POST", body: form, isForm: true });
  },
  deleteMedia: (id) => request(`/api/media/${id}`, { method: "DELETE" }),

  // ---- reviews ----
  listReviews: (destinationId) => request(`/api/reviews${toQueryString({ destination_id: destinationId })}`),
  adminListReviews: (params) => request(`/api/reviews${toQueryString({ status: "all", ...params })}`),
  createReview: (payload) => request("/api/reviews", { method: "POST", body: payload }),
  moderateReview: (id, newStatus) =>
    request(`/api/reviews/${id}/moderate${toQueryString({ new_status: newStatus })}`, { method: "PATCH" }),
  deleteReview: (id) => request(`/api/reviews/${id}`, { method: "DELETE" }),

  // ---- favorites ----
  listFavorites: () => request("/api/favorites"),
  addFavorite: (destinationId) => request(`/api/favorites/${destinationId}`, { method: "POST" }),
  removeFavorite: (destinationId) => request(`/api/favorites/${destinationId}`, { method: "DELETE" }),

  // ---- admin: users ----
  adminListUsers: () => request("/api/admin/users"),
  adminSetUserRoles: (id, roles) =>
    request(`/api/admin/users/${id}/roles`, { method: "PUT", body: { roles } }),
  adminSetUserActive: (id, isActive) =>
    request(`/api/admin/users/${id}/active`, { method: "PUT", body: { is_active: isActive } }),

  mediaUrl: (path) => (path?.startsWith("http") ? path : `${API_BASE_URL}${path}`),
};

export { ApiError, API_BASE_URL };
