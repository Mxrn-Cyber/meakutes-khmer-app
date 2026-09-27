import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

function TaxonomyPanel({ title, list, onCreate, onRename, onDelete, canDelete }) {
  const [items, setItems] = useState(list);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => setItems(list), [list]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError("");
    try {
      const created = await onCreate(newName.trim());
      setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
    } catch (err) {
      setError(err.message || "Failed to create");
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const saveEdit = async (id) => {
    if (!editingName.trim()) return;
    setError("");
    try {
      const updated = await onRename(id, editingName.trim());
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setEditingId(null);
    } catch (err) {
      setError(err.message || "Failed to rename");
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"? Destinations using it will keep their other tags.`)) return;
    try {
      await onDelete(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      alert(err.message || "Failed to delete");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h2>

      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>}

      <form onSubmit={handleCreate} className="flex gap-2 mb-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={`New ${title.toLowerCase().slice(0, -1)} name`}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} />
        </button>
      </form>

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
          >
            {editingId === item.id ? (
              <input
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white mr-2"
              />
            ) : (
              <span className="text-gray-800 dark:text-gray-200">{item.name}</span>
            )}
            <div className="flex items-center gap-1">
              {editingId === item.id ? (
                <>
                  <button onClick={() => saveEdit(item.id)} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button title="Edit" aria-label="Edit" onClick={() => startEdit(item)} className="p-1.5 text-gray-500 hover:text-blue-600">
                    <Pencil size={16} />
                  </button>
                  {canDelete && (
                    <button title="Delete" aria-label="Delete" onClick={() => handleDelete(item)} className="p-1.5 text-gray-500 hover:text-red-600">
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Categories & Tags</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaxonomyPanel
          title="Categories"
          list={categories}
          onCreate={(name) => api.createCategory(name)}
          onRename={(id, name) => api.renameCategory(id, name)}
          onDelete={(id) => api.deleteCategory(id)}
          canDelete={isAdmin}
        />
        <TaxonomyPanel
          title="Tags"
          list={tags}
          onCreate={(name) => api.createTag(name)}
          onRename={(id, name) => api.renameTag(id, name)}
          onDelete={(id) => api.deleteTag(id)}
          canDelete={isAdmin}
        />
      </div>
    </div>
  );
};

export default AdminTaxonomy;
