import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { api } from "../api/client";
import { useConfirm, useToast } from "../components/Feedback";
import { useAuth } from "../context/AuthContext";

function TaxonomyPanel({ title, list, onCreate, onRename, onDelete, canDelete }) {
  const confirm = useConfirm();
  const toast = useToast();
  const [items, setItems] = useState(list);
  const [newName, setNewName] = useState("");
  const [newNameKm, setNewNameKm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingNameKm, setEditingNameKm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => setItems(list), [list]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError("");
    try {
      const created = await onCreate(newName.trim(), newNameKm.trim());
      setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setNewNameKm("");
    } catch (err) {
      setError(err.message || "Failed to create");
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditingName(item.name);
    setEditingNameKm(item.name_km || "");
  };

  const saveEdit = async (id) => {
    if (!editingName.trim()) return;
    setError("");
    try {
      const updated = await onRename(id, editingName.trim(), editingNameKm.trim());
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setEditingId(null);
    } catch (err) {
      setError(err.message || "Failed to rename");
    }
  };

  const handleDelete = async (item) => {
    if (!(await confirm({ title: "Please confirm", message: `Delete "${item.name}"? Destinations using it will keep their other tags.`, confirmLabel: "Delete", danger: true }))) return;
    try {
      await onDelete(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success(`"${item.name}" deleted.`);
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card ring-1 ring-gray-900/5 dark:ring-white/10 p-6">
      <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">{title}</h2>

      {error && <p className="mb-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      <form onSubmit={handleCreate} className="flex flex-wrap gap-2 mb-4 sm:flex-nowrap">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={`New ${title === "Categories" ? "category" : "tag"} name`}
          aria-label="Name in English"
          className="min-w-0 flex-1 rounded-xl border-0 bg-white px-3.5 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 dark:bg-gray-800 dark:text-white dark:ring-gray-700"
        />
        <input
          lang="km"
          value={newNameKm}
          onChange={(e) => setNewNameKm(e.target.value)}
          placeholder="ឈ្មោះជាភាសាខ្មែរ (optional)"
          aria-label="Name in Khmer"
          className="min-w-0 flex-1 rounded-xl border-0 bg-white px-3.5 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 dark:bg-gray-800 dark:text-white dark:ring-gray-700"
        />
        <button type="submit" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-sm hover:bg-brand-700" aria-label="Add" title="Add">
          <Plus size={18} />
        </button>
      </form>

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800/60"
          >
            {editingId === item.id ? (
              <div className="mr-2 flex min-w-0 flex-1 flex-col gap-1.5">
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  aria-label="Name in English"
                  className="min-w-0 rounded-lg border-0 bg-white px-2.5 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-brand-600 dark:bg-gray-900 dark:text-white dark:ring-gray-700"
                />
                <input
                  lang="km"
                  value={editingNameKm}
                  onChange={(e) => setEditingNameKm(e.target.value)}
                  placeholder="ឈ្មោះជាភាសាខ្មែរ"
                  aria-label="Name in Khmer"
                  className="min-w-0 rounded-lg border-0 bg-white px-2.5 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-brand-600 dark:bg-gray-900 dark:text-white dark:ring-gray-700"
                />
              </div>
            ) : (
              <span className="min-w-0 text-gray-800 dark:text-gray-200">
                {item.name}
                {item.name_km && <span lang="km" className="ml-2 text-sm text-gray-500 dark:text-gray-400">{item.name_km}</span>}
              </span>
            )}
            <div className="flex items-center gap-1">
              {editingId === item.id ? (
                <>
                  <button onClick={() => saveEdit(item.id)} className="rounded-full p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" aria-label="Save" title="Save">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="rounded-full p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Cancel" title="Cancel">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button title="Edit" aria-label="Edit" onClick={() => startEdit(item)} className="rounded-full p-1.5 text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-gray-700">
                    <Pencil size={16} />
                  </button>
                  {canDelete && (
                    <button title="Delete" aria-label="Delete" onClick={() => handleDelete(item)} className="rounded-full p-1.5 text-gray-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-gray-700">
                      <Trash2 size={16} />
                    </button>
                  )}
                </>
              )}
            </div>
          </li>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">None yet.</p>}
      </ul>
    </div>
  );
}

const AdminTaxonomy = () => {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState(null);
  const [tags, setTags] = useState(null);

  useEffect(() => {
    api.listCategories().then(setCategories).catch(() => setCategories([]));
    api.listTags().then(setTags).catch(() => setTags([]));
  }, []);

  if (categories === null || tags === null) {
    return <div className="text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Categories & Tags</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaxonomyPanel
          title="Categories"
          list={categories}
          onCreate={(name, nameKm) => api.createCategory(name, nameKm)}
          onRename={(id, name, nameKm) => api.renameCategory(id, name, nameKm)}
          onDelete={(id) => api.deleteCategory(id)}
          canDelete={isAdmin}
        />
        <TaxonomyPanel
          title="Tags"
          list={tags}
          onCreate={(name, nameKm) => api.createTag(name, nameKm)}
          onRename={(id, name, nameKm) => api.renameTag(id, name, nameKm)}
          onDelete={(id) => api.deleteTag(id)}
          canDelete={isAdmin}
        />
      </div>
    </div>
  );
};

export default AdminTaxonomy;
