// Thin progress bar at the top of the page while the session is being checked.
import { useLang } from "../i18n";

const Loading = () => {
  const { t } = useLang();
  return (
  <div className="fixed inset-x-0 top-0 z-[90] h-0.5 overflow-hidden bg-brand-100 dark:bg-brand-900/40" role="progressbar" aria-label={t("common.loading")}>
    <div className="h-full w-1/3 animate-[loading_1s_ease-in-out_infinite] rounded-full bg-brand-600" />
  </div>
);
};

export default Loading;
