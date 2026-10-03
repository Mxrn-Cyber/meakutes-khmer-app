import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  MapPin,
  Heart,
  Share2,
  Clock,
  Ticket,
  Accessibility,
  CalendarRange,
  Navigation,
  Images,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps, embedUrl } from "../utils/googleMaps";
import { useDestination, useDestinations } from "../hooks/useDestinations";
import { useTripContext } from "../context/TripContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Container, PlaceCard, Stars, RatingPill, buttonClass } from "../components/ui";
import { useLang } from "../i18n";

const mapOptions = { zoomControl: true, mapTypeControl: false, streetViewControl: false, fullscreenControl: true };

function Gallery({ images, name, onOpen }) {
  const { t } = useLang();
  const shown = images.slice(0, 5);
  if (shown.length <= 1) {
    return (
      <button type="button" onClick={() => onOpen(0)} className="block w-full overflow-hidden rounded-3xl">
        <img src={shown[0]} alt={name} className="aspect-[16/9] w-full object-cover" />
      </button>
    );
  }
  return (
    <div className="relative">
      {/* Phone: one photo with a counter */}
      <button type="button" onClick={() => onOpen(0)} className="block w-full overflow-hidden rounded-2xl md:hidden">
        <img src={shown[0]} alt={name} className="aspect-[4/3] w-full object-cover" />
      </button>
      {/* Tablet and up: mosaic */}
      <div className="hidden h-[460px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl md:grid">
        {shown.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => onOpen(i)}
            className={`group relative overflow-hidden bg-gray-100 dark:bg-gray-800 ${
              i === 0 || shown.length === 2
                ? "col-span-2 row-span-2"
                : shown.length === 3 || (shown.length === 4 && i === 3)
                ? "col-span-2"
                : ""
            }`}
          >
            <img src={src} alt={i === 0 ? name : ""} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onOpen(0)}
        className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-gray-900 shadow-lift hover:bg-white"
      >
        <Images size={16} /> {t("common.photos", { count: images.length })}
      </button>
    </div>
  );
}

