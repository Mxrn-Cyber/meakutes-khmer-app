import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/useAuth";
import { AuthLayout, Field, Alert } from "../components/AuthLayout";
import { buttonClass, inputClass } from "../components/styles";
import { useLang } from "../i18n";
import { useSiteImage } from "../useSiteImages";

export default function ResetPassword() {
  const { t, te } = useLang();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const sidePhoto = useSiteImage("login_photo");
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((x) => ({ ...x, [name]: "" }));
    setApiError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.password.length < 8) next.password = t("account.passwordShort");
    if (form.confirm !== form.password) next.confirm = t("account.passwordMismatch");
    if (Object.keys(next).length) return setErrors(next);
    setLoading(true);
    try {
      await api.resetPassword(token, form.password);
      await refresh(); // the reset signed this browser out
      navigate("/login", { replace: true, state: { message: t("account.resetDone") } });
    } catch (err) {
      setApiError(te(err, "account.resetFailed"));
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <Link to="/forgot-password" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
      {t("account.requestNew")}
    </Link>
  );

  if (!token) {
    return (
      <AuthLayout image={sidePhoto.src} title={t("account.resetTitle")} footer={footer}>
        <Alert>{t("account.missingToken")}</Alert>
      </AuthLayout>
    );
  }

  const passwordInput = (name, autoComplete) => (
    <div className="relative">
      <input
        id={name}
        name={name}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        value={form[name]}
        onChange={change}
        className={`${inputClass} pr-12`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center text-gray-400 hover:text-gray-600"
        aria-label={show ? t("auth.hidePassword") : t("auth.showPassword")}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );

  return (
    <AuthLayout image={sidePhoto.src} title={t("account.resetTitle")} subtitle={t("account.resetSubtitle")} footer={footer}>
      <Alert>{apiError}</Alert>
      <form onSubmit={submit} noValidate className="space-y-5">
        <Field label={t("account.newPassword")} id="password" error={errors.password}>
          {passwordInput("password", "new-password")}
        </Field>
        <Field label={t("account.confirmPassword")} id="confirm" error={errors.confirm}>
          {passwordInput("confirm", "new-password")}
        </Field>
        <button type="submit" disabled={loading} className={`${buttonClass.primary} w-full py-3`}>
          {loading ? t("account.saving") : t("account.savePassword")}
        </button>
      </form>
    </AuthLayout>
  );
}
