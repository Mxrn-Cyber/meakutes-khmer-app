import PlacesBrowser from "../components/PlacesBrowser";
import { useLang } from "../i18n";
import { useSiteImage } from "../siteImages";

export default function Popular() {
  const { t } = useLang();
  const banner = useSiteImage("popular_banner");
  return (
    <PlacesBrowser
      heroImage={banner.src}
      eyebrow={t("browse.popularEyebrow")}
      title={t("browse.popularTitle")}
      subtitle={t("browse.popularSubtitle")}
      defaultSort="rating"
      showRank
    />
  );
}
