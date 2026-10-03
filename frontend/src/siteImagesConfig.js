// Photos on the public site that admins can replace in Admin > Site photos.
// Keys must match SLOTS in backend/app/routers/site_images.py.
// shape: photo 4:3, banner 16:9, square 1:1 (see RATIO in components/ui.jsx).
export const SITE_IMAGE_GROUPS = [
  {
    title: "Home page slideshow",
    hint: "The big photos at the top of the home page. They change every 6 seconds.",
    slots: [
      { key: "home_slide_1", label: "Slide 1", shape: "banner", src: "/images/angkor-morning.webp", caption: 0 },
      { key: "home_slide_2", label: "Slide 2", shape: "banner", src: "/images/bayon-temple.webp", caption: 1 },
      { key: "home_slide_3", label: "Slide 3", shape: "banner", src: "/images/palace.webp", caption: 2 },
      { key: "home_slide_4", label: "Slide 4", shape: "banner", src: "/images/Landscape.webp", caption: 3 },
      { key: "home_slide_5", label: "Slide 5", shape: "banner", src: "/images/monk-front.webp", caption: 4 },
    ],
  },
  {
    title: "Page banners",
    hint: "The photo behind the title at the top of each page.",
    slots: [
      { key: "discover_banner", label: "Discover", shape: "banner", src: "/images/Landscape.webp" },
      { key: "popular_banner", label: "Popular", shape: "banner", src: "/images/angkor-wat.webp" },
      { key: "news_banner", label: "News & Events", shape: "banner", src: "/images/Water-Festival.webp" },
      { key: "about_banner", label: "About", shape: "banner", src: "/images/Tumnail.webp" },
      { key: "login_photo", label: "Log in (side photo)", shape: "banner", src: "/images/angkor-morning.webp" },
      { key: "signup_photo", label: "Sign up (side photo)", shape: "banner", src: "/images/bayon-temple.webp" },
    ],
  },
  {
    title: "Story and team",
    hint: "Photos inside the Home and About pages.",
    slots: [
      { key: "home_story", label: "Home: \"Our story\" photo", shape: "photo", src: "/images/angkor-wat.webp" },
      { key: "about_photo", label: "About: \"Our story\" photo", shape: "photo", src: "/images/about-team.webp" },
      { key: "team_1", label: "About: team member 1 (Ky Soklay)", shape: "square", src: "/images/avatar.webp" },
      { key: "team_2", label: "About: team member 2 (Lao Thomorn)", shape: "square", src: "/images/avatar.webp" },
    ],
  },
];

export const SITE_IMAGE_SLOTS = Object.fromEntries(
  SITE_IMAGE_GROUPS.flatMap((g) => g.slots).map((s) => [s.key, s])
);
