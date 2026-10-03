import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { RotateCw, ZoomIn, X } from "lucide-react";
import { useLang } from "../i18n";

// Crop / zoom / rotate dialog.
//   <ImageCropper src={url} aspect={4/3} lockAspect onCancel={...} onDone={({ pixels, rotation }) => ...}
//     extraAction={{ label: "Upload as is", onClick }} />
// `pixels` is the crop rectangle in the original image's pixels (after rotation), ready for
// cropFileToBlob() (new files, in the browser) or api.cropMedia() (existing images, on the server).

export const ASPECTS = [
  { key: "4:3", value: 4 / 3, label: "4:3 Photo" },
  { key: "16:9", value: 16 / 9, label: "16:9 Banner" },
  { key: "1:1", value: 1, label: "1:1 Square" },
  { key: "free", value: null, label: "Original shape" },
];

export const MAX_WIDTH = 1920;

export function outputSize(pixels, maxWidth = MAX_WIDTH) {
  if (!pixels) return null;
  const scale = Math.min(1, maxWidth / pixels.width);
  return { w: Math.round(pixels.width * scale), h: Math.round(pixels.height * scale) };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Crop, rotate and shrink a local file in the browser. Returns a WebP (or JPEG) Blob. */
export async function cropFileToBlob(file, pixels, rotation = 0, maxWidth = MAX_WIDTH) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const turned = rotation % 180 !== 0;
    const rw = turned ? img.naturalHeight : img.naturalWidth;
    const rh = turned ? img.naturalWidth : img.naturalHeight;

    // 1) draw the whole image rotated
    const rotated = document.createElement("canvas");
    rotated.width = rw;
    rotated.height = rh;
    const rctx = rotated.getContext("2d");
    rctx.translate(rw / 2, rh / 2);
    rctx.rotate((rotation * Math.PI) / 180);
    rctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

    // 2) cut out the crop and scale it down
    const { w, h } = outputSize(pixels, maxWidth);
    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const octx = out.getContext("2d");
    octx.imageSmoothingQuality = "high";
    octx.drawImage(rotated, pixels.x, pixels.y, pixels.width, pixels.height, 0, 0, w, h);

    const blob = await new Promise((resolve) => out.toBlob(resolve, "image/webp", 0.85));
    if (blob && blob.type === "image/webp") return blob;
    return await new Promise((resolve) => out.toBlob(resolve, "image/jpeg", 0.88)); // older Safari
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Turn a Blob into a File with a sensible name for upload. */
export function blobToFile(blob, originalName = "photo") {
  const base = originalName.replace(/\.[^.]+$/, "") || "photo";
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `${base}.${ext}`, { type: blob.type });
}

export default function ImageCropper({
  src,
  title = "Crop photo",
  aspect: initialAspect = 4 / 3,
  lockAspect = false,
  minSize, // { w, h } recommended minimum, for a warning
  doneLabel = "Crop and save",
  extraAction,
  busy = false,
  onCancel,
  onDone,
}) {
  const { t } = useLang();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(initialAspect);
  const [natural, setNatural] = useState(null);
  const [pixels, setPixels] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  const onComplete = useCallback((_, areaPixels) => setPixels(areaPixels), []);
  const free = aspect == null;
  const turned = rotation % 180 !== 0;
  const freeAspect = natural ? (turned ? natural.h / natural.w : natural.w / natural.h) : 4 / 3;
  const size = outputSize(pixels);
  const small = size && minSize && (size.w < minSize.w || size.h < minSize.h);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade-in bg-gray-950/70 backdrop-blur-sm" onClick={() => !busy && onCancel()} />
      <div className="relative flex max-h-[95vh] w-full max-w-3xl animate-zoom-in flex-col overflow-hidden rounded-t-3xl bg-white shadow-lift dark:bg-gray-900 sm:rounded-3xl">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <button type="button" onClick={onCancel} disabled={busy} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={t("crop.close")}>
            <X size={20} />
          </button>
        </div>

        <div className="relative h-[52vh] min-h-[280px] bg-gray-950">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={free ? freeAspect : aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
            onMediaLoaded={(m) => setNatural({ w: m.naturalWidth, h: m.naturalHeight })}
            restrictPosition
            showGrid
            zoomWithScroll
          />
        </div>

        <div className="space-y-4 p-5">
          {!lockAspect && (
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("crop.shape")}>
              {ASPECTS.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  role="radio"
                  aria-checked={aspect === a.value}
                  onClick={() => {
                    setAspect(a.value);
                    setZoom(1);
                  }}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition active:scale-95 ${
                    aspect === a.value
                      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                      : "bg-white text-gray-700 ring-1 ring-gray-900/10 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-white/10"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex min-w-[200px] flex-1 items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <ZoomIn size={18} className="shrink-0" />
              <span className="sr-only">{t("crop.zoom")}</span>
              <input
                type="range"
                min={1}
                max={4}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-brand-600"
              />
            </label>
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-gray-900/10 transition hover:bg-gray-50 active:scale-95 dark:text-gray-200 dark:ring-white/10 dark:hover:bg-gray-800"
            >
              <RotateCw size={16} /> {t("crop.rotate")}
            </button>
          </div>

          {size && (
            <p className={`text-sm ${small ? "text-amber-700 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"}`}>
              {t("crop.size", { w: size.w, h: size.h })}
              {small && minSize ? ` · ${t("crop.small", { w: minSize.w, h: minSize.h })}` : ""}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-900/10 hover:bg-gray-50 dark:text-gray-200 dark:ring-white/10 dark:hover:bg-gray-800"
            >
              {t("common.cancel")}
            </button>
            {extraAction && (
              <button
                type="button"
                onClick={extraAction.onClick}
                disabled={busy}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-gray-900 ring-1 ring-gray-900/10 hover:bg-gray-50 dark:text-white dark:ring-white/10 dark:hover:bg-gray-800"
              >
                {extraAction.label}
              </button>
            )}
            <button
              type="button"
              disabled={busy || !pixels}
              onClick={() => onDone({ pixels, rotation })}
              className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[.98] disabled:opacity-60"
            >
              {busy ? t("common.saving") : doneLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
