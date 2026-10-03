// Crop shapes and the browser-side crop used by ImageCropper.jsx.
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
