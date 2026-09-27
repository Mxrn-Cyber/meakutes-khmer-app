import { useEffect, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

// Google calls window.gm_authFailure when it refuses the key (website not allowed,
// Maps JavaScript API not enabled, billing off, wrong key). The script still "loads",
// so without this the map just turns into Google's grey error box.
let authFailed = false;
const listeners = new Set();
if (typeof window !== "undefined") {
  const previous = window.gm_authFailure;
  window.gm_authFailure = () => {
    authFailed = true;
    console.warn(
      `Google Maps refused the API key for ${window.location.origin}. ` +
        "In Google Cloud, check: Maps JavaScript API enabled, billing on, and this website in the key's allowed referrers."
    );
    listeners.forEach((fn) => fn(true));
    if (typeof previous === "function") previous();
  };
}

/** One loader for every map in the app (same id and options everywhere). */
export function useGoogleMaps() {
  const { isLoaded, loadError } = useJsApiLoader({ id: "google-map-script", googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const [failed, setFailed] = useState(authFailed);
  useEffect(() => {
    listeners.add(setFailed);
    return () => listeners.delete(setFailed);
  }, []);
  const usable = Boolean(GOOGLE_MAPS_API_KEY) && isLoaded && !loadError && !failed;
  return { isLoaded, usable, error: !GOOGLE_MAPS_API_KEY ? "no-key" : failed ? "auth" : loadError ? "load" : null };
}

/** Key-free Google Maps embed, used when the JavaScript map can't be shown. */
export function embedUrl({ lat, lng, query, zoom = 14 }) {
  const q = lat != null && lng != null ? `${lat},${lng}` : query;
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&output=embed`;
}
