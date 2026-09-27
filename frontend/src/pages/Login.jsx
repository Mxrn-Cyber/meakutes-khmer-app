import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AuthLayout, GoogleButton, Divider, Field, Alert } from "../components/AuthLayout";
import { buttonClass, inputClass } from "../components/ui";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const notice = location.state?.message;

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
    if (!form.email) next.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Enter a valid email address";
    if (!form.password) next.password = "Password is required";
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
      await login(form.email, form.password);
      navigate("/", { state: { message: "Welcome back!" } });
    } catch (err) {
      setApiError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const google = async (credential) => {
    setLoading(true);
    setApiError("");
    try {
      await loginWithGoogle(credential);
      navigate("/", { state: { message: "Welcome back!" } });
    } catch (err) {
      setApiError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to save places, write reviews and join the conversation."
      footer={
        <>
          New to Meakutes-Khmer?{" "}
          <Link to="/signup" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
            Create an account
          </Link>
        </>
      }
    >
      {notice && !apiError && <Alert tone="success">{notice}</Alert>}
      <Alert>{apiError}</Alert>

      <GoogleButton text="signin_with" onCredential={google} />
      <Divider>or with email</Divider>

      <form onSubmit={submit} noValidate className="space-y-5">
        <Field label="Email" id="email" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={change}
            className={inputClass}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password" id="password" error={errors.password}>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={form.password}
              onChange={change}
              className={`${inputClass} pr-12`}
              placeholder="Your password"
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
        </Field>
        <button type="submit" disabled={loading} className={`${buttonClass.primary} w-full py-3`}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthLayout>
  );
}
