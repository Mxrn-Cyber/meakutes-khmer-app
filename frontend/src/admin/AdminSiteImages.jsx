import { useEffect, useRef, useState } from "react";
import { ImagePlus, RotateCcw, Upload, X, Check, ExternalLink } from "lucide-react";
import { api } from "../api/client";
import { useConfirm, useToast } from "../components/useFeedback";
import { RATIO } from "../components/styles";
import { FadeImg } from "../components/motion";
import { SITE_IMAGE_GROUPS } from "../siteImagesConfig";
import { useSiteImagesAdmin } from "../useSiteImages";
import km from "../i18n/km";
import ImageCropper from "../components/ImageCropper";
import { cropFileToBlob, blobToFile } from "../components/imageCrop";
import en from "../i18n/en";

const SHAPES = {
  photo: { ratio: RATIO.photo, label: "4:3", size: "1600 × 1200 px", aspect: 4 / 3, min: { w: 1200, h: 900 } },
  banner: { ratio: RATIO.banner, label: "16:9", size: "1920 × 1080 px", aspect: 16 / 9, min: { w: 1600, h: 900 } },
  square: { ratio: RATIO.square, label: "1:1", size: "600 × 600 px", aspect: 1, min: { w: 400, h: 400 } },
};
const roundCrop = (p) => ({ x: Math.round(p.x), y: Math.round(p.y), width: Math.round(p.width), height: Math.round(p.height) });

const inputClass =
  "w-full rounded-xl border-0 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 disabled:opacity-50 dark:bg-gray-800 dark:text-white dark:ring-gray-700";

