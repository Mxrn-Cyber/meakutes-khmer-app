import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, MapPin, Clock, Accessibility, CalendarPlus, Download, Share2, Check } from "lucide-react";
import { useNewsEvents } from "../hooks/useNewsEvents";
import CommentsPanel from "../components/CommentsPanel";
import { Container, buttonClass } from "../components/ui";
import { eventStatus, daysUntil, googleCalendarUrl, downloadIcs, dateBadge } from "../utils/eventDates";

function Fact({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
        <Icon size={19} />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

export default function Article() {
  const { id } = useParams();
  const { newsEvents, isLoading } = useNewsEvents();
  const [copied, setCopied] = useState(false);
  const item = useMemo(() => newsEvents.find((e) => String(e.id) === String(id)), [newsEvents, id]);
  const related = useMemo(() => newsEvents.filter((e) => String(e.id) !== String(id)).slice(0, 3), [newsEvents, id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (isLoading) {
    return (
      <Container className="py-10">
        <div className="h-[360px] animate-pulse rounded-3xl bg-gray-200 dark:bg-gray-800" />
        <div className="mt-8 h-8 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </Container>
    );
  }

  if (!item) {
    return (
      <Container className="py-24 text-center">
        <h1 className="text-2xl font-bold">Event not found</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">It may have been removed, or the link is wrong.</p>
        <Link to="/news" className={`${buttonClass.primary} mt-6`}>
          <ArrowLeft size={16} /> All events
        </Link>
      </Container>
    );
  }

  const status = eventStatus(item);
  const days = daysUntil(item);
  const badge = dateBadge(item);
  const gcal = googleCalendarUrl(item);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: item.title, url });
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
      <section className="relative isolate overflow-hidden bg-gray-900">
        {item.pic && <img src={item.pic} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-gray-950 via-gray-950/50 to-gray-950/20" />
        <Container className="flex min-h-[380px] flex-col justify-end pb-10 pt-24 sm:min-h-[460px]">
          <Link to="/news" className="mb-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur hover:bg-white/25">
            <ArrowLeft size={16} /> All events
          </Link>
          <div className="mt-10 flex items-end gap-4">
            {badge && (
              <div className="hidden w-16 shrink-0 rounded-2xl bg-white py-2 text-center shadow-lift sm:block">
                <p className="text-xs font-bold tracking-wide text-rose-600">{badge.month}</p>
                <p className="text-2xl font-extrabold leading-none text-gray-900">{badge.day}</p>
              </div>
            )}
            <div>
              {status === "now" ? (
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Happening now
                </span>
              ) : status === "upcoming" && days != null ? (
                <span className="mb-3 inline-block rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-900">
                  In {days} {days === 1 ? "day" : "days"}
                </span>
              ) : null}
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">{item.title}</h1>
              <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-white/85">
                {item.date && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={16} /> {item.date}
                  </span>
                )}
                {item.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={16} /> {item.location}
                  </span>
                )}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          <article>
            <h2 className="text-xl font-bold sm:text-2xl">About this event</h2>
            <p className="mt-3 whitespace-pre-line text-[17px] leading-relaxed text-gray-700 dark:text-gray-300">
              {item.description || "More details coming soon."}
            </p>
          </article>

          <aside className="space-y-4 lg:row-span-2">
            <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10 lg:sticky lg:top-24">
              <div className="space-y-4">
                <Fact icon={CalendarDays} label="Date" value={item.date} />
                <Fact icon={MapPin} label="Location" value={item.location} />
                <Fact icon={Clock} label="Best time" value={item.bestTime} />
                <Fact icon={Accessibility} label="Accessibility" value={item.accessibility} />
              </div>
              <div className="mt-6 space-y-2">
                {gcal && (
                  <a href={gcal} target="_blank" rel="noreferrer" className={`${buttonClass.primary} w-full`}>
                    <CalendarPlus size={16} /> Add to Google Calendar
                  </a>
                )}
                {gcal && (
                  <button type="button" onClick={() => downloadIcs(item)} className={`${buttonClass.secondary} w-full`}>
                    <Download size={16} /> Other calendar (.ics)
                  </button>
                )}
                <button type="button" onClick={share} className={`${buttonClass.ghost} w-full`}>
                  {copied ? <Check size={16} /> : <Share2 size={16} />} {copied ? "Link copied" : "Share this event"}
                </button>
              </div>
            </div>
          </aside>

          <div className="lg:col-start-1">
            <CommentsPanel newsEventId={item.id} />
          </div>
        </div>
      </Container>

      {related.length > 0 && (
        <section className="border-t border-gray-200 bg-white py-14 dark:border-gray-800 dark:bg-gray-900/40">
          <Container>
            <h2 className="mb-6 text-xl font-bold sm:text-2xl">Other events</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((e) => (
                <Link
                  key={e.id}
                  to={`/article/${e.id}`}
                  className="group overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-gray-900/5 transition hover:-translate-y-1 hover:shadow-lift dark:bg-gray-900 dark:ring-white/10"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {e.pic && <img src={e.pic} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                  </div>
                  <div className="p-5">
                    <p className="text-sm font-medium text-brand-600 dark:text-brand-400">{e.date}</p>
                    <h3 className="mt-1 font-bold group-hover:text-brand-600">{e.title}</h3>
                    {e.location && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <MapPin size={13} /> {e.location}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
