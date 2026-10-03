import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";

// Normalizes a backend DestinationOut into the shape the existing pages
// (Home/Discover/Popular/TripCard/TripDetail) were written against, so we
// only had to change *where* the data comes from, not every render.
export function mapDestination(d) {
  const imageUrls = (d.images || []).map((m) => api.mediaUrl(m.url));
  return {
    ...d,
    image: imageUrls[0] || "/placeholder-image.jpg",
    images: imageUrls,
    reviews: d.reviews_count ?? 0,
    bestTime: d.best_time,
  };
}

export function useDestinations(params) {
  const [destinations, setDestinations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const paramsKey = JSON.stringify(params || {});

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rows = await api.listDestinations(JSON.parse(paramsKey));
      setDestinations(rows.map(mapDestination));
    } catch (err) {
      console.error("Failed to load destinations:", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [paramsKey]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { destinations, isLoading, error, refetch };
}

export function useDestination(idOrSlug) {
  const [destination, setDestination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!idOrSlug) return;
    let cancelled = false;
    setIsLoading(true);
    api
      .getDestination(idOrSlug)
      .then((d) => {
        if (!cancelled) setDestination(mapDestination(d));
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [idOrSlug]);

  return { destination, isLoading, error };
}
