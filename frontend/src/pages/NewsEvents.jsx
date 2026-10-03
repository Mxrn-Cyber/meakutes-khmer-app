import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, CalendarDays, CalendarX2, ArrowRight } from "lucide-react";
import { useNewsEvents } from "../hooks/useNewsEvents";
import { Container, PageHero, EmptyState, PlaceCardSkeleton } from "../components/ui";
import { RATIO } from "../components/styles";
import { eventRange, eventStatus, daysUntil, dateBadge } from "../utils/eventDates";
import { useLang } from "../i18n";
import { FadeImg } from "../components/motion";
import { reveal } from "../utils/motion";
import { useSiteImage } from "../useSiteImages";

const TABS = [
  { key: "all", label: "news.all" },
  { key: "now", label: "news.now" },
  { key: "upcoming", label: "news.upcoming" },
];

function StatusBadge({ item }) {
  const { t } = useLang();
  const status = eventStatus(item);
  if (status === "now") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> {t("news.now")}
      </span>
    );
  }
  const days = daysUntil(item);
  if (status === "upcoming" && days != null && days <= 60) {
    return (
      <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-900">
        {t("common.inDays", { count: days })}
      </span>
    );
  }
  return null;
}

function DateBadge({ item }) {
  const { locale } = useLang();
  const b = dateBadge(item, locale);
  if (!b) return null;
  return (
    <div className="grid w-14 place-items-center rounded-xl bg-white py-1.5 text-center shadow-lift dark:bg-gray-900">
      <span className="max-w-full truncate px-0.5 text-[11px] font-bold tracking-wide text-rose-600">{b.month}</span>
      <span className="text-xl font-extrabold leading-none text-gray-900 dark:text-white">{b.day}</span>
    </div>
  );
}

function EventCard({ item }) {
  const { t, pick, tv } = useLang();
  const title = pick(item, "title");
  const description = pick(item, "description");
  return (
    <Link
      to={`/article/${item.slug || item.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-gray-900/5 transition duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lift dark:bg-gray-900 dark:ring-white/10"
    >
      <div className={`relative ${RATIO.photo} overflow-hidden bg-gray-100 dark:bg-gray-800`}>
        {item.pic && <FadeImg src={item.pic} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />}
        <div className="absolute left-3 top-3">
          <DateBadge item={item} />
        </div>
        <div className="absolute right-3 top-3">
          <StatusBadge item={item} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">
          <CalendarDays size={15} /> {item.date ? tv(item.date) : t("news.tba")}
        </p>
        <h3 className="mt-1.5 text-lg font-bold leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400">{title}</h3>
        {description && <p className="mt-2 line-clamp-3 text-sm text-gray-600 dark:text-gray-400">{description}</p>}
        <div className="mt-auto flex items-center justify-between pt-4 text-sm">
          <span className="inline-flex min-w-0 items-center gap-1 text-gray-500 dark:text-gray-400">
            <MapPin size={14} className="shrink-0" /> <span className="truncate">{item.location ? tv(item.location) : t("common.cambodia")}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-gray-900 dark:text-white">
            {t("common.details")} <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function FeaturedEvent({ item }) {
  const { t, pick, tv } = useLang();
  const description = pick(item, "description");
  return (
    <Link
      to={`/article/${item.slug || item.id}`}
      className="group relative isolate grid overflow-hidden rounded-3xl bg-gray-900 shadow-lift md:grid-cols-2"
    >
      <div className={`relative ${RATIO.banner} md:aspect-auto md:min-h-[360px]`}>
        {item.pic && <FadeImg src={item.pic} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105" />}
      </div>
      <div className="flex flex-col justify-center p-6 text-white sm:p-10">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusBadge item={item} />
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">{t("news.featured")}</span>
        </div>
        <h2 className="text-2xl font-extrabold sm:text-3xl">{pick(item, "title")}</h2>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/80">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={15} /> {item.date ? tv(item.date) : t("news.tba")}
          </span>
          {item.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} /> {tv(item.location)}
            </span>
          )}
        </p>
        {description && <p className="mt-4 line-clamp-3 text-white/85">{description}</p>}
        <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-900">
          {t("common.readMore")} <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}

export default function NewsEvents() {
  const { newsEvents, isLoading } = useNewsEvents();
  const { t, num } = useLang();
  const banner = useSiteImage("news_banner");
  const [tab, setTab] = useState("all");

  const sorted = useMemo(() => {
    const rank = { now: 0, upcoming: 1, unknown: 2, past: 3 };
    return [...newsEvents].sort((a, b) => {
      const sa = eventStatus(a);
      const sb = eventStatus(b);
      if (rank[sa] !== rank[sb]) return rank[sa] - rank[sb];
      const ra = eventRange(a);
      const rb = eventRange(b);
      return (ra?.start || 0) - (rb?.start || 0);
    });
  }, [newsEvents]);

  const filtered = tab === "all" ? sorted : sorted.filter((e) => eventStatus(e) === tab);
  const [featured, ...rest] = filtered;
  const counts = {
    all: sorted.length,
    now: sorted.filter((e) => eventStatus(e) === "now").length,
    upcoming: sorted.filter((e) => eventStatus(e) === "upcoming").length,
  };

  return (
    <>
      <PageHero
        image={banner.src}
        eyebrow={t("news.eyebrow")}
        title={t("news.title")}
        subtitle={t("news.subtitle")}
      />

      <Container className="py-10">
        <div className="mb-8 flex flex-wrap gap-2" role="tablist">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              type="button"
              role="tab"
              aria-selected={tab === tb.key}
              onClick={() => setTab(tb.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition duration-200 active:scale-95 ${
                tab === tb.key
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "bg-white text-gray-700 ring-1 ring-gray-900/10 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:ring-white/10"
              }`}
            >
              {t(tb.label)}
              <span className="ml-1.5 opacity-60">{num(counts[tb.key])}</span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <PlaceCardSkeleton key={i} />
            ))}
          </div>
        ) : !featured ? (
          <EmptyState icon={CalendarX2} title={tab === "now" ? t("news.emptyNow") : t("news.empty")}>
            {tab === "all" ? t("news.emptyAll") : t("news.emptyOther")}
          </EmptyState>
        ) : (
          <>
            <div key={tab} className="animate-zoom-in">
              <FeaturedEvent item={featured} />
            </div>
            {rest.length > 0 && (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((e, i) => (
                  <div key={e.id} {...reveal(i % 3, 90)}>
                    <EventCard item={e} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Container>
    </>
  );
}
