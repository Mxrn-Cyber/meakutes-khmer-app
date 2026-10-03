import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api/client";
import { useLang } from "./i18n";

// Photos on the public site that admins can replace in Admin > Site photos.
// Keys must match SLOTS in backend/app/routers/site_images.py.
// shape: photo 4:3, banner 16:9, square 1:1 (see RATIO in components/ui.jsx).
export const SITE_IMAGE_GROUPS = [
  {
    title: "Home page slideshow",
    hint: "The big photos at the top of the home page. They change every 6 seconds.",
    slots: [
      { key: "home_slide_1", label: "Slide 1", shape: "banner", src: "/angkor-morning.png", caption: 0 },
      { key: "home_slide_2", label: "Slide 2", shape: "banner", src: "/bayon-temple.png", caption: 1 },
      { key: "home_slide_3", label: "Slide 3", shape: "banner", src: "/palace.png", caption: 2 },
      { key: "home_slide_4", label: "Slide 4", shape: "banner", src: "/Landscape.png", caption: 3 },
      { key: "home_slide_5", label: "Slide 5", shape: "banner", src: "/monk-front.png", caption: 4 },
    ],
  },
  {
    title: "Page banners",
    hint: "The photo behind the title at the top of each page.",
    slots: [
      { key: "discover_banner", label: "Discover", shape: "banner", src: "/Landscape.png" },
      { key: "popular_banner", label: "Popular", shape: "banner", src: "/angkor-wat.png" },
      { key: "news_banner", label: "News & Events", shape: "banner", src: "/Water Festival.png" },
      { key: "about_banner", label: "About", shape: "banner", src: "/Tumnail.png" },
      { key: "login_photo", label: "Log in (side photo)", shape: "banner", src: "/angkor-morning.png" },
      { key: "signup_photo", label: "Sign up (side photo)", shape: "banner", src: "/bayon-temple.png" },
    ],
  },
  {
    title: "Story and team",
    hint: "Photos inside the Home and About pages.",
    slots: [
      { key: "home_story", label: "Home: \"Our story\" photo", shape: "photo", src: "/angkor-wat.png" },
      { key: "about_photo", label: "About: \"Our story\" photo", shape: "photo", src: "/Trip-Image/about-team.png" },
      { key: "team_1", label: "About: team member 1 (Ky Soklay)", shape: "square", src: "/avatar.png" },
      { key: "team_2", label: "About: team member 2 (Lao Thomorn)", shape: "square", src: "/avatar.png" },
    ],
  },
];

export const SITE_IMAGE_SLOTS = Object.fromEntries(
  SITE_IMAGE_GROUPS.flatMap((g) => g.slots).map((s) => [s.key, s])
);

const SiteImagesContext = createContext({ custom: {}, reload: () => {} });

export function SiteImagesProvider({ children }) {
  const [custom, setCustom] = useState({});

  const reload = useCallback(
    () =>
      api
        .listSiteImages()
        .then((rows) => setCustom(rows || {}))
        .catch(() => setCustom({})),
    []
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(() => ({ custom, reload }), [custom, reload]);
  return <SiteImagesContext.Provider value={value}>{children}</SiteImagesContext.Provider>;
}

/** Admin-chosen photo for a slot, or the built-in default. */
export function useSiteImage(key) {
  const { custom } = useContext(SiteImagesContext);
  const { t, lang } = useLang();
  const slot = SITE_IMAGE_SLOTS[key];
  const row = custom[key];
  if (row?.url) {
    const caption = (lang === "km" && row.caption_km) || row.caption || "";
    return { src: api.mediaUrl(row.url), caption, custom: true };
  }
  const caption = slot?.caption != null ? t("home.slides")[slot.caption] : "";
  return { src: slot?.src, caption, custom: false };
}

export function useSiteImagesAdmin() {
  return useContext(SiteImagesContext);
}
