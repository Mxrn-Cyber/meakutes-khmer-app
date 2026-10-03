import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Image as ImageIcon } from "lucide-react";
import { api } from "../api/client";
import { useConfirm, useToast } from "../components/Feedback";

const STATUS_OPTIONS = ["draft", "published"];

const emptyForm = {
  title: "",
  title_km: "",
  date_label: "",
  event_date: "",
  location: "",
  description: "",
  description_km: "",
  best_time: "",
  accessibility: "",
  status: "draft",
  media_id: null,
};

function toFormState(item) {
  return {
    title: item.title || "",
    title_km: item.title_km || "",
    date_label: item.date_label || "",
    event_date: item.event_date || "",
    location: item.location || "",
    description: item.description || "",
    description_km: item.description_km || "",
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
  "w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 dark:bg-gray-800 dark:text-white dark:ring-gray-700";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</span>
      {children}
    </label>
  );
}

const AdminNews = () => {
  const confirm = useConfirm();
  const toast = useToast();
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
    if (!(await confirm({ title: "Please confirm", message: `Delete "${item.title}"? This cannot be undone.`, confirmLabel: "Delete", danger: true }))) return;
    try {
      await api.deleteNews(item.id);
      toast.success("Item deleted.");
      loadAll();
    } catch (err) {
      toast.error(err.message || "Failed to delete news item");
    }
  };

  if (items === null) {
    return <div className="text-gray-500 dark:text-gray-400">Loading news & events...</div>;
  }

  if (editingId !== null) {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {editingId === "new" ? "New News/Event" : "Edit News/Event"}
          </h1>
          <button onClick={cancel} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl px-4 py-3 text-sm bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl shadow-card ring-1 ring-gray-900/5 dark:ring-white/10 p-6 space-y-5">
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

          <fieldset className="space-y-4 rounded-2xl bg-brand-50/60 p-4 ring-1 ring-brand-100 dark:bg-gray-800/40 dark:ring-white/10">
            <legend className="px-1 text-sm font-semibold text-gray-900 dark:text-white">
              Khmer version <span className="font-normal text-gray-500 dark:text-gray-400">· ភាសាខ្មែរ</span>
            </legend>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Shown when visitors switch the site to Khmer. Leave a field empty to show the English text instead.
              Dates, months, "Nationwide" and province names are translated automatically.
            </p>
            <Field label="Title in Khmer">
              <input
                lang="km"
                value={form.title_km}
                onChange={(e) => setForm({ ...form, title_km: e.target.value })}
                className={inputClass}
                placeholder="ឧ. ពិធីបុណ្យអុំទូក"
              />
            </Field>
            <Field label="Description in Khmer">
              <textarea
                lang="km"
                rows={6}
                value={form.description_km}
                onChange={(e) => setForm({ ...form, description_km: e.target.value })}
                className={inputClass}
              />
            </Field>
          </fieldset>

          <Field label="Cover image (from Media Library; landscape 1920×1080, see Photo guide)">
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
                      className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 ${
                        selected ? "border-brand-600" : "border-transparent"
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
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 ring-1 ring-gray-900/10 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:ring-white/10 dark:hover:bg-gray-800"
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
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">News & Events</h1>
        <button
          onClick={startNew}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
        >
          <Plus size={18} /> New Item
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card ring-1 ring-gray-900/5 dark:ring-white/10 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-gray-100 transition hover:bg-gray-50/60 dark:border-gray-800 dark:hover:bg-gray-800/40">
                <td className="px-4 py-3 flex items-center gap-2 text-gray-900 dark:text-white">
                  {item.image ? (
                    <img src={api.mediaUrl(item.image.url)} className="h-9 w-9 rounded-xl object-cover" />
                  ) : (
                    <ImageIcon size={16} className="text-gray-300" />
                  )}
                  <span className="min-w-0">
                    <span className="block">{item.title}</span>
                    {item.title_km && <span lang="km" className="block text-xs text-gray-500 dark:text-gray-400">{item.title_km}</span>}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.date_label || "-"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === "published"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button title="Edit" aria-label="Edit" onClick={() => startEdit(item)} className="rounded-full p-2 text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-gray-800">
                    <Pencil size={16} />
                  </button>
                  <button title="Delete" aria-label="Delete" onClick={() => handleDelete(item)} className="rounded-full p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-gray-800">
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
