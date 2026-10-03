// Shared class names and photo shapes (Tailwind).
// Photo shapes used across the site. Upload guide: Admin > Media Library.
//   photo  4:3  cards, thumbnails, gallery tiles, story images      upload 1600x1200 (min 1200x900)
//   banner 16:9 page banners, event headers, big gallery photo      upload 1920x1080 (min 1600x900)
//   square 1:1  profile and team photos                            upload 600x600 (min 400x400)
export const RATIO = {
  photo: "aspect-[4/3]",
  banner: "aspect-[16/9]",
  square: "aspect-square",
};

export const buttonClass = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-px hover:bg-brand-700 hover:shadow-md active:translate-y-0 active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-60",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-900/10 transition hover:-translate-y-px hover:bg-gray-50 active:translate-y-0 active:scale-[.98] dark:bg-gray-800 dark:text-white dark:ring-white/10 dark:hover:bg-gray-700",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 active:scale-[.98] dark:text-gray-200 dark:hover:bg-gray-800",
};

export const inputClass =
  "w-full rounded-xl border-0 bg-white px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 dark:bg-gray-900 dark:text-white dark:ring-gray-700";
