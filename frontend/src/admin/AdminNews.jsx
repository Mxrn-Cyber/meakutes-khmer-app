import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Image as ImageIcon } from "lucide-react";
import { api } from "../api/client";

const STATUS_OPTIONS = ["draft", "published"];

const emptyForm = {
  title: "",
  date_label: "",
  event_date: "",
  location: "",
  description: "",
  best_time: "",
  accessibility: "",
  status: "draft",
  media_id: null,
};

function toFormState(item) {
  return {
    title: item.title || "",
    date_label: item.date_label || "",
    event_date: item.event_date || "",
    location: item.location || "",
    description: item.description || "",
    best_time: item.best_time || "",
    accessibility: item.accessibility || "",
    status: item.status || "draft",
    media_id: item.image?.id ?? null,
  };
}

function toPayload(form) {
  return {
    ...form,
    event_date: form.event_date === "" ? null : form.event_date,
  };
}

const inputClass =
  "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</span>
      {children}
    </label>
  );
}

const AdminNews = () => {
  const [items, setItems] = useState(null);
  const [media, setMedia] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadAll = () => {
    api.listNews({ status: "all" }).then(setItems).catch(() => setItems([]));
    api.listMedia().then(setMedia).catch(() => setMedia([]));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const startNew = () => {
    setForm(emptyForm);
    setError("");
    setEditingId("new");
  };

  const startEdit = (item) => {
    setForm(toFormState(item));
    setError("");
    setEditingId(item.id);
  };

  const cancel = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = toPayload(form);
      if (editingId === "new") {
        await api.createNews(payload);
      } else {
        await api.updateNews(editingId, payload);
      }
      cancel();
      loadAll();
    } catch (err) {
      setError(err.message || "Failed to save news item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await api.deleteNews(item.id);
      loadAll();
    } catch (err) {
      alert(err.message || "Failed to delete news item");
    }
  };

  if (items === null) {
    return <div className="text-gray-500 dark:text-gray-400">Loading news & events...</div>;
  }

  if (editingId !== null) {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingId === "new" ? "New News/Event" : "Edit News/Event"}
          </h1>
          <button onClick={cancel} className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Title">
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Date label (free text, e.g. 'April 2026')">
              <input
                value={form.date_label}
                onChange={(e) => setForm({ ...form, date_label: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Event date (optional, for sorting)">
              <input
                type="date"
                value={form.event_date || ""}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Location">
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Best time">
              <input
                value={form.best_time}
                onChange={(e) => setForm({ ...form, best_time: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Accessibility">
              <select
                value={form.accessibility || ""}
                onChange={(e) => setForm({ ...form, accessibility: e.target.value })}
                className={inputClass}
              >
                <option value="">-</option>
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Challenging">Challenging</option>
              </select>
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Description">
            <textarea
              rows={6}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </Field>

          <Field label="Cover image (from Media Library)">
            {media.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No media uploaded yet. Add images from the Media Library page first.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {media.map((m) => {
                  const selected = form.media_id === m.id;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setForm({ ...form, media_id: selected ? null : m.id })}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                        selected ? "border-blue-600" : "border-transparent"
                      }`}
                    >
                      <img src={api.mediaUrl(m.url)} alt={m.alt_text || ""} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}
          </Field>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">News & Events</h1>
        <button
          onClick={startNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          <Plus size={18} /> New Item
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-left text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-gray-100 dark:border-gray-700">
                <td className="px-4 py-3 flex items-center gap-2 text-gray-900 dark:text-white">
                  {item.image ? (
                    <img src={api.mediaUrl(item.image.url)} className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <ImageIcon size={16} className="text-gray-300" />
                  )}
                  {item.title}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.date_label || "-"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === "published"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button title="Edit" aria-label="Edit" onClick={() => startEdit(item)} className="p-2 text-gray-500 hover:text-blue-600">
                    <Pencil size={16} />
                  </button>
                  <button title="Delete" aria-label="Delete" onClick={() => handleDelete(item)} className="p-2 text-gray-500 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No news or events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminNews;
