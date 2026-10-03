import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { AuthLayout, GoogleButton, Divider, Field, Alert } from "../components/AuthLayout";
import { buttonClass, inputClass } from "../components/styles";
import { useLang } from "../i18n";
import { useSiteImage } from "../useSiteImages";

const RULES = [
  { test: (p) => p.length >= 8, label: "auth.rule8" },
  { test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p), label: "auth.ruleCase" },
  { test: (p) => /\d/.test(p), label: "auth.ruleNumber" },
];

export default function Signup() {
  const navigate = useNavigate();
  const { register, loginWithGoogle, updateProfile } = useAuth();
  const { t, te } = useLang();
  const sidePhoto = useSiteImage("signup_photo");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((x) => ({ ...x, [name]: "" }));
    setApiError("");
  };

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = t("auth.firstRequired");
    if (!form.lastName.trim()) next.lastName = t("auth.lastRequired");
    if (!form.email) next.email = t("auth.emailRequired");
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = t("auth.emailInvalid");
    if (form.phone && !/^\+?[\d\s\-()]{6,}$/.test(form.phone)) next.phone = t("auth.phoneInvalid");
    if (!RULES.every((r) => r.test(form.password))) next.password = t("auth.rulesNotMet");
    if (form.password !== form.confirmPassword) next.confirmPassword = t("auth.mismatch");
    if (!agree) next.terms = t("auth.acceptTerms");
    return next;
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = validate();
    if (Object.keys(next).length) return setErrors(next);
    if (!online) return setApiError(t("common.offline"));
    setLoading(true);
    setApiError("");
    try {
      const me = await register({ email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName });
      // Phone isn't part of registration; the backend keeps it on the profile.
      if (form.phone) await updateProfile({ phone: form.phone }).catch(() => {});
      navigate("/", { state: { message: me?.email_verified === false ? t("account.checkInbox") : t("auth.created") } });
    } catch (err) {
      setApiError(te(err, "auth.signupFailed"));
    } finally {
      setLoading(false);
    }
  };

  const google = async (credential) => {
    setLoading(true);
    setApiError("");
    try {
      await loginWithGoogle(credential);
      navigate("/", { state: { message: t("auth.welcome") } });
    } catch (err) {
      setApiError(te(err, "auth.googleSignupFailed"));
    } finally {
      setLoading(false);
    }
  };

  const passed = RULES.filter((r) => r.test(form.password)).length;

  return (
    <AuthLayout
      title={t("auth.signupTitle")}
      subtitle={t("auth.signupSubtitle")}
      image={sidePhoto.src}
      footer={
        <>
          {t("auth.haveAccount")}{" "}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
            {t("auth.login")}
          </Link>
        </>
      }
    >
      <Alert>{apiError}</Alert>

      <GoogleButton text="signup_with" onCredential={google} />
      <Divider>{t("auth.orEmail")}</Divider>

      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("auth.firstName")} id="firstName" error={errors.firstName}>
            <input id="firstName" name="firstName" autoComplete="given-name" value={form.firstName} onChange={change} className={inputClass} />
          </Field>
          <Field label={t("auth.lastName")} id="lastName" error={errors.lastName}>
            <input id="lastName" name="lastName" autoComplete="family-name" value={form.lastName} onChange={change} className={inputClass} />
          </Field>
        </div>
        <Field label={t("auth.email")} id="email" error={errors.email}>
          <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={change} className={inputClass} placeholder="you@example.com" />
        </Field>
        <Field label={t("auth.phoneOptional")} id="phone" error={errors.phone}>
          <input id="phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={change} className={inputClass} placeholder="+855 12 345 678" />
        </Field>
        <Field label={t("auth.password")} id="password" error={errors.password}>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={change}
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 grid w-12 place-items-center text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="mt-2 flex gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i < passed ? (passed === 3 ? "bg-emerald-500" : passed === 2 ? "bg-amber-400" : "bg-rose-400") : "bg-gray-200 dark:bg-gray-800"
                }`}
              />
            ))}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {RULES.map((r) => {
              const ok = r.test(form.password);
              return (
                <li key={r.label} className={`inline-flex items-center gap-1 ${ok ? "text-emerald-600" : "text-gray-500 dark:text-gray-400"}`}>
                  <Check size={13} className={ok ? "" : "opacity-30"} /> {t(r.label)}
                </li>
              );
            })}
          </ul>
        </Field>
        <Field label={t("auth.confirmPassword")} id="confirmPassword" error={errors.confirmPassword}>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={change}
            className={inputClass}
          />
        </Field>
        <div>
          <label className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => {
                setAgree(e.target.checked);
                if (errors.terms) setErrors((x) => ({ ...x, terms: "" }));
              }}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600"
            />
            <span>
              {t("auth.agreeA")}
              <Link to="/terms" className="font-medium text-brand-600 hover:underline">
                {t("auth.terms")}
              </Link>
              {t("auth.and")}
              <Link to="/privacy" className="font-medium text-brand-600 hover:underline">
                {t("auth.privacy")}
              </Link>
              {t("auth.agreeB")}
            </span>
          </label>
          {errors.terms && <p className="mt-1.5 text-sm text-rose-600">{errors.terms}</p>}
        </div>
        <button type="submit" disabled={loading} className={`${buttonClass.primary} w-full py-3`}>
          {loading ? t("auth.creating") : t("auth.create")}
        </button>
      </form>
    </AuthLayout>
  );
}
