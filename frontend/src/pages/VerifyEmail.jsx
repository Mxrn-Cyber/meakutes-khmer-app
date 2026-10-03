import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/useAuth";
import { AuthLayout, Alert } from "../components/AuthLayout";
import { buttonClass } from "../components/styles";
import { useLang } from "../i18n";
import { useSiteImage } from "../useSiteImages";

export default function VerifyEmail() {
  const { t, te } = useLang();
  const { refresh } = useAuth();
  const sidePhoto = useSiteImage("login_photo");
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState(token ? "checking" : "missing");
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    // Links work once, so never send the same token twice (React StrictMode runs effects twice).
    if (!token || started.current) return;
    started.current = true;
    api
      .verifyEmail(token)
      .then(() => {
        setState("done");
        refresh();
      })
      .catch((err) => {
        setError(te(err, "account.verifyFailed"));
        setState("failed");
      });
  }, [token, refresh, te]);

  return (
    <AuthLayout image={sidePhoto.src} title={t("account.verifyTitle")}>
      {state === "checking" && (
        <p className="flex items-center gap-3 text-gray-600 dark:text-gray-300" role="status">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          {t("account.verifying")}
        </p>
      )}
      {state === "missing" && <Alert>{t("account.missingToken")}</Alert>}
      {state === "failed" && <Alert>{error}</Alert>}
      {state === "done" && <Alert tone="success">{t("account.verified")}</Alert>}
      {state !== "checking" && (
        <Link to="/discover" className={`${buttonClass.primary} w-full py-3`}>
          {t("account.startExploring")}
        </Link>
      )}
    </AuthLayout>
  );
}
