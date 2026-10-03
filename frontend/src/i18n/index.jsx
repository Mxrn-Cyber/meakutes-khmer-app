import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en from "./en";
import km from "./km";
import {
  MACHINE_LANGUAGES,
  isMachineLanguage,
  readGoogleCookie,
  clearGoogleCookie,
  startGoogleTranslate,
} from "./googleTranslate";

export { MACHINE_LANGUAGES };

// English and Khmer are our own text. Other languages: English + Google Translate.
//   const { t, lang, choice, choose, toggle, pick, tv, formatDate } = useLang();
//   lang   = "en" | "km"       language of our own text
//   choice = "en" | "km" | "zh-CN" | "ko" | ...   what the visitor picked
//   t("nav.home")                      -> "Home" / "ទំព័រដើម"
//   t("common.places", { count: 3 })   -> "3 places" / "៣ កន្លែង"
//   pick(place, "name")                -> place.name_km in Khmer, if it isn't empty
//   tv("Siem Reap")                    -> "សៀមរាប" (provinces, months, levels...)

const DICTS = { en, km };
const STORAGE_KEY = "mk_lang";
const KHMER_DIGITS = "០១២៣៤៥៦៧៨៩";

export const KHMER_MONTHS = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];

export const toKhmerDigits = (value) => String(value).replace(/[0-9]/g, (d) => KHMER_DIGITS[d]);

function lookup(dict, key) {
  return key.split(".").reduce((node, part) => (node == null ? undefined : node[part]), dict);
}

function initialChoice() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "km" || isMachineLanguage(saved)) return saved;
  } catch {
    /* storage unavailable */
  }
  const fromCookie = readGoogleCookie();
  // Visitors who used the old Google Translate switch for Khmer get our Khmer.
  if (fromCookie === "km") return "km";
  if (isMachineLanguage(fromCookie)) return fromCookie;
  return "en";
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [choice, setChoice] = useState(initialChoice);
  const machine = isMachineLanguage(choice);
  const lang = choice === "km" ? "km" : "en";

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      /* storage unavailable */
    }
    if (machine) {
      startGoogleTranslate(choice);
    } else {
      clearGoogleCookie();
      document.documentElement.lang = lang;
    }
    document.title = lookup(DICTS[lang], "meta.title") || document.title;
  }, [choice, machine, lang]);

  const choose = useCallback(
    (next) => {
      const target = next === "km" || isMachineLanguage(next) ? next : "en";
      if (target === choice) return;
      if (machine && !isMachineLanguage(target)) {
        // Google has rewritten the page text; a clean reload is the only reliable way back.
        try {
          localStorage.setItem(STORAGE_KEY, target);
        } catch {
          /* storage unavailable */
        }
        clearGoogleCookie();
        window.location.reload();
        return;
      }
      setChoice(target);
    },
    [choice, machine]
  );
  const setLang = choose;
  const toggle = useCallback(() => choose(lang === "en" ? "km" : "en"), [choose, lang]);

  const value = useMemo(() => {
    const dict = DICTS[lang];
    const num = (n) => (lang === "km" ? toKhmerDigits(n) : String(n));

    const t = (key, vars) => {
      let text = lookup(dict, key);
      if (text == null) text = lookup(en, key);
      if (text == null) return key;
      if (typeof text === "object" && vars && "count" in vars) {
        text = vars.count === 1 && text.one != null ? text.one : text.other;
      }
      if (typeof text !== "string") return text;
      if (!vars) return text;
      return text.replace(/\{(\w+)\}/g, (_, k) =>
        vars[k] == null ? "" : typeof vars[k] === "number" ? num(vars[k]) : String(vars[k])
      );
    };

    // Khmer field from the database when present, English otherwise.
    const pick = (obj, field) => {
      if (!obj) return "";
      if (lang === "km") {
        const khmer = obj[`${field}_km`];
        if (khmer && String(khmer).trim()) return khmer;
      }
      return obj[field] ?? "";
    };

    // Fixed vocabulary stored in English: provinces, levels, durations, months.
    const tv = (value) => {
      if (value == null || value === "") return value;
      if (lang === "en") return value;
      const exact = km.values[value] ?? km.values[String(value).trim()];
      if (exact) return exact;
      // Ranges and dates like "November - February" or "April 13 - April 16".
      return String(value)
        .replace(/[A-Za-z][A-Za-z ]*[A-Za-z]|[A-Za-z]/g, (word) => km.values[word] ?? word)
        .replace(/\s*-\s*/g, " - ")
        .replace(/[0-9]/g, (d) => KHMER_DIGITS[d]);
    };

    const locale = lang === "km" ? "km-KH" : "en-GB";
    // Built by hand for Khmer: some browsers ship without Khmer date data and
    // would silently fall back to English. Result: "៣០ កញ្ញា ២០២៦".
    const formatDate = (date, options = { day: "numeric", month: "long", year: "numeric" }) => {
      const d = date instanceof Date ? date : new Date(date);
      if (Number.isNaN(d.getTime())) return "";
      if (lang !== "km") return new Intl.DateTimeFormat(locale, options).format(d);
      return [
        options.day && toKhmerDigits(d.getDate()),
        options.month && KHMER_MONTHS[d.getMonth()],
        options.year && toKhmerDigits(d.getFullYear()),
      ]
        .filter(Boolean)
        .join(" ");
    };

    // Server errors arrive in English; show them in Khmer when we know them.
    const te = (err, fallbackKey) => {
      const message = typeof err === "string" ? err : err?.message;
      if (message && lang === "km" && km.apiErrors[message]) return km.apiErrors[message];
      if (message && message !== "Request failed" && (lang === "en" || !fallbackKey)) return message;
      return fallbackKey ? t(fallbackKey) : message || "";
    };

    return { lang, choice, machine, choose, setLang, toggle, t, te, pick, tv, num, formatDate, locale };
  }, [lang, choice, machine, choose, setLang, toggle]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>");
  return ctx;
}

// Renders a dictionary string that uses <b>…</b> for bold words.
export function Rich({ text, boldClassName = "text-gray-900 dark:text-white" }) {
  const parts = String(text).split(/(<b>.*?<\/b>)/g);
  return parts.map((part, i) =>
    part.startsWith("<b>") ? (
      <strong key={i} className={boldClassName}>
        {part.slice(3, -4)}
      </strong>
    ) : (
      part
    )
  );
}
