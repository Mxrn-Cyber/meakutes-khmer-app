import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  CalendarDays,
  Star,
  Map as MapIcon,
  PartyPopper,
  ArrowRight,
} from "lucide-react";
import { useDestinations } from "../hooks/useDestinations";
import { useNewsEvents } from "../hooks/useNewsEvents";
import { useAuth } from "../context/useAuth";
import { useLang } from "../i18n";
import { CountUp, FadeImg } from "../components/motion";
import { reveal } from "../utils/motion";
import { useSiteImage } from "../useSiteImages";
import {
  Container,
  SectionHeading,
  ViewAllLink,
  PlaceCard,
  PlaceCardSkeleton,
} from "../components/ui";
import { buttonClass, RATIO } from "../components/styles";

// Photos and captions can be changed in Admin > Site photos (defaults: siteImages.jsx).
const SLIDE_KEYS = [
  "home_slide_1",
  "home_slide_2",
  "home_slide_3",
  "home_slide_4",
  "home_slide_5",
];
const FEATURE_ICONS = [Star, MapIcon, PartyPopper];

function Hero({ placeCount, provinceCount, eventCount }) {
  const [slide, setSlide] = useState(0);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { t } = useLang();
  const slides = [
    useSiteImage(SLIDE_KEYS[0]),
    useSiteImage(SLIDE_KEYS[1]),
    useSiteImage(SLIDE_KEYS[2]),
    useSiteImage(SLIDE_KEYS[3]),
    useSiteImage(SLIDE_KEYS[4]),
  ];

  useEffect(() => {
    const timer = setInterval(
      () => setSlide((s) => (s + 1) % SLIDE_KEYS.length),
      6000,
    );
    return () => clearInterval(timer);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/discover?q=${encodeURIComponent(q)}` : "/discover");
  };

  return (
    <section className="relative isolate -mt-16 flex min-h-[640px] items-end overflow-hidden bg-gray-900 pb-16 pt-32 sm:min-h-[720px] sm:pb-24">
      {slides.map(({ src }, i) => (
        <div
          key={SLIDE_KEYS[i]}
          className={`absolute inset-0 -z-20 overflow-hidden transition-opacity duration-[1500ms] ${
            i === slide ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            key={i === slide ? `on-${slide}` : "off"}
            src={src}
            alt=""
            className={`h-full w-full object-cover ${i === slide ? "animate-ken-burns" : ""}`}
          />
        </div>
      ))}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-gray-950/90 via-gray-950/40 to-gray-950/30" />

      <Container>
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex animate-rise-in items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white backdrop-blur">
            <MapPin size={14} /> {t("home.kingdom")}
          </p>
          <h1 className="animate-rise-in text-4xl font-extrabold leading-[1.1] tracking-tight text-white [animation-delay:100ms] sm:text-6xl">
            {t("home.titleA")}
            <span className="text-amber-300">{t("home.titleHighlight")}</span>
            {t("home.titleB")}
          </h1>
          <p className="mt-3 animate-rise-in text-lg text-white/90 [animation-delay:200ms] sm:text-xl">
            {t("home.subtitle")}
          </p>

          <form
            onSubmit={submit}
            className="mt-8 flex max-w-xl animate-rise-in items-center gap-2 rounded-full bg-white p-1.5 shadow-lift ring-brand-300 transition [animation-delay:300ms] focus-within:ring-4"
          >
            <Search size={20} className="ml-3 shrink-0 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("home.searchPlaceholder")}
              aria-label={t("home.searchLabel")}
              className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
            />
            <button
              type="submit"
              className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {t("home.search")}
            </button>
          </form>

          <dl className="mt-8 flex animate-rise-in flex-wrap gap-x-8 gap-y-3 text-white [animation-delay:400ms]">
            {[
              [placeCount, t("home.statPlaces")],
              [provinceCount, t("home.statProvinces")],
              [eventCount, t("home.statEvents")],
            ].map(([n, label]) => (
              <div key={label} className="flex items-baseline gap-2">
                <dt className="text-2xl font-bold tabular-nums">
                  {n ? <CountUp value={n} /> : "–"}
                </dt>
                <dd className="text-sm text-white/80">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-10 flex items-center justify-between gap-4">
          <div
            className="flex gap-2"
            role="tablist"
            aria-label={t("home.photos")}
          >
            {SLIDE_KEYS.map((key, i) => (
              <button
                key={key}
                type="button"
                onClick={() => setSlide(i)}
                aria-label={t("home.showPhoto", { n: i + 1 })}
                className={`h-1.5 rounded-full transition-all ${i === slide ? "w-8 bg-white" : "w-4 bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>
          <p className="hidden text-xs text-white/70 sm:block">
            {slides[slide].caption}
          </p>
        </div>
      </Container>
    </section>
  );
}

function ProvinceTiles({ places }) {
  const { t, tv } = useLang();
  const provinces = useMemo(() => {
    const map = new Map();
    for (const p of places) {
      if (!p.province) continue;
      const entry = map.get(p.province) || {
        name: p.province,
        count: 0,
        image: p.image,
      };
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
          {...reveal(i, 60, "zoom")}
          className={`group relative isolate overflow-hidden rounded-2xl bg-gray-900 ${
            i === 0
              ? `col-span-2 ${RATIO.banner} lg:row-span-2 lg:aspect-auto`
              : RATIO.photo
          } ${i === 8 ? "hidden lg:block" : i === 7 ? "hidden sm:block" : ""}`}
        >
          <img
            src={p.image}
            alt=""
            loading="lazy"
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-80 transition duration-700 ease-out group-hover:scale-110 group-hover:opacity-95"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="flex h-full flex-col justify-end p-4 text-white">
            <p
              className={`font-bold transition-transform duration-300 group-hover:-translate-y-0.5 ${i === 0 ? "text-2xl" : "text-base sm:text-lg"}`}
            >
              {tv(p.name)}
            </p>
            <p className="text-sm text-white/80">
              {t("common.places", { count: p.count })}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function EventCard({ event, index = 0 }) {
  const { pick, tv } = useLang();
  return (
    <Link
      {...reveal(index)}
      to={`/article/${event.id}`}
      className="group flex gap-4 rounded-2xl bg-white p-3 shadow-card ring-1 ring-gray-900/5 transition-shadow duration-300 hover:shadow-lift dark:bg-gray-900 dark:ring-white/10"
    >
      <div
        className={`relative w-32 shrink-0 self-start ${RATIO.photo} overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800`}
      >
        {event.pic && (
          <FadeImg
            src={event.pic}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        )}
      </div>
      <div className="min-w-0 py-1">
        {event.date && (
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400">
            <CalendarDays size={13} /> {tv(event.date)}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 font-semibold text-gray-900 group-hover:text-brand-600 dark:text-white">
          {pick(event, "title")}
        </h3>
        {event.location && (
          <p className="mt-1 flex items-center gap-1 truncate text-sm text-gray-500 dark:text-gray-400">
            <MapPin size={13} /> {tv(event.location)}
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
  const { t } = useLang();
  const storyPhoto = useSiteImage("home_story");

  const topRated = useMemo(
    () =>
      [...destinations]
        .sort(
          (a, b) =>
            (b.rating || 0) - (a.rating || 0) ||
            (b.reviews || 0) - (a.reviews || 0),
        )
        .slice(0, 8),
    [destinations],
  );
  const provinceCount = useMemo(
    () => new Set(destinations.map((d) => d.province).filter(Boolean)).size,
    [destinations],
  );

  return (
    <>
      <Hero
        placeCount={destinations.length}
        provinceCount={provinceCount}
        eventCount={newsEvents.length}
      />

      <Container className="py-16 sm:py-20">
        <SectionHeading
          eyebrow={t("home.topEyebrow")}
          title={t("home.topTitle")}
          subtitle={t("home.topSubtitle")}
          action={<ViewAllLink to="/popular">{t("home.topAll")}</ViewAllLink>}
        />
        <div
          data-reveal=""
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4"
        >
          {(isLoading
            ? Array.from({ length: 4 }, (_, i) => ({ id: `s${i}` }))
            : topRated
          ).map((trip) => (
            <div
              key={trip.id}
              className="w-[80%] shrink-0 snap-start sm:w-auto"
            >
              {isLoading ? <PlaceCardSkeleton /> : <PlaceCard trip={trip} />}
            </div>
          ))}
        </div>
      </Container>

      <section className="bg-brand-50/60 py-16 dark:bg-gray-900/40 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow={t("home.provEyebrow")}
            title={t("home.provTitle")}
            subtitle={t("home.provSubtitle")}
            action={
              <ViewAllLink to="/discover">{t("home.provAll")}</ViewAllLink>
            }
          />
          <ProvinceTiles places={destinations} />
        </Container>
      </section>

      {newsEvents.length > 0 && (
        <Container className="py-16 sm:py-20">
          <SectionHeading
            eyebrow={t("home.eventsEyebrow")}
            title={t("home.eventsTitle")}
            action={<ViewAllLink to="/news">{t("home.eventsAll")}</ViewAllLink>}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {newsEvents.slice(0, 6).map((e, i) => (
              <EventCard key={e.id} event={e} index={i} />
            ))}
          </div>
        </Container>
      )}

      <section className="bg-brand-50/60 py-16 dark:bg-gray-900/40 sm:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {t("home.features").map(({ title, text }, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <div
                  key={title}
                  {...reveal(i, 100)}
                  className="group rounded-2xl bg-white/60 p-6 ring-1 ring-gray-900/5 transition-shadow duration-300 hover:shadow-lift dark:bg-transparent dark:ring-white/10"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 dark:bg-brand-900/30 dark:text-brand-300">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {text}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      <Container className="py-16 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="relative" data-reveal="zoom">
            <img
              src={storyPhoto.src}
              alt={t("home.storyTitle")}
              loading="lazy"
              className={`${RATIO.photo} w-full rounded-3xl object-cover shadow-lift`}
            />
            <div className="absolute -bottom-5 right-5 animate-float-slow rounded-2xl bg-white px-5 py-4 shadow-lift dark:bg-gray-900">
              <p className="text-2xl font-bold text-brand-600">ITE G8</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("home.project")}
              </p>
            </div>
          </div>
          <div {...reveal(1, 150)}>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              {t("home.storyEyebrow")}
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("home.storyTitle")}
            </h2>
            <div className="mt-4 space-y-4 text-gray-600 dark:text-gray-400">
              <p>{t("home.story1")}</p>
              <p>{t("home.story2")}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/about" className={buttonClass.primary}>
                {t("home.readStory")} <ArrowRight size={16} />
              </Link>
              {!isAuthenticated && (
                <Link to="/signup" className={buttonClass.secondary}>
                  {t("home.createAccount")}
                </Link>
              )}
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
