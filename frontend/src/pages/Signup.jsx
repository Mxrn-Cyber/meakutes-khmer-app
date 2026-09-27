import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AuthLayout, GoogleButton, Divider, Field, Alert } from "../components/AuthLayout";
import { buttonClass, inputClass } from "../components/ui";

const RULES = [
  { test: (p) => p.length >= 8, label: "8+ characters" },
  { test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p), label: "Upper & lower case" },
  { test: (p) => /\d/.test(p), label: "A number" },
];

export default function Signup() {
  const navigate = useNavigate();
  const { register, loginWithGoogle, updateProfile } = useAuth();
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
    if (!form.firstName.trim()) next.firstName = "First name is required";
    if (!form.lastName.trim()) next.lastName = "Last name is required";
    if (!form.email) next.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Enter a valid email address";
    if (form.phone && !/^\+?[\d\s\-()]{6,}$/.test(form.phone)) next.phone = "Enter a valid phone number";
    if (!RULES.every((r) => r.test(form.password))) next.password = "Password must meet all the rules below";
    if (form.password !== form.confirmPassword) next.confirmPassword = "Passwords do not match";
    if (!agree) next.terms = "Please accept the terms to continue";
    return next;
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = validate();
    if (Object.keys(next).length) return setErrors(next);
    if (!online) return setApiError("You are offline. Please check your connection.");
    setLoading(true);
    setApiError("");
    try {
      await register({ email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName });
      // Phone isn't part of registration; the backend keeps it on the profile.
      if (form.phone) await updateProfile({ phone: form.phone }).catch(() => {});
      navigate("/", { state: { message: "Account created. Welcome!" } });
    } catch (err) {
      setApiError(err.message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const google = async (credential) => {
    setLoading(true);
    setApiError("");
    try {
      await loginWithGoogle(credential);
      navigate("/", { state: { message: "Welcome to Meakutes-Khmer!" } });
    } catch (err) {
      setApiError(err.message || "Google sign-up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const passed = RULES.filter((r) => r.test(form.password)).length;

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It's free. Save places, write reviews and plan your trip."
      image="/bayon-temple.png"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
            Log in
          </Link>
        </>
      }
    >
      <Alert>{apiError}</Alert>

      <GoogleButton text="signup_with" onCredential={google} />
      <Divider>or with email</Divider>

      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name" id="firstName" error={errors.firstName}>
            <input id="firstName" name="firstName" autoComplete="given-name" value={form.firstName} onChange={change} className={inputClass} />
          </Field>
          <Field label="Last name" id="lastName" error={errors.lastName}>
            <input id="lastName" name="lastName" autoComplete="family-name" value={form.lastName} onChange={change} className={inputClass} />
          </Field>
        </div>
        <Field label="Email" id="email" error={errors.email}>
          <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={change} className={inputClass} placeholder="you@example.com" />
        </Field>
        <Field label="Phone (optional)" id="phone" error={errors.phone}>
          <input id="phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={change} className={inputClass} placeholder="+855 12 345 678" />
        </Field>
        <Field label="Password" id="password" error={errors.password}>
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
              aria-label={showPassword ? "Hide password" : "Show password"}
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
                  <Check size={13} className={ok ? "" : "opacity-30"} /> {r.label}
                </li>
              );
            })}
          </ul>
        </Field>
        <Field label="Confirm password" id="confirmPassword" error={errors.confirmPassword}>
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
              I agree to the{" "}
              <Link to="/terms" className="font-medium text-brand-600 hover:underline">
                Terms of use
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="font-medium text-brand-600 hover:underline">
                Privacy policy
              </Link>
              .
            </span>
          </label>
          {errors.terms && <p className="mt-1.5 text-sm text-rose-600">{errors.terms}</p>}
        </div>
        <button type="submit" disabled={loading} className={`${buttonClass.primary} w-full py-3`}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
