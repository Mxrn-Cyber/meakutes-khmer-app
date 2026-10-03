import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Copy, Ruler, ChevronDown } from "lucide-react";
import { api } from "../api/client";
import { useConfirm, useToast } from "../components/Feedback";
import { useAuth } from "../context/AuthContext";
import { RATIO } from "../components/ui";

// Keep in sync with RATIO in components/ui.jsx.
const SHAPES = [
  { name: "Photo 4:3", ratio: RATIO.photo, size: "1600 × 1200", min: "1200 × 900", use: "Place cards, gallery, event cards, thumbnails, About photo" },
  { name: "Banner 16:9", ratio: RATIO.banner, size: "1920 × 1080", min: "1600 × 900", use: "Page banners, event header, featured event, big gallery photo" },
  { name: "Square 1:1", ratio: RATIO.square, size: "600 × 600", min: "400 × 400", use: "Profile and team photos" },
];
const MIN_W = 1200;
const MIN_H = 900;

function readSize(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

function sizeProblems(name, size) {
  if (!size) return [];
  const out = [];
  if (size.w < MIN_W || size.h < MIN_H) out.push(`${name} is ${size.w}×${size.h}, smaller than ${MIN_W}×${MIN_H}, so it may look blurry.`);
  if (size.h > size.w) out.push(`${name} is portrait; the site shows photos in landscape, so the top and bottom will be cut.`);
  return out;
}

function ratioLabel(w, h) {
  const r = w / h;
  if (Math.abs(r - 4 / 3) < 0.04) return "4:3";
  if (Math.abs(r - 16 / 9) < 0.05) return "16:9";
  if (Math.abs(r - 1) < 0.03) return "1:1";
  return r > 1 ? "wide" : "portrait";
}

function SizeBadge({ size }) {
  if (!size) return null;
  const small = size.w < MIN_W || size.h < MIN_H;
  const label = ratioLabel(size.w, size.h);
  const odd = label === "portrait";
  return (
    <span
      className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow ${
        small || odd ? "bg-amber-400 text-gray-900" : "bg-white/90 text-gray-800"
      }`}
      title={small ? "Smaller than the recommended size" : odd ? "Portrait photo: will be cropped" : "Good size"}
    >
      {size.w}×{size.h} · {label}
    </span>
  );
}

function PhotoGuide() {
  const [open, setOpen] = useState(true);
  return (
    <section className="mb-6 rounded-2xl bg-white p-5 shadow-card ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open}>
        <span className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
          <Ruler size={18} className="text-brand-600" /> Photo guide
        </span>
        <ChevronDown size={18} className={`text-gray-500 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-4 space-y-5 text-sm text-gray-600 dark:text-gray-300">
          <div className="grid gap-4 sm:grid-cols-3">
            {SHAPES.map((s) => (
              <div key={s.name} className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
                <div className={`${s.ratio} h-20 grid place-items-center rounded-lg bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200`}>
                  {s.name}
                </div>
                <p className="mt-2 font-semibold text-gray-900 dark:text-white">{s.size} px</p>
                <p className="text-xs">Smallest: {s.min} px</p>
                <p className="mt-1 text-xs">{s.use}</p>
              </div>
            ))}
          </div>
          <ul className="list-disc space-y-1 pl-5">
            <li>Use <b>landscape</b> photos. One 1920 × 1080 or 1600 × 1200 photo works everywhere: the site crops it to each shape.</li>
            <li>Keep the main subject in the <b>middle</b>. Cards cut the sides of wide photos; banners cut the top and bottom.</li>
            <li>Avoid posters or photos with <b>text</b> on them; the text gets cut off. Put words in the description instead.</li>
            <li>Save as <b>JPEG or WebP</b>, under 1 MB if you can (the limit is 8 MB). Big PNGs make phones slow.</li>
            <li>Only upload photos you took or have permission to use. Do not upload photos where children can be identified.</li>
          </ul>
        </div>
      )}
    </section>
  );
}

const AdminMedia = () => {
  const confirm = useConfirm();
  const toast = useToast();
  const { isAdmin } = useAuth();
  const [media, setMedia] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [sizes, setSizes] = useState({});
  const fileInputRef = useRef(null);

  const load = () => api.listMedia().then(setMedia).catch(() => setMedia([]));

  useEffect(() => {
    load();
  }, []);

  const handleFiles = async (files) => {
    setError("");
    setUploading(true);
    const warnings = [];
    try {
      for (const file of files) {
        warnings.push(...sizeProblems(file.name, await readSize(file)));
        await api.uploadMedia(file);
      }
      load();
      if (warnings.length) toast.info(`Uploaded, but please check: ${warnings.join(" ")}`);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (item) => {
    if (!(await confirm({ title: "Please confirm", message: "Delete this image? It will be removed from any destination or news item using it.", confirmLabel: "Delete", danger: true }))) return;
    try {
      await api.deleteMedia(item.id);
      toast.success("Image deleted.");
      load();
    } catch (err) {
      toast.error(err.message || "Failed to delete image");
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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Media Library</h1>
        <label className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 cursor-pointer">
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
        <div className="mb-4 rounded-xl px-4 py-3 text-sm bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-900">
          {error}
        </div>
      )}

      <PhotoGuide />

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Previews below are cropped to 4:3, the way most of the site shows them. A yellow label means the photo is small or
        portrait. Attach images to places and news items from their edit pages.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {media.map((item) => (
          <div key={item.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-card ring-1 ring-gray-900/5 dark:ring-white/10 overflow-hidden group relative">
            <img
              src={api.mediaUrl(item.url)}
              alt={item.alt_text || ""}
              className={`w-full ${RATIO.photo} object-cover`}
              onLoad={(e) => {
                const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                setSizes((prev) => (prev[item.id] ? prev : { ...prev, [item.id]: { w, h } }));
              }}
            />
            <SizeBadge size={sizes[item.id]} />
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
                  className="p-2 bg-white/90 rounded-full text-rose-600 hover:bg-white"
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
