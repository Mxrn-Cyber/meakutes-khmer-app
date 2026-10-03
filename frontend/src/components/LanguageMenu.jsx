import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";
import { useLang, MACHINE_LANGUAGES } from "../i18n";

// Our own translations first, then the languages Google Translate handles.
const OWN = [
  { code: "en", label: "English", short: "EN" },
  { code: "km", label: "ខ្មែរ", short: "ខ្មែរ" },
];
const ALL = [...OWN, ...MACHINE_LANGUAGES];

function Option({ item, active, onPick }) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={active}
      lang={item.code}
      onClick={() => onPick(item.code)}
      className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
        active
          ? "bg-brand-50 font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
      }`}
    >
      {item.label}
      {active && <Check size={16} />}
    </button>
  );
}

function Lists({ choice, onPick, t }) {
  return (
    <>
      <div className="space-y-0.5">
        {OWN.map((item) => (
          <Option key={item.code} item={item} active={choice === item.code} onPick={onPick} />
        ))}
      </div>
      <p className="mt-3 border-t border-gray-100 px-3 pb-1 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
        {t("nav.machineNote")}
      </p>
      <div className="grid grid-cols-2 gap-0.5">
        {MACHINE_LANGUAGES.map((item) => (
          <Option key={item.code} item={item} active={choice === item.code} onPick={onPick} />
        ))}
      </div>
    </>
  );
}

/** `variant="dropdown"` for the desktop navbar, `variant="panel"` for the phone menu. */
export default function LanguageMenu({ variant = "dropdown", className = "" }) {
  const { t, choice, choose } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = ALL.find((l) => l.code === choice) || OWN[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (code) => {
    setOpen(false);
    choose(code);
  };

  // translate="no": Google must not translate the language names themselves.
  if (variant === "panel") {
    return (
      <div translate="no" className={`notranslate rounded-2xl bg-gray-50 p-2 dark:bg-gray-900 ${className}`}>
        <p className="flex items-center gap-2 px-3 py-2 text-sm font-semibold">
          <Languages size={18} /> {t("nav.language")}
        </p>
        <Lists choice={choice} onPick={pick} t={t} />
      </div>
    );
  }

  return (
    <div ref={ref} translate="no" className={`notranslate relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("nav.changeLanguage")}
        title={t("nav.changeLanguage")}
        className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        <Languages size={18} />
        <span lang={current.code}>{current.short}</span>
        <ChevronDown size={14} className={`text-gray-500 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-2 shadow-lift ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10"
        >
          <Lists choice={choice} onPick={pick} t={t} />
        </div>
      )}
    </div>
  );
}
