import PlacesBrowser from "../components/PlacesBrowser";
import { useLang } from "../i18n";

export default function Popular() {
  const { t } = useLang();
  return (
    <PlacesBrowser
      heroImage="/angkor-wat.png"
      eyebrow={t("browse.popularEyebrow")}
      title={t("browse.popularTitle")}
      subtitle={t("browse.popularSubtitle")}
      defaultSort="rating"
      showRank
    />
  );
}
