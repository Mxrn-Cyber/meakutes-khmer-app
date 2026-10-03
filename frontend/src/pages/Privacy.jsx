import LegalPage from "../components/LegalPage";
import { useLang } from "../i18n";

const CONTACT = "laothomorn@gmail.com";
const UPDATED = new Date(2026, 8, 30);

// The text lives in privacy (src/i18n/en.js and km.js).
const fill = (text) => (typeof text === "string" ? text.replace("{email}", CONTACT) : text.map(fill));

export default function Privacy() {
  const { t, formatDate } = useLang();
  const sections = t("privacy.sections").map((s) => ({ ...s, body: s.body.map(fill) }));
  return (
    <LegalPage title={t("privacy.title")} updated={formatDate(UPDATED)} intro={t("privacy.intro")} sections={sections} />
  );
}
