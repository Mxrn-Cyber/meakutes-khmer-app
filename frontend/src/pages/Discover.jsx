import PlacesBrowser from "../components/PlacesBrowser";
import { useLang } from "../i18n";
import { useSiteImage } from "../useSiteImages";

export default function Discover() {
  const { t } = useLang();
  const banner = useSiteImage("discover_banner");
  return (
    <PlacesBrowser
      heroImage={banner.src}
      eyebrow={t("browse.discoverEyebrow")}
      title={t("browse.discoverTitle")}
      subtitle={t("browse.discoverSubtitle")}
      defaultSort="name"
    />
  );
}
