import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Image as ImageIcon } from "lucide-react";
import { api } from "../api/client";
import { useConfirm, useToast } from "../components/useFeedback";
import LocationPicker from "./LocationPicker";
import { PROVINCES } from "../i18n/km";

const STATUS_OPTIONS = ["draft", "published"];

const emptyForm = {
  name: "",
  name_km: "",
  province: "",
  latitude: "",
  longitude: "",
  duration: "",
  access: "",
  accessibility: "",
  best_time: "",
  description: "",
  description_km: "",
  article: "",
  article_km: "",
  status: "draft",
  category_ids: [],
  tag_ids: [],
  media_ids: [],
};

function toFormState(destination) {
  return {
    name: destination.name || "",
    name_km: destination.name_km || "",
    province: destination.province || "",
    latitude: destination.latitude ?? "",
    longitude: destination.longitude ?? "",
    duration: destination.duration || "",
    access: destination.access || "",
    accessibility: destination.accessibility || "",
    best_time: destination.best_time || "",
    description: destination.description || "",
    description_km: destination.description_km || "",
    article: destination.article || "",
    article_km: destination.article_km || "",
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
  const confirm = useConfirm();
  const toast = useToast();
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
    if (!(await confirm({ title: "Please confirm", message: `Delete "${destination.name}"? This cannot be undone.`, confirmLabel: "Delete", danger: true }))) return;
    try {
      await api.deleteDestination(destination.id);
      toast.success("Place deleted.");
      loadAll();
    } catch (err) {
      toast.error(err.message || "Failed to delete destination");
    }
  };

  if (destinations === null) {
    return <div className="text-gray-500 dark:text-gray-400">Loading destinations...</div>;
  }

  if (editingId !== null) {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {editingId === "new" ? "New Destination" : "Edit Destination"}
          </h1>
          <button
            onClick={cancel}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
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
                list="province-options"
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                className={inputClass}
                placeholder="Pick from the list, in English"
              />
              <datalist id="province-options">
                {Object.entries(PROVINCES).map(([en, kh]) => (
                  <option key={en} value={en}>
                    {kh}
                  </option>
                ))}
              </datalist>
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

          <fieldset className="space-y-4 rounded-2xl bg-brand-50/60 p-4 ring-1 ring-brand-100 dark:bg-gray-800/40 dark:ring-white/10">
            <legend className="px-1 text-sm font-semibold text-gray-900 dark:text-white">
              Khmer version <span className="font-normal text-gray-500 dark:text-gray-400">· ភាសាខ្មែរ</span>
            </legend>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Shown when visitors switch the site to Khmer. Leave a field empty to show the English text instead.
            </p>
            <Field label="Name in Khmer">
              <input
                lang="km"
                value={form.name_km}
                onChange={(e) => setForm({ ...form, name_km: e.target.value })}
                className={inputClass}
                placeholder="ឧ. ប្រាសាទអង្គរវត្ត"
              />
            </Field>
            <Field label="Short description in Khmer">
              <textarea
                lang="km"
                rows={3}
                value={form.description_km}
                onChange={(e) => setForm({ ...form, description_km: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Full article in Khmer">
              <textarea
                lang="km"
                rows={8}
                value={form.article_km}
                onChange={(e) => setForm({ ...form, article_km: e.target.value })}
                className={inputClass}
              />
            </Field>
          </fieldset>

          <Field label="Categories">
            <CheckboxGroup items={categories} selected={form.category_ids} onToggle={(id) => toggleInArray("category_ids", id)} />
          </Field>

          <Field label="Tags">
            <CheckboxGroup items={tags} selected={form.tag_ids} onToggle={(id) => toggleInArray("tag_ids", id)} />
          </Field>

          <Field label="Images (from Media Library, click to select — order = click order; the first one is the cover. Landscape 1600×1200, see Photo guide)">
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
                      className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 ${
                        selected ? "border-brand-600" : "border-transparent"
                      }`}
                    >
                      <img src={api.mediaUrl(m.url)} alt={m.alt_text || ""} className="w-full h-full object-cover" />
                      {selected && (
                        <span className="absolute top-1 left-1 bg-brand-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
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
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Destination"}
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
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Destinations</h1>
        <button
          onClick={startNew}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
        >
          <Plus size={18} /> New Destination
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card ring-1 ring-gray-900/5 dark:ring-white/10 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
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
              <tr key={d.id} className="border-t border-gray-100 transition hover:bg-gray-50/60 dark:border-gray-800 dark:hover:bg-gray-800/40">
                <td className="px-4 py-3 flex items-center gap-2 text-gray-900 dark:text-white">
                  {d.images?.[0] ? (
                    <img src={api.mediaUrl(d.images[0].url)} className="h-9 w-9 rounded-xl object-cover" />
                  ) : (
                    <ImageIcon size={16} className="text-gray-300" />
                  )}
                  <span className="min-w-0">
                    <span className="block">{d.name}</span>
                    {d.name_km && <span lang="km" className="block text-xs text-gray-500 dark:text-gray-400">{d.name_km}</span>}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{d.province || "-"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      d.status === "published"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {d.rating?.toFixed?.(1) ?? d.rating} ({d.reviews_count})
                </td>
                <td className="px-4 py-3 text-right">
                  <button title="Edit" aria-label="Edit" onClick={() => startEdit(d)} className="rounded-full p-2 text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-gray-800">
                    <Pencil size={16} />
                  </button>
                  <button title="Delete" aria-label="Delete" onClick={() => handleDelete(d)} className="rounded-full p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-gray-800">
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
  "w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 dark:bg-gray-800 dark:text-white dark:ring-gray-700";

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
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
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
