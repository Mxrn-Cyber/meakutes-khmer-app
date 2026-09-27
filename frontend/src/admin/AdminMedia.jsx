import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Copy } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const AdminMedia = () => {
  const { isAdmin } = useAuth();
  const [media, setMedia] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const load = () => api.listMedia().then(setMedia).catch(() => setMedia([]));

  useEffect(() => {
    load();
  }, []);

  const handleFiles = async (files) => {
    setError("");
    setUploading(true);
    try {
      for (const file of files) {
        await api.uploadMedia(file);
      }
      load();
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm("Delete this image? It will be removed from any destination or news item using it.")) return;
    try {
      await api.deleteMedia(item.id);
      load();
    } catch (err) {
      alert(err.message || "Failed to delete image");
    }
  };

  const copyUrl = (item) => {
    navigator.clipboard?.writeText(api.mediaUrl(item.url));
  };

  if (media === null) {
    return <div className="text-gray-500 dark:text-gray-400">Loading media library...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Media Library</h1>
        <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 cursor-pointer">
          <Upload size={18} />
          {uploading ? "Uploading..." : "Upload Images"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => e.target.files.length && handleFiles(Array.from(e.target.files))}
          />
        </label>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        PNG, JPEG, WebP or GIF, up to 8MB each. Attach uploaded images to destinations and news items from their edit pages.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {media.map((item) => (
          <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden group relative">
            <img src={api.mediaUrl(item.url)} alt={item.alt_text || ""} className="w-full aspect-square object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => copyUrl(item)}
                title="Copy URL"
                className="p-2 bg-white/90 rounded-full text-gray-800 hover:bg-white"
              >
                <Copy size={16} />
              </button>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(item)}
                  title="Delete"
                  className="p-2 bg-white/90 rounded-full text-red-600 hover:bg-white"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
        {media.length === 0 && (
          <p className="col-span-full text-center text-gray-400 py-16">No images uploaded yet.</p>
        )}
      </div>
    </div>
  );
};

export default AdminMedia;
