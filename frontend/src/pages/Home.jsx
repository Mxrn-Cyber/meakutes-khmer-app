import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, MapPin, CalendarDays, Star, Map as MapIcon, PartyPopper, ArrowRight } from "lucide-react";
import { useDestinations } from "../hooks/useDestinations";
import { useNewsEvents } from "../hooks/useNewsEvents";
import { useAuth } from "../context/AuthContext";
import {
  Container,
  SectionHeading,
  ViewAllLink,
  PlaceCard,
  PlaceCardSkeleton,
  buttonClass,
} from "../components/ui";

const SLIDES = [
  { src: "/angkor-morning.png", caption: "Angkor Wat at sunrise, Siem Reap" },
  { src: "/bayon-temple.png", caption: "Bayon Temple, Siem Reap" },
  { src: "/palace.png", caption: "Royal Palace, Phnom Penh" },
  { src: "/Landscape.png", caption: "Countryside of Cambodia" },
  { src: "/monk-front.png", caption: "Monks at a temple" },
];

function Hero({ placeCount, provinceCount, eventCount }) {
  const [slide, setSlide] = useState(0);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/discover?q=${encodeURIComponent(q)}` : "/discover");
  };

  return (
    <section className="relative isolate -mt-16 flex min-h-[640px] items-end overflow-hidden bg-gray-900 pb-16 pt-32 sm:min-h-[720px] sm:pb-24">
      {SLIDES.map((s, i) => (
        <img
          key={s.src}
          src={s.src}
          alt=""
          className={`absolute inset-0 -z-20 h-full w-full object-cover transition-opacity duration-[1500ms] ${
            i === slide ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-gray-950/90 via-gray-950/40 to-gray-950/30" />

      <Container>
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white backdrop-blur">
            <MapPin size={14} /> Kingdom of Cambodia
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-6xl">
            Find your next <span className="text-amber-300">dream place</span> in Cambodia
          </h1>
          <p className="mt-3 font-khmer text-lg text-white/90 sm:text-xl">ស្វែងរកទីកន្លែងក្នុងក្តីស្រមៃរបស់អ្នក</p>

          <form onSubmit={submit} className="mt-8 flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 shadow-lift">
            <Search size={20} className="ml-3 shrink-0 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search temples, beaches, provinces…"
              aria-label="Search places"
              className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
            />
            <button type="submit" className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
              Search
            </button>
          </form>

          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-white">
            {[
              [placeCount, "places to visit"],
              [provinceCount, "provinces"],
              [eventCount, "festivals & events"],
            ].map(([n, label]) => (
              <div key={label} className="flex items-baseline gap-2">
                <dt className="text-2xl font-bold">{n || "–"}</dt>
                <dd className="text-sm text-white/80">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-10 flex items-center justify-between gap-4">
          <div className="flex gap-2" role="tablist" aria-label="Photos">
            {SLIDES.map((s, i) => (
              <button
                key={s.src}
                type="button"
                onClick={() => setSlide(i)}
                aria-label={`Show photo ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === slide ? "w-8 bg-white" : "w-4 bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>
          <p className="hidden text-xs text-white/70 sm:block">{SLIDES[slide].caption}</p>
        </div>
      </Container>
    </section>
  );
}

function ProvinceTiles({ places }) {
  const provinces = useMemo(() => {
    const map = new Map();
    for (const p of places) {
      if (!p.province) continue;
      const entry = map.get(p.province) || { name: p.province, count: 0, image: p.image };
      entry.count += 1;
      map.set(p.province, entry);
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 9);
  }, [places]);

  if (!provinces.length) return null;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {provinces.map((p, i) => (
        <Link
          key={p.name}
          to={`/discover?province=${encodeURIComponent(p.name)}`}
          className={`group relative isolate overflow-hidden rounded-2xl bg-gray-900 ${
            i === 0 ? "col-span-2 aspect-[2/1] lg:row-span-2 lg:aspect-auto" : "aspect-[4/3]"
          } ${i === 8 ? "hidden lg:block" : i === 7 ? "hidden sm:block" : ""}`}
        >
          <img src={p.image} alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-90" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="flex h-full flex-col justify-end p-4 text-white">
            <p className={`font-bold ${i === 0 ? "text-2xl" : "text-base sm:text-lg"}`}>{p.name}</p>
            <p className="text-sm text-white/80">
              {p.count} {p.count === 1 ? "place" : "places"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function EventCard({ event }) {
  return (
    <Link
      to={`/article/${event.id}`}
      className="group flex gap-4 rounded-2xl bg-white p-3 shadow-card ring-1 ring-gray-900/5 transition hover:shadow-lift dark:bg-gray-900 dark:ring-white/10"
    >
      <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
        {event.pic && <img src={event.pic} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
      </div>
      <div className="min-w-0 py-1">
        {event.date && (
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400">
            <CalendarDays size={13} /> {event.date}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 font-semibold text-gray-900 group-hover:text-brand-600 dark:text-white">{event.title}</h3>
        {event.location && (
          <p className="mt-1 flex items-center gap-1 truncate text-sm text-gray-500 dark:text-gray-400">
            <MapPin size={13} /> {event.location}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function Home() {
  const { destinations, isLoading } = useDestinations({ status: "published" });
  const { newsEvents } = useNewsEvents();
  const { isAuthenticated } = useAuth();

  const topRated = useMemo(
    () =>
      [...destinations]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviews || 0) - (a.reviews || 0))
        .slice(0, 8),
    [destinations]
  );
  const provinceCount = useMemo(() => new Set(destinations.map((d) => d.province).filter(Boolean)).size, [destinations]);

  return (
    <>
      <Hero placeCount={destinations.length} provinceCount={provinceCount} eventCount={newsEvents.length} />

      <Container className="py-16 sm:py-20">
        <SectionHeading
          eyebrow="Top rated"
          title="Places travellers love"
          subtitle="Rated and reviewed by visitors to Meakutes-Khmer."
          action={<ViewAllLink to="/popular">See all popular places</ViewAllLink>}
        />
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {(isLoading ? Array.from({ length: 4 }, (_, i) => ({ id: `s${i}` })) : topRated).map((trip) => (
            <div key={trip.id} className="w-[80%] shrink-0 snap-start sm:w-auto">
              {isLoading ? <PlaceCardSkeleton /> : <PlaceCard trip={trip} />}
            </div>
          ))}
        </div>
      </Container>

      <section className="bg-brand-50/60 py-16 dark:bg-gray-900/40 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Explore by province"
            title="Where do you want to go?"
            subtitle="From the temples of Siem Reap to the coast of Kep and the hills of Mondulkiri."
            action={<ViewAllLink to="/discover">Browse all places</ViewAllLink>}
          />
          <ProvinceTiles places={destinations} />
        </Container>
      </section>

      {newsEvents.length > 0 && (
        <Container className="py-16 sm:py-20">
          <SectionHeading
            eyebrow="Festivals & events"
            title="What's happening in Cambodia"
            action={<ViewAllLink to="/news">All events</ViewAllLink>}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {newsEvents.slice(0, 6).map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </Container>
      )}

      <section className="bg-brand-50/60 py-16 dark:bg-gray-900/40 sm:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { Icon: Star, title: "Honest reviews", text: "Read ratings and reviews from real visitors before you go." },
              { Icon: MapIcon, title: "Maps & tips", text: "See each place on the map with the best time to visit and how to get in." },
              { Icon: PartyPopper, title: "Festivals", text: "Plan around Khmer New Year, the Water Festival, Pchum Ben and more." },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="rounded-2xl p-6 ring-1 ring-gray-900/5 dark:ring-white/10">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                  <Icon size={22} />
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <Container className="py-16 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="relative">
            <img src="/angkor-wat.png" alt="Angkor Wat" loading="lazy" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-lift" />
            <div className="absolute -bottom-5 right-5 rounded-2xl bg-white px-5 py-4 shadow-lift dark:bg-gray-900">
              <p className="text-2xl font-bold text-brand-600">ITE G8</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Final-year project</p>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">Our story</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Helping Cambodia's tourism recover</h2>
            <div className="mt-4 space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Cambodia boasts a variety of tourist attractions, from the awe-inspiring temples built by Khmer
                ancestors to modern resorts, mountain landscapes, diverse wildlife and some of the most beautiful
                beaches in Asia. The COVID-19 pandemic caused a significant decline in tourism, impacting local
                livelihoods.
              </p>
              <p>
                To address this, students of the Department of Information Technology Engineering (8th generation),
                under the guidance of our advisor, Ky Sok Lay, created Meakutes-Khmer to promote new and beautiful
                tourist sites across Cambodia for Cambodians and foreign visitors alike.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/about" className={buttonClass.primary}>
                Read our story <ArrowRight size={16} />
              </Link>
              {!isAuthenticated && (
                <Link to="/signup" className={buttonClass.secondary}>
                  Create a free account
                </Link>
              )}
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
