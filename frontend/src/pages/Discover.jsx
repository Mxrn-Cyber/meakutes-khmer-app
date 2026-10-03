import PlacesBrowser from "../components/PlacesBrowser";
import { useLang } from "../i18n";

export default function Discover() {
  const { t } = useLang();
  return (
    <PlacesBrowser
      heroImage="/Landscape.png"
      eyebrow={t("browse.discoverEyebrow")}
      title={t("browse.discoverTitle")}
      subtitle={t("browse.discoverSubtitle")}
      defaultSort="name"
    />
  );
}