function MediaPicker({ slot, onClose, onPick }) {
  const toast = useToast();
  const [media, setMedia] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [cropping, setCropping] = useState(null); // { file, url } or { media }
  const fileRef = useRef(null);
  const shape = SHAPES[slot.shape];

  useEffect(() => {
    api.listMedia().then(setMedia).catch(() => setMedia([]));
    const onKey = (e) => e.key === "Escape" && !cropping && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, cropping]);

  useEffect(() => () => cropping?.url && URL.revokeObjectURL(cropping.url), [cropping]);

  // Every photo goes through the cropper, already set to this slot's shape.
  const startUpload = (file) => {
    if (fileRef.current) fileRef.current.value = "";
    if (file) setCropping({ file, url: URL.createObjectURL(file) });
  };

  const uploadFile = async (file) => {
    setUploading(true);
    try {
      onPick(await api.uploadMedia(file));
    } catch (err) {
      toast.error(err.message || "Upload failed");
      setUploading(false);
    }
  };

  const finishCrop = async ({ pixels, rotation }) => {
    setUploading(true);
    try {
      if (cropping.file) {
        const blob = await cropFileToBlob(cropping.file, pixels, rotation);
        onPick(await api.uploadMedia(blobToFile(blob, cropping.file.name)));
      } else {
        onPick(await api.cropMedia(cropping.media.id, { ...roundCrop(pixels), rotation }));
      }
    } catch (err) {
      toast.error(err.message || "Could not crop this photo");
      setUploading(false);
    }
  };

  const useAsIs = () => (cropping.file ? uploadFile(cropping.file) : onPick(cropping.media));

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Choose a photo for ${slot.label}`}>
      <div className="absolute inset-0 animate-fade-in bg-gray-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-4xl animate-zoom-in flex-col overflow-hidden rounded-t-3xl bg-white shadow-lift dark:bg-gray-900 sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Choose a photo: {slot.label}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Shown as {shape.label}. Best size {shape.size}, landscape, subject in the middle.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <label className="mb-5 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/50 px-4 py-6 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-800/40 dark:text-brand-300">
            <Upload size={18} />
            {uploading ? "Uploading…" : "Upload a new photo from your computer"}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => startUpload(e.target.files?.[0])}
            />
          </label>

          <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Or pick from the Media Library</p>
          {media === null ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className={`skeleton ${RATIO.photo} rounded-xl`} />
              ))}
            </div>
          ) : media.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">No photos uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {media.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setCropping({ media: m })}
                  className={`group relative ${shape.ratio} overflow-hidden rounded-xl bg-gray-100 ring-2 ring-transparent transition hover:ring-brand-500 focus-visible:ring-brand-500 dark:bg-gray-800`}
                >
                  <FadeImg src={api.mediaUrl(m.url)} alt={m.alt_text || ""} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute inset-0 grid place-items-center bg-brand-600/0 text-white opacity-0 transition group-hover:bg-brand-600/30 group-hover:opacity-100">
                    <Check size={28} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {cropping && (
        <ImageCropper
          src={cropping.url || api.mediaUrl(cropping.media.url)}
          title={`Fit the photo to ${slot.label} (${shape.label})`}
          aspect={shape.aspect}
          lockAspect
          minSize={shape.min}
          doneLabel="Crop and use"
          busy={uploading}
          extraAction={{ label: "Use as is", onClick: useAsIs }}
          onCancel={() => setCropping(null)}
          onDone={finishCrop}
        />
      )}
    </div>
  );
}

function SlotCard({ slot, row, onChange, onReset, onSaveCaption, index }) {
  const shape = SHAPES[slot.shape];
  const isSlide = slot.caption != null;
  const custom = Boolean(row?.url);
  const src = custom ? api.mediaUrl(row.url) : slot.src;
  const [caption, setCaption] = useState(row?.caption || "");
  const [captionKm, setCaptionKm] = useState(row?.caption_km || "");
  useEffect(() => {
    setCaption(row?.caption || "");
    setCaptionKm(row?.caption_km || "");
  }, [row?.caption, row?.caption_km]);
  const captionChanged = custom && (caption !== (row?.caption || "") || captionKm !== (row?.caption_km || ""));

  return (
    <article
      data-reveal=""
      style={{ "--reveal-delay": `${Math.min(index, 6) * 60}ms` }}
      className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10"
    >
      <div className={`relative ${slot.shape === "square" ? RATIO.photo : shape.ratio} overflow-hidden bg-gray-100 dark:bg-gray-800`}>
        <FadeImg
          key={src}
          src={src}
          alt=""
          className={
            slot.shape === "square"
              ? `absolute left-1/2 top-1/2 h-3/4 -translate-x-1/2 -translate-y-1/2 ${RATIO.square} rounded-2xl object-cover shadow-lift`
              : "h-full w-full object-cover"
          }
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow ${
            custom ? "bg-emerald-500 text-white" : "bg-white/90 text-gray-700"
          }`}
        >
          {custom ? "Your photo" : "Default photo"}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white">{shape.label}</span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{slot.label}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Best: {shape.size}</p>
        </div>

        {isSlide && (
          <div className="space-y-2">
            <input
              value={custom ? caption : en.home.slides[slot.caption]}
              onChange={(e) => setCaption(e.target.value)}
              disabled={!custom}
              placeholder="Caption in English"
              aria-label="Caption in English"
              className={inputClass}
            />
            <input
              lang="km"
              value={custom ? captionKm : km.home.slides[slot.caption]}
              onChange={(e) => setCaptionKm(e.target.value)}
              disabled={!custom}
              placeholder="ចំណងជើងរូបភាពជាភាសាខ្មែរ"
              aria-label="Caption in Khmer"
              className={inputClass}
            />
            {!custom && <p className="text-xs text-gray-500 dark:text-gray-400">Choose your own photo to change the caption.</p>}
            {captionChanged && (
              <button
                type="button"
                onClick={() => onSaveCaption(slot, row, caption, captionKm)}
                className="w-full rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 active:scale-[.98] dark:bg-white dark:text-gray-900"
              >
                Save caption
              </button>
            )}
          </div>
        )}

        <div className="mt-auto flex gap-2">
          <button
            type="button"
            onClick={() => onChange(slot)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[.98]"
          >
            <ImagePlus size={16} /> Change photo
          </button>
          {custom && (
            <button
              type="button"
              onClick={() => onReset(slot)}
              title="Go back to the default photo"
              aria-label={`Reset ${slot.label} to the default photo`}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-gray-500 ring-1 ring-gray-900/10 transition hover:bg-gray-50 hover:text-gray-800 dark:ring-white/10 dark:hover:bg-gray-800"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function AdminSiteImages() {
  const confirm = useConfirm();
  const toast = useToast();
  const { custom, reload } = useSiteImagesAdmin();
  const [picking, setPicking] = useState(null);

  useEffect(() => {
    reload();
  }, [reload]);

  const choose = async (media) => {
    const slot = picking;
    setPicking(null);
    try {
      const row = custom[slot.key];
      await api.setSiteImage(slot.key, { media_id: media.id, caption: row?.caption || null, caption_km: row?.caption_km || null });
      await reload();
      toast.success(`${slot.label} updated. It shows on the website now.`);
    } catch (err) {
      toast.error(err.message || "Could not save the photo");
    }
  };

  const saveCaption = async (slot, row, caption, captionKm) => {
    try {
      await api.setSiteImage(slot.key, { media_id: row.media_id, caption, caption_km: captionKm });
      await reload();
      toast.success("Caption saved.");
    } catch (err) {
      toast.error(err.message || "Could not save the caption");
    }
  };

  const reset = async (slot) => {
    if (!(await confirm({ title: "Use the default photo?", message: `${slot.label} will go back to the original photo. Your photo stays in the Media Library.`, confirmLabel: "Use default" }))) return;
    try {
      await api.resetSiteImage(slot.key);
      await reload();
      toast.success(`${slot.label} is back to the default photo.`);
    } catch (err) {
      toast.error(err.message || "Could not reset the photo");
    }
  };

  let index = 0;
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Site photos</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
            Change the big photos on the public website. Pick a photo from the Media Library or upload a new one. Changes show
            on the website right away; use the reset button to go back to the original.
          </p>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">
          View website <ExternalLink size={14} />
        </a>
      </div>

      <div className="space-y-10">
        {SITE_IMAGE_GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{group.title}</h2>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{group.hint}</p>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {group.slots.map((slot) => (
                <SlotCard
                  key={slot.key}
                  slot={slot}
                  row={custom[slot.key]}
                  index={index++}
                  onChange={setPicking}
                  onReset={reset}
                  onSaveCaption={saveCaption}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {picking && <MediaPicker slot={picking} onClose={() => setPicking(null)} onPick={choose} />}
    </div>
  );
}
