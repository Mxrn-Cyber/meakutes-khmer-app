// Profile page. Name/phone/email: PATCH /auth/me (email change needs the
// current password). Password: POST /auth/me/password. Photo: POST /auth/me/avatar.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Heart, Lock, Mail, Phone, User, Eye, EyeOff, ShieldCheck, Pencil } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTripContext } from "../context/TripContext";
import { mapDestination } from "../hooks/useDestinations";
import { api } from "../api/client";
import { Container, PlaceCard, EmptyState, buttonClass, inputClass } from "../components/ui";
import { Alert, Field } from "../components/AuthLayout";

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const TABS = [
  { key: "details", label: "Details", icon: User },
  { key: "saved", label: "Saved places", icon: Heart },
  { key: "security", label: "Security", icon: Lock },
];

const toForm = (u) => ({
  firstName: u?.first_name || "",
  lastName: u?.last_name || "",
  email: u?.email || "",
  phone: u?.phone || "",
});

function PasswordInput({ value, onChange, autoComplete, id }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className={`${inputClass} pr-12`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center text-gray-400 hover:text-gray-600"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export default function Profile() {
  const { user, isLoading, updateProfile, changePassword, uploadAvatar } = useAuth();
  const { favorites } = useTripContext();
  const [tab, setTab] = useState("details");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Details
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(toForm(user));
  const [emailPassword, setEmailPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Photo
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Password
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

  useEffect(() => {
    if (!editing) setForm(toForm(user));
  }, [user, editing]);

  useEffect(() => () => photoPreview && URL.revokeObjectURL(photoPreview), [photoPreview]);

  const saved = useMemo(() => favorites.map(mapDestination), [favorites]);
  const emailChanged = form.email.trim().toLowerCase() !== (user?.email || "").toLowerCase();

  const flash = (msg) => {
    setError("");
    setSuccess(msg);
  };

  if (isLoading || !user) {
    return (
      <Container className="py-16">
        <div className="h-40 animate-pulse rounded-3xl bg-gray-200 dark:bg-gray-800" />
      </Container>
    );
  }

  const avatarUrl = photoPreview || (user.avatar_url ? api.mediaUrl(user.avatar_url) : null);

  const choosePhoto = (e) => {
    const file = e.target.files?.[0];
    setError("");
    setSuccess("");
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
    if (file.size > MAX_PHOTO_BYTES) return setError("That image is larger than 4 MB. Please choose a smaller one.");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const savePhoto = async () => {
    setUploading(true);
    try {
      await uploadAvatar(photoFile);
      setPhotoFile(null);
      setPhotoPreview(null);
      flash("Profile photo updated.");
    } catch (err) {
      setError(err.message || "Could not upload the photo.");
    } finally {
      setUploading(false);
    }
  };

  const saveDetails = async (e) => {
    e.preventDefault();
    const problems = [];
    if (!form.firstName.trim()) problems.push("First name is required");
    if (!form.lastName.trim()) problems.push("Last name is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) problems.push("Enter a valid email address");
    if (form.phone && !/^[\d\s\-+()]+$/.test(form.phone)) problems.push("Enter a valid phone number");
    if (emailChanged && !emailPassword) problems.push("Enter your current password to change your email");
    if (problems.length) return setError(problems.join(". ") + ".");

    setSaving(true);
    setError("");
    try {
      const payload = { first_name: form.firstName.trim(), last_name: form.lastName.trim(), phone: form.phone.trim() };
      if (emailChanged) {
        payload.email = form.email.trim();
        payload.current_password = emailPassword;
      }
      await updateProfile(payload);
      setEditing(false);
      setEmailPassword("");
      flash(emailChanged ? "Saved. Use your new email address to log in from now on." : "Your details were saved.");
    } catch (err) {
      setError(err.message || "Could not save your details.");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (!pw.current || !pw.next || !pw.confirm) return setError("Fill in all three password fields.");
    if (pw.next.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pw.next))
      return setError("The new password needs 8+ characters with upper case, lower case and a number.");
    if (pw.next !== pw.confirm) return setError("The new passwords do not match.");
    setSaving(true);
    setError("");
    try {
      await changePassword(pw.current, pw.next);
      setPw({ current: "", next: "", confirm: "" });
      flash("Password changed. Your other devices were signed out.");
    } catch (err) {
      setError(err.message || "Could not change your password.");
    } finally {
      setSaving(false);
    }
  };

  const Row = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-4 py-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
        <p className="truncate font-medium">{value || <span className="text-gray-400">Not set</span>}</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="h-40 bg-gradient-to-r from-brand-600 via-brand-500 to-amber-400 sm:h-52" />
      <Container className="-mt-16 pb-16 sm:-mt-20">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="relative w-fit">
            <div className="h-32 w-32 overflow-hidden rounded-full bg-brand-600 ring-4 ring-gray-50 dark:ring-gray-950 sm:h-36 sm:w-36">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-5xl font-bold text-white">
                  {(user.display_name || user.email).charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <label className="absolute bottom-1 right-1 grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-white text-gray-800 shadow-lift ring-1 ring-gray-900/10 hover:bg-gray-50 dark:bg-gray-800 dark:text-white" title="Change photo">
              <Camera size={18} />
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={choosePhoto} className="sr-only" />
            </label>
          </div>
          <div className="flex-1 sm:pt-[5.5rem]">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{user.display_name}</h1>
            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(user.roles || []).map((r) => (
                <span key={r} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  {r}
                </span>
              ))}
            </div>
          </div>
          {photoFile && (
            <div className="flex gap-2 sm:pt-[6rem]">
              <button type="button" onClick={savePhoto} disabled={uploading} className={buttonClass.primary}>
                {uploading ? "Uploading…" : "Save photo"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview(null);
                }}
                className={buttonClass.secondary}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-800" role="tablist">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => {
                setTab(key);
                setError("");
                setSuccess("");
              }}
              className={`-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                tab === key
                  ? "border-brand-600 text-brand-700 dark:text-brand-300"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <Icon size={16} /> {label}
              {key === "saved" && <span className="rounded-full bg-gray-100 px-1.5 text-xs dark:bg-gray-800">{favorites.length}</span>}
            </button>
          ))}
        </div>

        <div className="mt-8">
          <Alert tone="success">{success}</Alert>
          <Alert>{error}</Alert>

          {tab === "details" && (
            <div className="max-w-2xl rounded-3xl bg-white p-6 shadow-card ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10 sm:p-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Personal details</h2>
                {!editing && (
                  <button type="button" onClick={() => setEditing(true)} className={buttonClass.secondary}>
                    <Pencil size={15} /> Edit
                  </button>
                )}
              </div>
              {!editing ? (
                <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
                  <Row icon={User} label="Name" value={`${user.first_name || ""} ${user.last_name || ""}`.trim()} />
                  <Row icon={Mail} label="Email" value={user.email} />
                  <Row icon={Phone} label="Phone" value={user.phone} />
                </div>
              ) : (
                <form onSubmit={saveDetails} className="mt-6 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="First name" id="p-first">
                      <input id="p-first" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputClass} />
                    </Field>
                    <Field label="Last name" id="p-last">
                      <input id="p-last" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputClass} />
                    </Field>
                  </div>
                  <Field label="Email" id="p-email" hint="This is the address you log in with.">
                    <input id="p-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
                  </Field>
                  {emailChanged && (
                    <Field label="Current password" id="p-emailpw" hint="Needed to change your email. Google accounts can't change email here.">
                      <PasswordInput id="p-emailpw" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} autoComplete="current-password" />
                    </Field>
                  )}
                  <Field label="Phone" id="p-phone">
                    <input id="p-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+855 12 345 678" />
                  </Field>
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving} className={buttonClass.primary}>
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setEmailPassword("");
                        setError("");
                      }}
                      className={buttonClass.secondary}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {tab === "saved" &&
            (saved.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No saved places yet"
                action={
                  <Link to="/discover" className={buttonClass.primary}>
                    Discover places
                  </Link>
                }
              >
                Tap the heart on any place to keep it here for your next trip.
              </EmptyState>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {saved.map((t) => (
                  <PlaceCard key={t.id} trip={t} />
                ))}
              </div>
            ))}

          {tab === "security" && (
            <form onSubmit={savePassword} className="max-w-2xl space-y-5 rounded-3xl bg-white p-6 shadow-card ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10 sm:p-8">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-emerald-500" />
                <div>
                  <h2 className="text-lg font-bold">Change password</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Changing it signs you out on your other devices. If you sign in with Google, you don't have a password here.
                  </p>
                </div>
              </div>
              <Field label="Current password" id="pw-current">
                <PasswordInput id="pw-current" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" />
              </Field>
              <Field label="New password" id="pw-new" hint="8+ characters with upper case, lower case and a number.">
                <PasswordInput id="pw-new" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" />
              </Field>
              <Field label="Confirm new password" id="pw-confirm">
                <PasswordInput id="pw-confirm" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" />
              </Field>
              <button type="submit" disabled={saving} className={buttonClass.primary}>
                {saving ? "Saving…" : "Update password"}
              </button>
            </form>
          )}
        </div>
      </Container>
    </>
  );
}
