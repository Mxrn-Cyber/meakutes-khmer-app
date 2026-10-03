import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { AuthLayout, Field, Alert } from "../components/AuthLayout";
import { buttonClass, inputClass } from "../components/styles";
import { useLang } from "../i18n";
import { useSiteImage } from "../useSiteImages";

export default function ForgotPassword() {
  const { t, te } = useLang();
  const sidePhoto = useSiteImage("login_photo");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return setError(t("auth.emailRequired"));
    if (!/\S+@\S+\.\S+/.test(email)) return setError(t("auth.emailInvalid"));
    setLoading(true);
    setApiError("");
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setApiError(te(err, "account.resetFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      image={sidePhoto.src}
      title={t("account.forgotTitle")}
      subtitle={t("account.forgotSubtitle")}
      footer={
        <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
          {t("account.backToLogin")}
        </Link>
      }
    >
      <Alert>{apiError}</Alert>
      {sent ? (
        <Alert tone="success">{t("account.forgotSent")}</Alert>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          <Field label={t("auth.email")} id="email" error={error}>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              className={inputClass}
              placeholder="you@example.com"
            />
          </Field>
          <button type="submit" disabled={loading} className={`${buttonClass.primary} w-full py-3`}>
            {loading ? t("account.sending") : t("account.sendLink")}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
