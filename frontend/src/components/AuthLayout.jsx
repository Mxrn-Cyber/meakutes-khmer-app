import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { loadGoogleScript } from "../utils/googleAuth";
import { useLang } from "../i18n";

export function AuthLayout({ title, subtitle, children, footer, image = "/angkor-morning.png" }) {
  const { t, lang } = useLang();
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gray-900 lg:block">
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="text-3xl font-extrabold leading-tight">
            {t("auth.sideTitle1")}
            <br />
            {t("auth.sideTitle2")}
          </p>
          <p className="mt-3 max-w-md text-white/80">
            {t("auth.sideText")}
          </p>
          <p lang={lang === "km" ? "en" : "km"} className="mt-4 text-white/70">
            {t("auth.sideKhmer")}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex items-center gap-2.5 lg:hidden">
            <img src="/logo.png" alt="" className="h-9 w-9 rounded-xl object-contain" />
            <span className="text-lg font-extrabold">
              <span translate="no">Meakutes<span className="text-brand-600">-Khmer</span></span>
            </span>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-gray-600 dark:text-gray-400">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

// Renders Google's own sign-in button, sized to its container.
export function GoogleButton({ text = "continue_with", onCredential }) {
  const ref = useRef(null);
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const { t, lang } = useLang();

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google || !ref.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => callbackRef.current?.(response.credential),
        });
        ref.current.innerHTML = ""; // re-rendered when the language changes
        const width = Math.min(400, Math.max(200, Math.floor(ref.current.offsetWidth)));
        window.google.accounts.id.renderButton(ref.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text,
          width,
          locale: lang,
        });
      })
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [clientId, text, lang]);

  if (!clientId) {
    return (
      <p className="rounded-xl bg-gray-100 px-4 py-3 text-center text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        {t("auth.googleMissing")}
      </p>
    );
  }
  return <div ref={ref} className="flex min-h-[44px] w-full justify-center" />;
}

export function Divider({ children }) {
  const { t } = useLang();
  return (
    <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-gray-400">
      <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
      {children ?? t("auth.or")}
      <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
    </div>
  );
}

export function Field({ label, error, hint, children, id }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-800 dark:text-gray-200">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function Alert({ children, tone = "error" }) {
  if (!children) return null;
  const styles =
    tone === "error"
      ? "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-900"
      : "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-900";
  return <div className={`mb-5 rounded-xl px-4 py-3 text-sm ring-1 ${styles}`}>{children}</div>;
}
