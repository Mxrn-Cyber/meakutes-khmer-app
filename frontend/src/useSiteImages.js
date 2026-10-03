import { createContext, useContext } from "react";
import { api } from "./api/client";
import { useLang } from "./i18n";
import { SITE_IMAGE_SLOTS } from "./siteImagesConfig";

// Admin-chosen site photos. Needs <SiteImagesProvider> (siteImages.jsx).
export const SiteImagesContext = createContext({ custom: {}, reload: () => {} });

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
