import { Link, useNavigate } from "react-router-dom";
import { Heart, MapPin, Star, Clock, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTripContext } from "../context/TripContext";
import { useLang } from "../i18n";

// Photo shapes used across the site. Upload guide: Admin > Media Library.
//   photo  4:3  cards, thumbnails, gallery tiles, story images      upload 1600x1200 (min 1200x900)
//   banner 16:9 page banners, event headers, big gallery photo      upload 1920x1080 (min 1600x900)
//   square 1:1  profile and team photos                            upload 600x600 (min 400x400)
export const RATIO = {
  photo: "aspect-[4/3]",
  banner: "aspect-[16/9]",
  square: "aspect-square",
};

export function Container({ className = "", children }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

export function SectionHeading({ eyebrow, title, subtitle, action, center = false }) {
  return (
    <div
      className={`mb-8 flex flex-col gap-4 ${
        center ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between"
      }`}
    >
      <div className={center ? "max-w-2xl" : "max-w-2xl"}>
        {eyebrow && (
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 text-base text-gray-600 dark:text-gray-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ViewAllLink({ to, children }) {
  const { t } = useLang();
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
    >
      {children ?? t("common.viewAll")}
      <ArrowRight size={16} />
    </Link>
  );
}

export function Stars({ value = 0, size = 14, className = "" }) {
  const { t } = useLang();
  const rounded = Math.round((Number(value) || 0) * 2) / 2;
  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label={t("common.outOf5", { value: Math.round((Number(value) || 0) * 10) / 10 })}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i + 1 <= rounded
              ? "fill-amber-400 text-amber-400"
              : i + 0.5 === rounded
              ? "fill-amber-400/50 text-amber-400"
              : "text-gray-300 dark:text-gray-600"
          }
        />
      ))}
    </span>
  );
}

export function RatingPill({ rating, count }) {
  const { t, num } = useLang();
  const hasRating = Number(rating) > 0;
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Star size={15} className={hasRating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"} />
      <span className="font-semibold text-gray-900 dark:text-white">{hasRating ? num(Number(rating).toFixed(1)) : t("common.new")}</span>
      {count > 0 && <span className="text-gray-500 dark:text-gray-400">({num(count)})</span>}
    </span>
  );
}

export function FavoriteButton({ trip, className = "" }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useTripContext();
  const { t } = useLang();
  const liked = isFavorite(trip.id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) return navigate("/login");
        toggleFavorite(trip);
      }}
      aria-label={liked ? t("place.unsave") : t("place.save")}
      title={liked ? t("common.saved") : t("common.save")}
      className={`grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white dark:bg-gray-900/80 ${className}`}
    >
      <Heart size={18} className={liked ? "fill-rose-500 text-rose-500" : "text-gray-700 dark:text-gray-200"} />
    </button>
  );
}

// Photo-first card for a destination. `trip` is the shape from useDestinations().
export function PlaceCard({ trip, rank, onProvinceClick }) {
  const { t, pick, tv, num } = useLang();
  const name = pick(trip, "name");
  const description = pick(trip, "description");
  return (
    <Link
      to={`/trip/${trip.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-gray-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-lift dark:bg-gray-900 dark:ring-white/10"
    >
      <div className={`relative ${RATIO.photo} overflow-hidden bg-gray-100 dark:bg-gray-800`}>
        <img
          src={trip.image}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0" />
        {rank && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-gray-900 shadow">
            #{num(rank)}
          </span>
        )}
        <FavoriteButton trip={trip} className="absolute right-3 top-3" />
        {trip.province && (
          <span
            role={onProvinceClick ? "button" : undefined}
            aria-label={onProvinceClick ? t("place.showIn", { province: tv(trip.province) }) : undefined}
            onClick={
              onProvinceClick
                ? (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onProvinceClick(trip.province);
                  }
                : undefined
            }
            className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-800 backdrop-blur dark:bg-gray-900/80 dark:text-gray-100"
          >
            <MapPin size={12} />
            {tv(trip.province)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-snug text-gray-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
            {name}
          </h3>
          <RatingPill rating={trip.rating} count={trip.reviews} />
        </div>
        {description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3 text-xs text-gray-600 dark:text-gray-400">
          {trip.duration && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800">
              <Clock size={12} />
              {tv(trip.duration)}
            </span>
          )}
          {trip.bestTime && (
            <span className="rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800">{t("place.best", { value: tv(trip.bestTime) })}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function PlaceCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10">
      <div className={`${RATIO.photo} animate-pulse bg-gray-200 dark:bg-gray-800`} />
      <div className="space-y-2 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>
  );
}

// Photo banner at the top of inner pages.
export function PageHero({ image, eyebrow, title, subtitle, children, tall = false }) {
  return (
    <section className="relative isolate overflow-hidden bg-gray-900">
      {image && <img src={image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60" />}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-gray-900/40 via-gray-900/50 to-gray-900/80" />
      <Container className={tall ? "py-24 sm:py-32" : "py-16 sm:py-20"}>
        <div className="max-w-3xl">
          {eyebrow && <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-200">{eyebrow}</p>}
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-4 text-lg text-gray-200">{subtitle}</p>}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </Container>
    </section>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-900">
      {Icon && (
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
          <Icon size={22} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {children && <p className="mx-auto mt-1 max-w-md text-sm text-gray-600 dark:text-gray-400">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export const buttonClass = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-60",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-900/10 transition hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:ring-white/10 dark:hover:bg-gray-700",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800",
};

export const inputClass =
  "w-full rounded-xl border-0 bg-white px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 dark:bg-gray-900 dark:text-white dark:ring-gray-700";
