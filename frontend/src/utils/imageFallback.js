// When any <img> on the site fails to load, show a neutral placeholder
// instead of the browser's broken-image icon and alt text.
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
      '<rect width="400" height="300" fill="#e5e7eb"/>' +
      '<path d="M120 210l55-70 40 50 30-35 55 55z" fill="#cbd5e1"/>' +
      '<circle cx="265" cy="110" r="18" fill="#cbd5e1"/>' +
      "</svg>"
  );

export function installImageFallback() {
  window.addEventListener(
    "error",
    (event) => {
      const img = event.target;
      if (!(img instanceof HTMLImageElement) || img.src === PLACEHOLDER) return;
      // Some components set their own fallback on error; if that fails too, end here.
      const tries = Number(img.dataset.fallbackTries || 0) + 1;
      if (tries > 3) return;
      img.dataset.fallbackTries = String(tries);
      img.src = PLACEHOLDER;
    },
    true
  );
}
