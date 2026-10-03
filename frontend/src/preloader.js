// Fades out the splash screen from index.html once the app is ready.
// Kept on screen for at least MIN_MS so it doesn't just flicker on fast connections.
const MIN_MS = 500;
const started = performance.now();
let hidden = false;

export function hidePreloader() {
  if (hidden) return;
  hidden = true;
  const el = document.getElementById("preloader");
  if (!el) {
    document.documentElement.classList.add("app-ready");
    return;
  }
  const wait = Math.max(0, MIN_MS - (performance.now() - started));
  setTimeout(() => {
    el.classList.add("pl-done");
    // Entrance animations (hero text, banners) start now, not hidden behind the splash.
    document.documentElement.classList.add("app-ready");
    setTimeout(() => el.remove(), 500);
  }, wait);
}
