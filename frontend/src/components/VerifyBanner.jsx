import { useState } from "react";
import { MailWarning } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/useAuth";
import { useLang } from "../i18n";

// Reminds signed-in users who haven't clicked their confirmation link yet.
export default function VerifyBanner() {
  const { user } = useAuth();
  const { t, te } = useLang();
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  if (!user || user.email_verified !== false) return null;

  const resend = async () => {
    setStatus("sending");
    setError("");
    try {
      await api.resendVerification();
      setStatus("sent");
    } catch (err) {
      setError(te(err, "account.resetFailed"));
      setStatus("idle");
    }
  };

  return (
    <div className="relative z-30 border-b border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 text-sm sm:px-6 lg:px-8">
        <MailWarning size={18} className="shrink-0" aria-hidden="true" />
        <p className="min-w-0 flex-1">{t("account.banner", { email: user.email })}</p>
        {status === "sent" ? (
          <span className="font-semibold">{t("account.resent")}</span>
        ) : (
          <button
            type="button"
            onClick={resend}
            disabled={status === "sending"}
            className="rounded-full bg-amber-600 px-4 py-1.5 font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {status === "sending" ? t("account.sending") : t("account.resend")}
          </button>
        )}
        {error && <p className="w-full text-rose-700 dark:text-rose-300">{error}</p>}
      </div>
    </div>
  );
}
