import { createContext, useContext } from "react";

// Favourites and ratings of the logged-in user. Needs <TripProvider> (TripContext.jsx).
export const TripContext = createContext();

export const useTripContext = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error("useTripContext must be used within a TripProvider");
  }
  return context;
};
