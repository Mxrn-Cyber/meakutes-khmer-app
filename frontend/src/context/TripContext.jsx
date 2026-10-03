// contexts/TripContext.jsx
//
// This used to keep favorites/ratings in localStorage and sessionStorage.
// It now talks to the backend, so favorites follow the logged-in user
// across devices instead of living in one browser. The exported names
// (TripProvider, and useTripContext in ./useTrip.js) are unchanged so nothing importing them
// needs to change.
import {
  useState,
  useEffect,
  useCallback,
} from "react";

import { api } from "../api/client";
import { useAuth } from "./useAuth";
import { TripContext } from "./useTrip";


export const TripProvider = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]); // full destination objects
  const [isLoading, setIsLoading] = useState(true);

  const reloadFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }
    try {
      const rows = await api.listFavorites();
      // GET /api/favorites returns the destination rows directly (already
      // includes rating/reviews_count/images), see backend favorites router.
      setFavorites(rows);
    } catch (error) {
      console.warn("Error loading favorites:", error);
      setFavorites([]);
    }
  }, [user]);

  useEffect(() => {
    setIsLoading(true);
    reloadFavorites().finally(() => setIsLoading(false));
  }, [reloadFavorites]);

  const addToFavorites = useCallback(
    async (trip) => {
      if (!user) return;
      setFavorites((prev) => (prev.some((t) => t.id === trip.id) ? prev : [...prev, trip]));
      try {
        await api.addFavorite(trip.id);
      } catch (error) {
        console.warn("Error adding favorite:", error);
        reloadFavorites();
      }
    },
    [user, reloadFavorites]
  );

  const removeFromFavorites = useCallback(
    async (tripId) => {
      if (!user) return;
      setFavorites((prev) => prev.filter((trip) => trip.id !== tripId));
      try {
        await api.removeFavorite(tripId);
      } catch (error) {
        console.warn("Error removing favorite:", error);
        reloadFavorites();
      }
    },
    [user, reloadFavorites]
  );

  const isFavorite = useCallback(
    (tripId) => favorites.some((trip) => trip.id === tripId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (trip) => (isFavorite(trip.id) ? removeFromFavorites(trip.id) : addToFavorites(trip)),
    [isFavorite, removeFromFavorites, addToFavorites]
  );

  // Rating is now a real review row on the backend (see reviews router),
  // not something kept in sessionStorage.
  const rateTrip = useCallback(async (tripId, rating) => {
    await api.createReview({ destination_id: tripId, rating });
  }, []);

  const value = {
    favorites,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
    rateTrip,
    reloadFavorites,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};
