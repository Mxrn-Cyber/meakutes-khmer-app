import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Heart } from "lucide-react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useDestination, useDestinations } from "../hooks/useDestinations";
import { useTripContext } from "../context/TripContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

if (!GOOGLE_MAPS_API_KEY) {
  console.warn("VITE_GOOGLE_MAPS_API_KEY is not set, so the map will not load.");
}

// Map container style
const mapContainerStyle = {
  width: "100%",
  height: "40vh",
  borderRadius: "0.75rem",
};

// Default map options
const mapOptions = {
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
};

// Helper function to shuffle array and get random items
const getRandomTrips = (trips, excludeId, count = 3) => {
  const filteredTrips = trips.filter((t) => t.id.toString() !== excludeId);
  const shuffled = [...filteredTrips].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

function ReviewsPanel({ destinationId }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .listReviews(destinationId)
      .then((rows) => {
        if (!cancelled) setReviews(rows);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [destinationId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setSubmitting(true);
    try {
      await api.createReview({ destination_id: destinationId, rating, comment });
      const rows = await api.listReviews(destinationId);
      setReviews(rows);
      setComment("");
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md mt-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Reviews
      </h3>

      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              size={22}
              className={`cursor-pointer ${
                i < rating ? "text-amber-400 fill-current" : "text-gray-300"
              }`}
              onClick={() => setRating(i + 1)}
            />
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={
            isAuthenticated ? "Share your experience..." : "Log in to leave a review"
          }
          disabled={!isAuthenticated}
          rows={3}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-3 text-gray-900 dark:text-white disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {isAuthenticated ? (submitting ? "Submitting..." : "Submit review") : "Log in to review"}
        </button>
      </form>

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No reviews yet. Be the first to share your experience.
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i < review.rating
                          ? "text-amber-400 fill-current"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {review.user_display_name || "Traveler"}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { destination: trip, isLoading } = useDestination(id);
  const { destinations: allTrips } = useDestinations({ status: "published" });
  const { isFavorite, toggleFavorite } = useTripContext();
  const { isAuthenticated } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { isLoaded: mapsLoaded, loadError: mapsError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  // Memoize random trips to avoid re-shuffling on every render
  const randomTrips = useMemo(() => {
    return getRandomTrips(allTrips, id, 3);
  }, [allTrips, id]);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={`${
          i < Math.floor(rating)
            ? "text-amber-400 fill-current"
            : i < rating
            ? "text-amber-400 fill-current opacity-50"
            : "text-gray-300 dark:text-gray-600"
        } transition-colors duration-300`}
      />
    ));
  };

  const handleImageChange = (index) => {
    setCurrentImageIndex(index);
  };

  // Memoized map center
  const mapCenter = useMemo(() => {
    if (!trip) return { lat: 13.3671, lng: 103.8448 }; // Default to Siem Reap
    if (
      trip.latitude &&
      trip.longitude &&
      !isNaN(trip.latitude) &&
      !isNaN(trip.longitude)
    ) {
      return { lat: trip.latitude, lng: trip.longitude };
    }
    return { lat: 13.3671, lng: 103.8448 }; // Fallback
  }, [trip]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading destination...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-900 dark:to-gray-800 px-6">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
            Trip Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The destination you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
          >
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    toggleFavorite(trip);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 px-4 md:px-8 py-12">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
        {/* Left: Images and Map */}
        <div className="space-y-6">
          <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-xl">
            <img
              src={trip.images?.[currentImageIndex] || trip.image}
              alt={trip.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <button
              onClick={handleToggleFavorite}
              className="absolute top-4 right-4 p-2.5 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all"
              aria-label={isFavorite(trip.id) ? "Remove from favourites" : "Add to favourites"}
            >
              <Heart
                size={22}
                className={
                  isFavorite(trip.id)
                    ? "text-red-500 fill-current"
                    : "text-white fill-none"
                }
              />
            </button>
          </div>

          {/* Image Thumbnails */}
          <div className="flex gap-4 overflow-x-auto">
            {trip.images?.slice(0, 4).map((img, index) => (
              <img
                key={index}
                src={img}
                onClick={() => handleImageChange(index)}
                alt={`Thumbnail ${index}`}
                className={`w-24 h-24 rounded-xl object-cover cursor-pointer border-2 ${
                  currentImageIndex === index
                    ? "border-blue-500 ring-2 ring-blue-300"
                    : "border-transparent"
                } transition-all duration-300`}
              />
            ))}
          </div>

          {/* Google Maps Dynamic Map */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Location Map
            </h3>
            <div className="w-full rounded-xl overflow-hidden shadow-md">
              {!GOOGLE_MAPS_API_KEY ? (
                <div className="flex items-center justify-center h-[40vh] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  Please provide a valid Google Maps API key in .env file.
                </div>
              ) : (
                <>
                  {mapsError ? (
                    <div className="flex items-center justify-center h-[40vh] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-center px-4">
                      The map could not load. Check the Google Maps API key and its allowed websites.
                    </div>
                  ) : !mapsLoaded ? (
                    <div className="flex items-center justify-center h-[40vh] bg-gray-100 dark:bg-gray-700">
                      <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                      </svg>
                    </div>
                  ) : (
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={mapCenter}
                      zoom={15}
                      options={mapOptions}
                    >
                      {trip.latitude != null && trip.longitude != null && (
                        <Marker
                          position={{ lat: trip.latitude, lng: trip.longitude }}
                          title={trip.name}
                        />
                      )}
                    </GoogleMap>
                  )}
                </>
              )}
            </div>
            {/* External link button */}
            <div className="mt-4">
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(
                  trip.name + ", " + trip.province + ", Cambodia"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all"
              >
                <MapPin size={16} />
                Open in Google Maps
              </a>
            </div>
          </div>

          <ReviewsPanel destinationId={trip.id} />
        </div>

        {/* Right: Trip Info */}
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {trip.name}
          </h1>
          <div className="flex items-center gap-2">
            {renderStars(trip.rating)}
            <span className="text-gray-600 dark:text-gray-300 ml-2 text-lg">
              {trip.rating}/5 ({trip.reviews} Reviews)
            </span>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
            {trip.description || "No description available."}
          </p>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-lg">
            <MapPin size={20} className="text-blue-500" />
            {trip.province}, Cambodia
          </div>

          {/* Additional Trip Details */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Duration
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                {trip.duration}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Access
              </h4>
              <p className="text-gray-600 dark:text-gray-300">{trip.access}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Best Time
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                {trip.bestTime}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Accessibility
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                {trip.accessibility}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Other Trips */}
      <div className="max-w-6xl mx-auto mt-20">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Other Trips You May Like
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {randomTrips.map((otherTrip) => (
            <div
              key={otherTrip.id}
              onClick={() => navigate(`/trip/${otherTrip.id}`)}
              className="cursor-pointer bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300"
            >
              <div className="relative h-44">
                <img
                  src={otherTrip.image}
                  alt={otherTrip.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full shadow-md">
                  {otherTrip.province}
                </span>
              </div>
              <div className="p-4 space-y-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {otherTrip.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {otherTrip.description || "No description available."}
                </p>
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-300 pt-2">
                  {renderStars(otherTrip.rating)}
                  <span className="ml-1">{otherTrip.rating}/5</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TripDetail;
