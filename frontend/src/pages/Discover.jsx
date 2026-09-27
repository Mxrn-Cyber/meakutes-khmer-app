import { useState, useRef } from "react";
import { Search, MapPin, SortAsc, SortDesc } from "lucide-react";
import { useDestinations } from "../hooks/useDestinations";
import { useTripContext } from "../context/TripContext";
import TripCard from "../components/TripCard.jsx";

function Discover() {
  const provinces = [
    "All Provinces",
    "Banteay Meanchey",
    "Battambang",
    "Kampong Cham",
    "Kampong Chhnang",
    "Kampong Speu",
    "Kampong Thom",
    "Kampot",
    "Kandal",
    "Kep",
    "Koh Kong",
    "Kratie",
    "Mondulkiri",
    "Oddar Meanchey",
    "Pailin",
    "Phnom Penh",
    "Preah Vihear",
    "Prey Veng",
    "Pursat",
    "Ratanakiri",
    "Siem Reap",
    "Preah Sihanouk",
    "Stung Treng",
    "Svay Rieng",
    "Takeo",
    "Tbong Khmum",
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("All Provinces");
  const [sortBy, setSortBy] = useState("rating");
  const [sortOrder, setSortOrder] = useState("desc");
  const [highlightedProvince, setHighlightedProvince] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [tripRatings, setTripRatings] = useState({});
  const tripsPerPage = 24;

  const { destinations: tripsData, isLoading } = useDestinations({ status: "published" });
  const { rateTrip } = useTripContext();

  // Reference for the destinations section
  const destinationsRef = useRef(null);

  const handleProvinceClick = (province) => {
    setSelectedProvince(province);
    setHighlightedProvince(province);
    setCurrentPage(1); // Reset to first page on province change
    setTimeout(() => {
      setHighlightedProvince("");
    }, 3000);
  };

  const handleRateTrip = (tripId, rating) => {
    setTripRatings((prev) => ({
      ...prev,
      [tripId]: rating,
    }));
    rateTrip(tripId, rating).catch((err) => console.error("Failed to save rating:", err));
  };

  const tripsWithRatings = tripsData.map((trip) => ({
    ...trip,
    rating: tripRatings[trip.id] || trip.rating,
  }));

  const filteredAndSortedTrips = tripsWithRatings
    .filter((trip) => {
      const matchesSearch =
        trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProvince =
        selectedProvince === "All Provinces" ||
        trip.province === selectedProvince;
      return matchesSearch && matchesProvince;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "rating":
          aValue = a.rating;
          bValue = b.rating;
          break;
        case "reviews":
          aValue = a.reviews;
          bValue = b.reviews;
          break;
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "accessibility":
          const accessOrder = { Easy: 1, Moderate: 2, Challenging: 3 };
          aValue = accessOrder[a.accessibility] || 4;
          bValue = accessOrder[b.accessibility] || 4;
          break;
        default:
          return 0;
      }
      return sortOrder === "asc"
        ? aValue > bValue
          ? 1
          : -1
        : aValue < bValue
        ? 1
        : -1;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedTrips.length / tripsPerPage);
  const paginatedTrips = filteredAndSortedTrips.slice(
    (currentPage - 1) * tripsPerPage,
    currentPage * tripsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    destinationsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    setCurrentPage(1); // Reset to first page on sort change
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-gray-500 dark:text-gray-400">
        Loading destinations...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="text-center max-w-4xl mx-auto mb-12">
        <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-4 py-2 rounded-full text-sm font-semibold tracking-wide uppercase inline-block mb-4">
          Discover Cambodia
        </span>
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Explore Our Top Destinations
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Discover the most beautiful and culturally rich destinations that
          Cambodia has to offer
        </p>
      </div>

      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-6 items-stretch lg:items-center">
            <div className="relative w-full lg:flex-1 lg:max-w-md">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            <div className="relative w-full lg:w-auto">
              <MapPin
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white pl-10 pr-10 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-all duration-300 w-full lg:w-auto lg:min-w-[200px]"
              >
                {provinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <select
                value={sortBy}
                aria-label="Sort by"
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 flex-1 lg:flex-none"
              >
                <option value="rating">Rating</option>
                <option value="reviews">Reviews</option>
                <option value="name">Name</option>
                <option value="accessibility">Accessibility</option>
              </select>
              <button
                onClick={toggleSortOrder}
                aria-label={sortOrder === "asc" ? "Sort ascending" : "Sort descending"}
                title={sortOrder === "asc" ? "Ascending" : "Descending"}
                className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300"
              >
                {sortOrder === "asc" ? (
                  <SortAsc size={20} />
                ) : (
                  <SortDesc size={20} />
                )}
              </button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredAndSortedTrips.length} of {tripsData.length}{" "}
            destinations
            {selectedProvince !== "All Provinces" && (
              <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs">
                {selectedProvince}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto" ref={destinationsRef}>
        {paginatedTrips.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {paginatedTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onProvinceClick={handleProvinceClick}
                  isHighlighted={highlightedProvince === trip.province}
                  onRateTrip={handleRateTrip}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => handlePageChange(index + 1)}
                    className={`px-4 py-2 rounded-full ${
                      currentPage === index + 1
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    } hover:bg-blue-500 hover:text-white transition-all duration-300`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Search size={48} className="mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No destinations found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Try adjusting your search terms or filters to find more
              destinations.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedProvince("All Provinces");
                setCurrentPage(1);
              }}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-300"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Discover;
