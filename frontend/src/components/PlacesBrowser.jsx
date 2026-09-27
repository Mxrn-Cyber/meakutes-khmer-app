import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, MapPinned, ChevronLeft, ChevronRight } from "lucide-react";
import { useDestinations } from "../hooks/useDestinations";
import { Container, PageHero, PlaceCard, PlaceCardSkeleton, EmptyState, buttonClass } from "./ui";

const PER_PAGE = 12;
const ACCESS_ORDER = { Easy: 1, Moderate: 2, Challenging: 3 };

const SORTS = {
  rating: { label: "Top rated", fn: (a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviews || 0) - (a.reviews || 0) },
  reviews: { label: "Most reviewed", fn: (a, b) => (b.reviews || 0) - (a.reviews || 0) || (b.rating || 0) - (a.rating || 0) },
  name: { label: "Name A–Z", fn: (a, b) => a.name.localeCompare(b.name) },
  access: {
    label: "Easiest to visit",
    fn: (a, b) => (ACCESS_ORDER[a.accessibility] || 4) - (ACCESS_ORDER[b.accessibility] || 4),
  },
};

export default function PlacesBrowser({ heroImage, eyebrow, title, subtitle, defaultSort = "rating", showRank = false }) {
  const { destinations, isLoading, error } = useDestinations({ status: "published" });
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const province = params.get("province") || "";
  const sort = SORTS[params.get("sort")] ? params.get("sort") : defaultSort;
  const [page, setPage] = useState(1);
  const resultsRef = useRef(null);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setPage(1);
  };

  // Keep ?q= in sync while typing, without a history entry per key.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") || "") !== query.trim()) setParam("q", query.trim());
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const provinces = useMemo(
    () => [...new Set(destinations.map((d) => d.province).filter(Boolean))].sort(),
    [destinations]
  );

  const results = useMemo(() => {
    const q = (params.get("q") || "").toLowerCase();
    return destinations
      .filter((d) => !province || d.province === province)
      .filter(
        (d) =>
          !q ||
          d.name.toLowerCase().includes(q) ||
          (d.description || "").toLowerCase().includes(q) ||
          (d.province || "").toLowerCase().includes(q)
      )
      .sort(SORTS[sort].fn);
  }, [destinations, params, province, sort]);

  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const pageItems = results.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const filtersActive = Boolean(province || params.get("q"));

  const goToPage = (n) => {
    setPage(n);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearAll = () => {
    setQuery("");
    setParams(new URLSearchParams(), { replace: true });
    setPage(1);
  };

  const chip = (active) =>
    `shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
      active
        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
        : "bg-white text-gray-700 ring-1 ring-gray-900/10 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:ring-white/10 dark:hover:bg-gray-800"
    }`;

  return (
    <>
      <PageHero image={heroImage} eyebrow={eyebrow} title={title} subtitle={subtitle}>
        <label className="flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 pl-4 shadow-lift">
          <Search size={20} className="shrink-0 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, province or keyword"
            aria-label="Search places"
            className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="rounded-full p-2 text-gray-400 hover:bg-gray-100" aria-label="Clear search">
              <X size={18} />
            </button>
          )}
        </label>
      </PageHero>

      <div className="sticky top-16 z-30 border-b border-gray-200 bg-gray-50/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
        <Container className="flex items-center gap-3 py-3">
          <div className="-mx-1 flex flex-1 gap-2 overflow-x-auto px-1 py-0.5 [scrollbar-width:none]">
            <button type="button" className={chip(!province)} onClick={() => setParam("province", "")}>
              All provinces
            </button>
            {provinces.map((p) => (
              <button key={p} type="button" className={chip(province === p)} onClick={() => setParam("province", province === p ? "" : p)}>
                {p}
              </button>
            ))}
          </div>
          <label className="relative hidden shrink-0 sm:block">
            <span className="sr-only">Sort by</span>
            <SlidersHorizontal size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value === defaultSort ? "" : e.target.value)}
              className="appearance-none rounded-full border-0 bg-white py-2 pl-9 pr-8 text-sm font-medium text-gray-800 ring-1 ring-gray-900/10 focus:ring-2 focus:ring-brand-600 dark:bg-gray-900 dark:text-gray-200 dark:ring-white/10"
            >
              {Object.entries(SORTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        </Container>
      </div>

      <Container className="py-8 sm:py-10">
        <div ref={resultsRef} className="scroll-mt-32 mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isLoading ? "Loading places…" : (
              <>
                <span className="font-semibold text-gray-900 dark:text-white">{results.length}</span>{" "}
                {results.length === 1 ? "place" : "places"}
                {province && <> in <span className="font-semibold text-gray-900 dark:text-white">{province}</span></>}
                {params.get("q") && <> matching “{params.get("q")}”</>}
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <label className="sm:hidden">
              <span className="sr-only">Sort by</span>
              <select
                value={sort}
                onChange={(e) => setParam("sort", e.target.value === defaultSort ? "" : e.target.value)}
                className="rounded-full border-0 bg-white py-1.5 pl-3 pr-8 text-sm ring-1 ring-gray-900/10 dark:bg-gray-900 dark:ring-white/10"
              >
                {Object.entries(SORTS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
            {filtersActive && (
              <button type="button" onClick={clearAll} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                Clear filters
              </button>
            )}
          </div>
        </div>

        {error ? (
          <EmptyState icon={MapPinned} title="Could not load places">
            Please check your connection and try again.
          </EmptyState>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <PlaceCardSkeleton key={i} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={MapPinned}
            title="No places found"
            action={
              <button type="button" onClick={clearAll} className={buttonClass.primary}>
                Show all places
              </button>
            }
          >
            Try another word or choose a different province.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((trip, i) => (
              <PlaceCard
                key={trip.id}
                trip={trip}
                rank={showRank && sort === "rating" && !filtersActive ? (current - 1) * PER_PAGE + i + 1 : undefined}
                onProvinceClick={(p) => setParam("province", p)}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pages">
            <button
              type="button"
              onClick={() => goToPage(current - 1)}
              disabled={current === 1}
              className="grid h-10 w-10 place-items-center rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => goToPage(n)}
                aria-current={n === current ? "page" : undefined}
                className={`h-10 min-w-[2.5rem] rounded-full px-3 text-sm font-semibold ${
                  n === current ? "bg-brand-600 text-white" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => goToPage(current + 1)}
              disabled={current === totalPages}
              className="grid h-10 w-10 place-items-center rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </nav>
        )}
      </Container>
    </>
  );
}
