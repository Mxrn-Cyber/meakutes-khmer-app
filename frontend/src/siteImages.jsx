import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api/client";
import { SiteImagesContext } from "./useSiteImages";

// Loads the photos admins chose in Admin > Site photos (see siteImagesConfig.js for the slots).
export function SiteImagesProvider({ children }) {
  const [custom, setCustom] = useState({});

  const reload = useCallback(
    () =>
      api
        .listSiteImages()
        .then((rows) => setCustom(rows || {}))
        .catch(() => setCustom({})),
    []
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(() => ({ custom, reload }), [custom, reload]);
  return <SiteImagesContext.Provider value={value}>{children}</SiteImagesContext.Provider>;
}