function Lightbox({ images, index, onClose, onIndex }) {
  const { t, num } = useLang();
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, images.length, onClose, onIndex]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/95" role="dialog" aria-modal="true">
      <div className="flex items-center justify-between p-4 text-white">
        <span className="text-sm">
          {num(index + 1)} / {num(images.length)}
        </span>
        <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label={t("trip.photosClose")}>
          <X size={24} />
        </button>
      </div>
      <div className="relative flex flex-1 items-center justify-center px-4 pb-6">
        <img src={images[index]} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => onIndex((index - 1 + images.length) % images.length)}
              className="absolute left-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              aria-label={t("trip.prevPhoto")}
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={() => onIndex((index + 1) % images.length)}
              className="absolute right-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              aria-label={t("trip.nextPhoto")}
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-white p-3.5 ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10 sm:flex-row sm:items-start sm:gap-3 sm:p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function ReviewsSection({ destinationId }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t, te, num, formatDate } = useLang();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const load = () =>
    api
      .listReviews(destinationId)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationId]);

  const mine = user ? reviews.find((r) => r.user_id === user.id) : null;
  useEffect(() => {
    if (mine) {
      setRating(mine.rating);
      setComment(mine.comment || "");
    }
  }, [mine?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const summary = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach((r) => (counts[r.rating - 1] += 1));
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    return { counts, avg };
  }, [reviews]);

  const submit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return navigate("/login");
    setSubmitting(true);
    setMessage("");
    try {
      await api.createReview({ destination_id: destinationId, rating, comment });
      await load();
      setMessage(mine ? t("trip.updated") : t("trip.posted"));
    } catch (err) {
      setMessage(te(err, "trip.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reviews" className="scroll-mt-24">
      <h2 className="text-xl font-bold sm:text-2xl">{t("trip.reviews")}</h2>
      <div className="mt-5 grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10">
          <p className="text-4xl font-extrabold">{summary.avg ? num(summary.avg.toFixed(1)) : "–"}</p>
          <Stars value={summary.avg} size={16} className="mt-1" />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("common.reviews", { count: reviews.length })}
          </p>
          <div className="mt-4 space-y-1.5">
            {[5, 4, 3, 2, 1].map((n) => {
              const c = summary.counts[n - 1];
              const pct = reviews.length ? (c / reviews.length) * 100 : 0;
              return (
                <div key={n} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span className="w-2">{num(n)}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-4 text-right">{num(c)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={submit} className="rounded-2xl bg-white p-5 ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10">
          <p className="font-semibold">{mine ? t("trip.updateYours") : t("trip.shareExperience")}</p>
          <div className="mt-3 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                aria-label={t("trip.stars", { count: n })}
                className="p-0.5"
              >
                <Star size={28} className={(hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={2000}
            disabled={!isAuthenticated}
            placeholder={isAuthenticated ? t("trip.reviewPlaceholder") : t("trip.loginToWrite")}
            className="mt-3 w-full rounded-xl border-0 bg-gray-50 p-3 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-600 disabled:opacity-60 dark:bg-gray-800 dark:text-white dark:ring-gray-700"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={submitting} className={buttonClass.primary}>
              {!isAuthenticated ? t("trip.loginToReview") : submitting ? t("common.saving") : mine ? t("trip.update") : t("trip.post")}
            </button>
            {message && (
              <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <Check size={16} className="text-emerald-500" /> {message}
              </span>
            )}
          </div>
        </form>
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-gray-500">{t("trip.loadingReviews")}</p>
        ) : reviews.length === 0 ? (
          <p className="rounded-2xl bg-white p-5 text-sm text-gray-500 ring-1 ring-gray-900/5 dark:bg-gray-900 dark:text-gray-400 dark:ring-white/10">
            {t("trip.noReviews")}
          </p>
        ) : (
          reviews.map((r) => (
            <article key={r.id} className="rounded-2xl bg-white p-5 ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                  {(r.user_display_name || "T").charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">
                    {r.user_display_name || t("common.traveller")}
                    {user && r.user_id === user.id && <span className="ml-2 text-xs font-medium text-brand-600">{t("common.you")}</span>}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Stars value={r.rating} size={12} />
                    <span>{formatDate(r.created_at, { year: "numeric", month: "short", day: "numeric" })}</span>
                  </div>
                </div>
              </div>
              {r.comment && <p className="mt-3 whitespace-pre-line text-gray-700 dark:text-gray-300">{r.comment}</p>}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function LocationCard({ trip }) {
  const { usable, error } = useGoogleMaps();
  const { t, pick, tv } = useLang();
  const name = pick(trip, "name");
  const hasPoint = trip.latitude != null && trip.longitude != null;
  const center = hasPoint ? { lat: trip.latitude, lng: trip.longitude } : { lat: 12.5657, lng: 104.991 };
  const directions = hasPoint
    ? `https://www.google.com/maps/dir/?api=1&destination=${trip.latitude},${trip.longitude}`
    : `https://www.google.com/maps/search/${encodeURIComponent(`${trip.name}, ${trip.province || ""}, Cambodia`)}`;

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10">
      <div className="h-64 bg-gray-100 dark:bg-gray-800">
        {usable ? (
          <GoogleMap mapContainerStyle={{ width: "100%", height: "100%" }} center={center} zoom={hasPoint ? 14 : 7} options={mapOptions}>
            {hasPoint && <Marker position={center} title={name} />}
          </GoogleMap>
        ) : error ? (
          // The interactive map is unavailable, so fall back to Google's key-free embed.
          <iframe
            title={t("trip.mapOf", { name })}
            src={embedUrl(hasPoint ? { lat: trip.latitude, lng: trip.longitude } : { query: `${trip.name}, ${trip.province || ""}, Cambodia`, zoom: 10 })}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <MapPin className="mx-auto mb-2 text-brand-600" />
              {t("trip.loadingMap")}
            </div>
          </div>
        )}
      </div>
      <div className="p-5">
        <p className="flex items-center gap-2 font-semibold">
          <MapPin size={18} className="text-brand-600" />{" "}
          {trip.province ? t("common.inPlace", { place: tv(trip.province) }) : t("common.cambodia")}
        </p>
        {hasPoint && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {trip.latitude.toFixed(4)}, {trip.longitude.toFixed(4)}
          </p>
        )}
        <a href={directions} target="_blank" rel="noreferrer" className={`${buttonClass.primary} mt-4 w-full`}>
          <Navigation size={16} /> {t("trip.directions")}
        </a>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <Container className="py-8">
      <div className="h-8 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      <div className="mt-6 h-[360px] animate-pulse rounded-3xl bg-gray-200 dark:bg-gray-800" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
    </Container>
  );
}

export default function TripDetail() {
  const { id } = useParams();
  const { destination: trip, isLoading } = useDestination(id);
  const { destinations: allTrips } = useDestinations({ status: "published" });
  const { isFavorite, toggleFavorite } = useTripContext();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t, pick, tv } = useLang();
  const [lightbox, setLightbox] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setExpanded(false);
  }, [id]);

  const nearby = useMemo(() => {
    if (!trip) return [];
    const others = allTrips.filter((t) => t.id !== trip.id);
    const same = others.filter((t) => t.province === trip.province);
    const rest = others.filter((t) => t.province !== trip.province).sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return [...same, ...rest].slice(0, 4);
  }, [allTrips, trip]);

  if (isLoading) return <DetailSkeleton />;

  if (!trip) {
    return (
      <Container className="py-24 text-center">
        <h1 className="text-2xl font-bold">{t("trip.notFound")}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{t("trip.notFoundText")}</p>
        <Link to="/discover" className={`${buttonClass.primary} mt-6`}>
          <ArrowLeft size={16} /> {t("trip.back")}
        </Link>
      </Container>
    );
  }

  const images = trip.images?.length ? trip.images : [trip.image];
  const liked = isFavorite(trip.id);
  const name = pick(trip, "name");
  const description = pick(trip, "description") || "";
  const article = pick(trip, "article");
  const provinceLabel = tv(trip.province);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <>
      <Container className="pt-6 sm:pt-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400" aria-label={t("trip.breadcrumb")}>
          <Link to="/discover" className="hover:text-gray-900 dark:hover:text-white">
            {t("nav.discover")}
          </Link>
          {trip.province && (
            <>
              <span>/</span>
              <Link to={`/discover?province=${encodeURIComponent(trip.province)}`} className="hover:text-gray-900 dark:hover:text-white">
                {provinceLabel}
              </Link>
            </>
          )}
        </nav>

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
              <a href="#reviews" className="hover:underline">
                <RatingPill rating={trip.rating} count={trip.reviews} />
              </a>
              {trip.province && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={15} /> {t("common.inPlace", { place: provinceLabel })}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={share} className={buttonClass.secondary}>
              {copied ? <Check size={16} /> : <Share2 size={16} />} {copied ? t("common.linkCopied") : t("common.share")}
            </button>
            <button
              type="button"
              onClick={() => (isAuthenticated ? toggleFavorite(trip) : navigate("/login"))}
              className={liked ? `${buttonClass.secondary} !text-rose-600` : buttonClass.secondary}
            >
              <Heart size={16} className={liked ? "fill-rose-500 text-rose-500" : ""} /> {liked ? t("common.saved") : t("common.save")}
            </button>
          </div>
        </div>

        <div className="mt-6">
          <Gallery images={images} name={name} onOpen={setLightbox} />
        </div>
      </Container>

      <Container className="py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-10">
            <div className="grid grid-cols-2 gap-3">
              <InfoTile icon={Clock} label={t("trip.timeNeeded")} value={tv(trip.duration)} />
              <InfoTile icon={CalendarRange} label={t("trip.bestTime")} value={tv(trip.bestTime)} />
              <InfoTile icon={Ticket} label={t("trip.access")} value={tv(trip.access)} />
              <InfoTile icon={Accessibility} label={t("trip.difficulty")} value={tv(trip.accessibility)} />
            </div>

            <section>
              <h2 className="text-xl font-bold sm:text-2xl">{t("trip.about")}</h2>
              <p
                className={`mt-3 whitespace-pre-line text-[17px] leading-relaxed text-gray-700 dark:text-gray-300 ${
                  expanded ? "" : "line-clamp-6"
                }`}
              >
                {description || t("trip.noDescription")}
              </p>
              {description.length > 400 && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-2 font-semibold text-brand-600 hover:underline dark:text-brand-400"
                >
                  {expanded ? t("common.showLess") : t("common.readMore")}
                </button>
              )}
              {article && (
                <div className="mt-6 whitespace-pre-line leading-relaxed text-gray-700 dark:text-gray-300">{article}</div>
              )}
            </section>

            <div className="lg:hidden">
              <LocationCard trip={trip} />
            </div>

            <ReviewsSection destinationId={trip.id} />
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <LocationCard trip={trip} />
            </div>
          </aside>
        </div>
      </Container>

      {nearby.length > 0 && (
        <section className="border-t border-brand-100 bg-brand-50/60 py-14 dark:border-gray-800 dark:bg-gray-900/40">
          <Container>
            <h2 className="mb-6 text-xl font-bold sm:text-2xl">
              {nearby.some((p) => p.province === trip.province) ? t("trip.moreIn", { province: provinceLabel }) : t("trip.alsoLike")}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {nearby.map((t) => (
                <PlaceCard key={t.id} trip={t} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {lightbox !== null && (
        <Lightbox images={images} index={lightbox} onIndex={setLightbox} onClose={() => setLightbox(null)} />
      )}
    </>
  );
}
