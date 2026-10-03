import { createContext, useContext } from "react";

// English and Khmer are our own text. Other languages: English + Google Translate.
//   const { t, lang, choice, choose, toggle, pick, tv, formatDate } = useLang();
//   lang   = "en" | "km"       language of our own text
//   choice = "en" | "km" | "zh-CN" | "ko" | ...   what the visitor picked
//   t("nav.home")                      -> "Home" / "ទំព័រដើម"
//   t("common.places", { count: 3 })   -> "3 places" / "៣ កន្លែង"
//   pick(place, "name")                -> place.name_km in Khmer, if it isn't empty
//   tv("Siem Reap")                    -> "សៀមរាប" (provinces, months, levels...)
export const LanguageContext = createContext(null);

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>");
  return ctx;
}
