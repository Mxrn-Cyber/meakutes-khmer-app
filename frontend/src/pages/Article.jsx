import { useParams, Link } from "react-router-dom";
import { useNewsEvents } from "../hooks/useNewsEvents";
import { useState, useEffect, useRef } from "react";
import CommentsPanel from "../components/CommentsPanel";

function Article() {
  const { id } = useParams();
  const { newsEvents, isLoading: newsLoading } = useNewsEvents();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (newsLoading) return;
    if (!id || isNaN(parseInt(id))) {
      console.error("Invalid ID:", id);
      setLoading(false);
      return;
    }

    const foundItem = newsEvents.find((e) => e.id === parseInt(id));
    setItem(foundItem || null);
    setLoading(false);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        console.log("Clicked outside dropdown");
        setShowCalendarDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [id, newsEvents, newsLoading]);

  const handleImageError = () => {
    console.log("Image failed to load:", item?.pic);
    setImageError(true);
  };

  const parseEventDate = (dateStr) => {
    if (!dateStr) {
      console.warn("No date provided, using fallback");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }

    try {
      let cleanDate = dateStr.trim();
      if (cleanDate.includes("-")) {
        const parts = cleanDate.split("-")[0].trim();
        const yearMatch = cleanDate.match(
          /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i
        );
        const monthMatch = cleanDate.match(/\d{4}/);
        if (yearMatch && monthMatch) {
          cleanDate = `${yearMatch[0]} ${parts.replace(/\D/g, "")}, ${
            monthMatch[0]
          }`;
        }
      }

      let date = new Date(cleanDate);
      if (isNaN(date.getTime())) {
        date = new Date(
          cleanDate.replace(/(\d{1,2})\s+(\w+)\s+(\d{4})/, "$2 $1, $3")
        );
      }

      if (isNaN(date.getTime())) {
        console.warn("Invalid date parsed, using fallback:", cleanDate);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      }
      return date;
    } catch (error) {
      console.error("Date parsing error:", error);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
  };

  const generateCalendarURL = (type) => {
    if (!item) {
      console.error("No item data available for calendar URL");
      return null;
    }

    const eventDate = parseEventDate(item.date);
    eventDate.setHours(10, 0, 0, 0);
    const endDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000);

    const formatCalendarDate = (date) => {
      const pad = (num) => String(num).padStart(2, "0");
      return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(
        date.getDate()
      )}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(
        date.getSeconds()
      )}Z`;
    };

    const startDateFormatted = formatCalendarDate(eventDate);
    const endDateFormatted = formatCalendarDate(endDate);

    const title = encodeURIComponent(item.title || "Untitled Event");
    const description = encodeURIComponent(
      `${item.description || "No description"} \nBest Time: ${
        item.bestTime || "November - March"
      } \nAccessibility: ${item.accessibility || "Easy"}`
    );
    const location = encodeURIComponent(item.location || "Unknown Location");

    try {
      switch (type) {
        case "google":
          return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateFormatted}/${endDateFormatted}&details=${description}&location=${location}&sf=true&output=xml`;
        // case "outlook":
        //   return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startDateFormatted}&enddt=${endDateFormatted}&body=${description}&location=${location}`;
        // case "office365":
        //   return `https://outlook.office.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startDateFormatted}&enddt=${endDateFormatted}&body=${description}&location=${location}`;
        // case "yahoo":
        //   const yahooStart = startDateFormatted.replace(/[TZ]/g, "");
        //   return `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${title}&st=${yahooStart}&dur=0200&desc=${description}&in_loc=${location}`;
        case "ics":
          return generateICSFile(
            { title, description, location },
            eventDate,
            endDate
          );
        default:
          throw new Error("Invalid calendar type");
      }
    } catch (error) {
      console.error(`Error generating ${type} calendar URL:`, error);
      return null;
    }
  };

  const generateICSFile = (eventDetails, startDate, endDate) => {
    const formatICSDate = (date) =>
      date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Event Calendar//EN",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@eventcalendar.com`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${decodeURIComponent(eventDetails.title)}`,
      `DESCRIPTION:${decodeURIComponent(eventDetails.description)}`,
      `LOCATION:${decodeURIComponent(eventDetails.location)}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    try {
      const blob = new Blob([icsContent], {
        type: "text/calendar;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${decodeURIComponent(eventDetails.title)
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error("Error generating ICS file:", error);
      return false;
    }
  };

  const handleAddToCalendar = (type) => {
    console.log("Adding to calendar:", type);
    try {
      const url = generateCalendarURL(type);
      if (!url && type !== "ics")
        throw new Error(`Failed to generate ${type} calendar URL`);
      if (type === "ics" && !url)
        throw new Error("Failed to generate ICS file");

      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      if (isMobile) {
        window.location.href = url;
        console.log("Mobile navigation to:", url);
      } else {
        const newWindow = window.open(url, "_blank", "noopener,noreferrer");
        console.log("Window opened:", newWindow ? "Success" : "Failed");
        if (!newWindow) {
          setTimeout(() => {
            if (!document.hasFocus() || !window.open(url, "_blank")) {
              console.log("Falling back to current tab navigation:", url);
            }
          }, 100); // Short delay to check if pop-up was blocked
        }
      }
      setShowCalendarDropdown(false);
    } catch (error) {
      console.error(`Error adding to ${type} calendar:`, error);
      alert(
        `Unable to add to ${
          type.charAt(0).toUpperCase() + type.slice(1)
        } Calendar. Please try another option.`
      );
    }
  };

  if (loading) {
    return (
      <section className="py-20 px-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Loading event details...
          </p>
        </div>
      </section>
    );
  }

  if (!item) {
    return (
      <section className="py-20 px-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-8xl mb-6">🔍</div>
          <h1 className="text-5xl font-bold text-red-600 dark:text-red-400 mb-4">
            Oops!
          </h1>
          <p className="text-xl text-red-700 dark:text-red-300 mb-8">
            The event you're looking for couldn't be found.
          </p>
          <Link
            to="/news"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <span>←</span> Back to Events
          </Link>
        </div>
      </section>
    );
  }

  const duration = item.date?.includes("-") ? "Multi-day" : "Single day";
  const bestTime = item.bestTime || "November - March";
  const accessibility = item.accessibility || "Easy";
  const relatedEvents = newsEvents
    .filter((event) => event.id !== item.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <nav className="mb-8">
            <Link
              to="/news"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-2 text-sm font-medium"
            >
              <span>←</span> Back to Events
            </Link>
          </nav>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="relative">
              <div className="aspect-[4/3] lg:aspect-auto lg:h-full">
                {!imageError && item.pic ? (
                  <img
                    src={item.pic}
                    alt={item.title || "Event Image"}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-200 to-indigo-300 dark:from-blue-800 dark:to-indigo-900 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-6xl mb-4">📅</div>
                      <p className="text-lg font-medium">Event Image</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="absolute top-6 left-6">
                <span className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 shadow-lg">
                  {duration}
                </span>
              </div>
            </div>
            <div className="p-8 lg:p-12 flex flex-col">
              <div className="flex-1">
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-6 leading-tight">
                  {item.title || "Untitled Event"}
                </h1>
                <p className="text-lg lg:text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                  {item.description || "No description available."}
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        Location
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {item.location || "Unknown"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <span className="text-2xl">🗓️</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        Date
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {item.date || "TBD"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <span className="text-xl">🌤️</span>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                          Best Time
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {bestTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <span className="text-xl">♿</span>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                          Accessibility
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {accessibility}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link
                  to="/news"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-4 rounded-xl text-base font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span>←</span>
                  All Events
                </Link>
                <div className="relative flex-1" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      console.log(
                        "Toggling dropdown, new state:",
                        !showCalendarDropdown
                      );
                      setShowCalendarDropdown(!showCalendarDropdown);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-4 rounded-xl text-base font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    aria-expanded={showCalendarDropdown}
                    aria-haspopup="true"
                  >
                    <span>📅</span>
                    Add to Calendar
                    <span
                      className={`transform transition-transform duration-200 ${
                        showCalendarDropdown ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>
                  {showCalendarDropdown && (
                    <div
                      className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
                      style={{
                        display: showCalendarDropdown ? "block" : "none",
                      }}
                    >
                      <div className="py-2">
                        {[
                          {
                            type: "google",
                            label: "Google Calendar",
                            icon: "📅",
                          },
                          // {
                          //   type: "outlook",
                          //   label: "Outlook Calendar",
                          //   icon: "📧",
                          // },
                          // {
                          //   type: "office365",
                          //   label: "Office 365",
                          //   icon: "🏢",
                          // },
                          // {
                          //   type: "yahoo",
                          //   label: "Yahoo Calendar",
                          //   icon: "🟣",
                          // },
                          {
                            type: "ics",
                            label: "Download",
                            icon: "💾",
                            note: "For Apple Calendar, Thunderbird, etc.",
                          },
                        ].map(({ type, label, icon, note }) => (
                          <button
                            key={type}
                            onClick={() => handleAddToCalendar(type)}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors ${
                              type === "ics"
                                ? "border-t border-gray-200 dark:border-gray-600"
                                : ""
                            }`}
                            aria-label={`Add to ${label}`}
                          >
                            <span className="text-lg">{icon}</span>
                            <div className="flex flex-col">
                              <span>{label}</span>
                              {note && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {note}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <CommentsPanel newsEventId={item.id} />
      {relatedEvents.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
              Other Events You Might Like
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedEvents.map((event) => (
                <Link
                  key={event.id}
                  to={`/article/${event.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={event.pic || "/src/assets/default.png"}
                      alt={event.title || "Event Image"}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        console.log("Related event image error:", event.pic);
                        e.target.src = "/src/assets/default.png";
                      }}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {event.title || "Untitled Event"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                      {event.description || "No description available."}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                      <span>📍</span>
                      <span>{event.location || "Unknown"}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Article;
