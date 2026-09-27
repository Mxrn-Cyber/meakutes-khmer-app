import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Image as ImageIcon } from "lucide-react";
import { api } from "../api/client";
import LocationPicker from "./LocationPicker";

const STATUS_OPTIONS = ["draft", "published"];

const emptyForm = {
  name: "",
  province: "",
  latitude: "",
  longitude: "",
  duration: "",
  access: "",
  accessibility: "",
  best_time: "",
  description: "",
  article: "",
  status: "draft",
  category_ids: [],
  tag_ids: [],
  media_ids: [],
};

function toFormState(destination) {
  return {
    name: destination.name || "",
    province: destination.province || "",
    latitude: destination.latitude ?? "",
    longitude: destination.longitude ?? "",
    duration: destination.duration || "",
    access: destination.access || "",
    accessibility: destination.accessibility || "",
    best_time: destination.best_time || "",
    description: destination.description || "",
    article: destination.article || "",
    status: destination.status || "draft",
    category_ids: (destination.categories || []).map((c) => c.id),
    tag_ids: (destination.tags || []).map((t) => t.id),
    media_ids: (destination.images || []).map((m) => m.id),
  };
}

function toPayload(form) {
  return {
    ...form,
    latitude: form.latitude === "" ? null : Number(form.latitude),
    longitude: form.longitude === "" ? null : Number(form.longitude),
  };
}

const AdminDestinations = () => {
  const [destinations, setDestinations] = useState(null);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [media, setMedia] = useState([]);
  const [editingId, setEditingId] = useState(null); // null = list view, "new" or an id = form view
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadAll = () => {
    api.listDestinations({ status: "all" }).then(setDestinations).catch(() => setDestinations([]));
    api.listCategories().then(setCategories).catch(() => setCategories([]));
    api.listTags().then(setTags).catch(() => setTags([]));
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

  const startEdit = (destination) => {
    setForm(toFormState(destination));
    setError("");
    setEditingId(destination.id);
  };

  const cancel = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const toggleInArray = (field, id) => {
    setForm((prev) => {
      const has = prev[field].includes(id);
      return {
        ...prev,
        [field]: has ? prev[field].filter((x) => x !== id) : [...prev[field], id],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = toPayload(form);
      if (editingId === "new") {
        await api.createDestination(payload);
      } else {
        await api.updateDestination(editingId, payload);
      }
      cancel();
      loadAll();
    } catch (err) {
      setError(err.message || "Failed to save destination");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (destination) => {
    if (!window.confirm(`Delete "${destination.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteDestination(destination.id);
      loadAll();
    } catch (err) {
      alert(err.message || "Failed to delete destination");
    }
  };

  if (destinations === null) {
    return <div className="text-gray-500 dark:text-gray-400">Loading destinations...</div>;
  }

  if (editingId !== null) {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingId === "new" ? "New Destination" : "Edit Destination"}
          </h1>
          <button
            onClick={cancel}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
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
            <Field label="Name">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Province">
              <input
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Latitude">
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Longitude">
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                className={inputClass}
              />
            </Field>
            <div className="sm:col-span-2">
              <LocationPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
              />
            </div>
            <Field label="Duration">
              <input
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className={inputClass}
                placeholder="e.g. Half day"
              />
            </Field>
            <Field label="Access">
              <input
                value={form.access}
                onChange={(e) => setForm({ ...form, access: e.target.value })}
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
            <Field label="Best time to visit">
              <input
                value={form.best_time}
                onChange={(e) => setForm({ ...form, best_time: e.target.value })}
                className={inputClass}
              />
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

          <Field label="Short description">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </Field>

          <Field label="Full article">
            <textarea
              rows={8}
              value={form.article}
              onChange={(e) => setForm({ ...form, article: e.target.value })}
              className={inputClass}
            />
          </Field>

          <Field label="Categories">
            <CheckboxGroup items={categories} selected={form.category_ids} onToggle={(id) => toggleInArray("category_ids", id)} />
          </Field>

          <Field label="Tags">
            <CheckboxGroup items={tags} selected={form.tag_ids} onToggle={(id) => toggleInArray("tag_ids", id)} />
          </Field>

          <Field label="Images (from Media Library, click to select — order = click order)">
            {media.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No media uploaded yet. Add images from the Media Library page first.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {media.map((m) => {
                  const selected = form.media_ids.includes(m.id);
                  const order = form.media_ids.indexOf(m.id);
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => toggleInArray("media_ids", m.id)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                        selected ? "border-blue-600" : "border-transparent"
                      }`}
                    >
                      <img src={api.mediaUrl(m.url)} alt={m.alt_text || ""} className="w-full h-full object-cover" />
                      {selected && (
                        <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {order + 1}
                        </span>
                      )}
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
              {saving ? "Saving..." : "Save Destination"}
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Destinations</h1>
        <button
          onClick={startNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          <Plus size={18} /> New Destination
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-left text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Province</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {destinations.map((d) => (
              <tr key={d.id} className="border-t border-gray-100 dark:border-gray-700">
                <td className="px-4 py-3 flex items-center gap-2 text-gray-900 dark:text-white">
                  {d.images?.[0] ? (
                    <img src={api.mediaUrl(d.images[0].url)} className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <ImageIcon size={16} className="text-gray-300" />
                  )}
                  {d.name}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{d.province || "-"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      d.status === "published"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {d.rating?.toFixed?.(1) ?? d.rating} ({d.reviews_count})
                </td>
                <td className="px-4 py-3 text-right">
                  <button title="Edit" aria-label="Edit" onClick={() => startEdit(d)} className="p-2 text-gray-500 hover:text-blue-600">
                    <Pencil size={16} />
                  </button>
                  <button title="Delete" aria-label="Delete" onClick={() => handleDelete(d)} className="p-2 text-gray-500 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {destinations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No destinations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

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

function CheckboxGroup({ items, selected, onToggle }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">None created yet — add some on the Categories & Tags page.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const checked = selected.includes(item.id);
        return (
          <button
            type="button"
            key={item.id}
            onClick={() => onToggle(item.id)}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              checked
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
            }`}
          >
            {item.name}
          </button>
        );
      })}
    </div>
  );
}

export default AdminDestinations;
