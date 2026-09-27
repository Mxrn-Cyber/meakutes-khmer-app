import { useCallback, useMemo, useRef } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { MapPin } from "lucide-react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const CAMBODIA_CENTER = { lat: 12.5657, lng: 104.991 };
const mapStyle = { width: "100%", height: "320px", borderRadius: "0.75rem" };
const mapOptions = {
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
  clickableIcons: false,
  gestureHandling: "cooperative",
};

const round6 = (n) => Math.round(n * 1e6) / 1e6;

function toPoint(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (lat === "" || lng === "" || lat == null || lng == null) return null;
  if (Number.isNaN(la) || Number.isNaN(ln)) return null;
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return null;
  return { lat: la, lng: ln };
}

export default function LocationPicker({ latitude, longitude, onChange }) {
  // Same loader options as the place page, so the Maps script is loaded once.
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });
  const mapRef = useRef(null);
  const point = toPoint(latitude, longitude);
  // Only used for the first render; afterwards the map keeps its own view.
  const initialCenter = useMemo(() => point || CAMBODIA_CENTER, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setFromEvent = useCallback(
    (e) => {
      if (!e.latLng) return;
      onChange(round6(e.latLng.lat()), round6(e.latLng.lng()));
    },
    [onChange]
  );

  const recenter = () => {
    if (mapRef.current && point) {
      mapRef.current.panTo(point);
      mapRef.current.setZoom(Math.max(mapRef.current.getZoom() || 0, 14));
    }
  };

  let body;
  if (!GOOGLE_MAPS_API_KEY) {
    body = (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Set VITE_GOOGLE_MAPS_API_KEY to pick the location on a map. You can still type the
        latitude and longitude above.
      </p>
    );
  } else if (loadError) {
    body = (
      <p className="text-sm text-rose-600 dark:text-rose-400">
        The map could not load. Check the Google Maps API key and its allowed websites.
      </p>
    );
  } else if (!isLoaded) {
    body = <div className="h-[320px] rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />;
  } else {
    body = (
      <GoogleMap
        mapContainerStyle={mapStyle}
        center={initialCenter}
        zoom={point ? 14 : 7}
        options={mapOptions}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        onUnmount={() => {
          mapRef.current = null;
        }}
        onClick={setFromEvent}
      >
        {point && <Marker position={point} draggable onDragEnd={setFromEvent} />}
      </GoogleMap>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <MapPin size={16} className="text-brand-600" />
          Location on map
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {point
            ? `${point.lat}, ${point.lng}`
            : "Click the map to drop a pin"}
        </span>
      </div>
      {body}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        {GOOGLE_MAPS_API_KEY && !loadError && <span>Click the map or drag the pin to set the location.</span>}
        {point && isLoaded && (
          <button type="button" onClick={recenter} className="text-brand-600 hover:underline dark:text-brand-400">
            Show pin
          </button>
        )}
        {point && (
          <a
            href={`https://www.google.com/maps?q=${point.lat},${point.lng}`}
            target="_blank"
            rel="noreferrer"
            className="text-brand-600 hover:underline dark:text-brand-400"
          >
            Open in Google Maps
          </a>
        )}
      </div>
    </div>
  );
}
