import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPinned,
  MessageSquareHeart,
  Star,
  Camera,
  Search,
  GraduationCap,
  Heart,
  ArrowRight,
  Facebook,
  Linkedin,
  Github,
  Music2,
  Mail,
} from "lucide-react";
import { api } from "../api/client";
import { Container, PageHero, buttonClass } from "../components/ui";
import { useLang, Rich } from "../i18n";

const STEPS = [
  { Icon: Search, to: "/discover" },
  { Icon: Heart, to: "/popular" },
  { Icon: Star, to: "/signup" },
];

const OFFER_ICONS = [MapPinned, MessageSquareHeart, Star, Camera, Search, Heart];

// Names, roles and bios are in about.team (en.js / km.js), in the same order.
const TEAM = [
  { photo: "/avatar.png", links: [] },
  {
    photo: "/avatar.png",
    links: [
      { Icon: Facebook, href: "https://web.facebook.com/morn.scripter", label: "Facebook" },
      { Icon: Music2, href: "https://www.tiktok.com/@cybermorn", label: "TikTok" },
      { Icon: Linkedin, href: "https://www.linkedin.com/in/lao-thomorn-347a4b28b/", label: "LinkedIn" },
      { Icon: Github, href: "https://github.com/Mxrn-Cyber", label: "GitHub" },
      { Icon: Mail, href: "mailto:laothomorn@gmail.com", label: "Email" },
    ],
  },
];

const STAT_ITEMS = [
  { key: "places", label: "about.statPlaces" },
  { key: "provinces", label: "about.statProvinces" },
  { key: "reviews", label: "about.statReviews" },
  { key: "members", label: "about.statMembers" },
];


export default function About() {
  const [stats, setStats] = useState(null);
  const [statsFailed, setStatsFailed] = useState(false);
  const { t, lang, setLang, num } = useLang();

  useEffect(() => {
    let alive = true;
    api
      .stats()
      .then((s) => alive && setStats(s))
      .catch(() => alive && setStatsFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <PageHero
        image="/Tumnail.png"
        eyebrow={t("about.eyebrow")}
        title={t("about.title")}
        subtitle={t("about.subtitle")}
        tall
      />

      {/* Live numbers */}
      {!statsFailed && (
        <Container className="relative z-10 -mt-12">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-gray-900/5 shadow-lift ring-1 ring-gray-900/5 dark:bg-white/10 dark:ring-white/10 lg:grid-cols-4">
            {STAT_ITEMS.map(({ key, label }) => (
              <div key={key} className="bg-white px-6 py-6 text-center dark:bg-gray-900 sm:py-8">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t(label)}</dt>
                <dd className="mt-1 text-3xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400 sm:text-4xl">
                  {stats ? num(stats[key] ?? 0) : <span className="mx-auto block h-9 w-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />}
                </dd>
              </div>
            ))}
          </dl>
          {stats?.average_rating > 0 && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <Star size={15} className="fill-amber-400 text-amber-400" />
              {t("about.avgA")}
              <strong className="text-gray-800 dark:text-gray-200">{num(stats.average_rating.toFixed(1))}</strong>
              {t("about.avgB")}
            </p>
          )}
        </Container>
      )}

      {/* Our story */}
      <Container className="py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              <GraduationCap size={16} /> {t("about.capstone")}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                {t("about.story")}
              </h2>
              <div
                role="tablist"
                aria-label={t("nav.changeLanguage")}
                className="inline-flex rounded-full bg-gray-100 p-1 text-sm font-semibold dark:bg-gray-800"
              >
                {[
                  ["en", "English"],
                  ["km", "ខ្មែរ"],
                ].map(([code, label]) => (
                  <button
                    key={code}
                    role="tab"
                    type="button"
                    aria-selected={lang === code}
                    onClick={() => setLang(code)}
                    lang={code}
                    className={`rounded-full px-4 py-1.5 transition ${
                      lang === code
                        ? "bg-white text-brand-700 shadow-sm dark:bg-gray-900 dark:text-brand-300"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div key={lang} className="mt-6 animate-fade-in space-y-5 text-[17px] leading-relaxed text-gray-700 dark:text-gray-300">
              {t("about.storyP").map((p, i) => (
                <p key={i}>
                  <Rich text={p} />
                </p>
              ))}
            </div>
          </div>
          <img
            src="/Trip-Image/about-team.png"
            alt={t("about.teamPhoto")}
            loading="lazy"
            className="aspect-[4/5] w-full rounded-3xl object-cover shadow-lift"
          />
        </div>
      </Container>

      {/* How it works */}
      <section className="bg-brand-50/60 py-16 dark:bg-gray-900/40 sm:py-20">
        <Container>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">{t("about.howEyebrow")}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{t("about.howTitle")}</h2>
          </div>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map(({ Icon, to }, i) => {
              const { title, text, cta } = t("about.steps")[i];
              return (
              <li key={to} className="relative flex flex-col rounded-3xl bg-white p-6 shadow-card ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white">
                    <Icon size={22} />
                  </span>
                  <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{t("about.step", { n: i + 1 })}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{text}</p>
                <Link
                  to={to}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:gap-2.5 hover:text-brand-700 dark:text-brand-400"
                >
                  {cta} <ArrowRight size={16} className="transition-all" />
                </Link>
              </li>
              );
            })}
          </ol>
        </Container>
      </section>

      {/* What you'll find */}
      <Container className="py-16 sm:py-20">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("about.findTitle")}</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t("about.offers").map(({ title, text }, i) => {
            const Icon = OFFER_ICONS[i];
            return (
            <div key={i} className="flex gap-4 rounded-2xl p-5 ring-1 ring-gray-900/5 transition hover:shadow-card dark:ring-white/10">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                <Icon size={22} />
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{text}</p>
              </div>
            </div>
            );
          })}
        </div>
      </Container>

      {/* Team */}
      <section className="border-t border-brand-100 bg-brand-50/60 py-16 dark:border-gray-800 dark:bg-gray-900/40 sm:py-20">
        <Container>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("about.teamTitle")}</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{t("about.teamSubtitle")}</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:max-w-4xl">
            {TEAM.map((person, i) => {
              const m = { ...person, ...t("about.team")[i] };
              return (
              <article key={i} className="flex gap-5 rounded-3xl bg-white p-6 shadow-card ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10">
                <img src={m.photo} alt={m.name} loading="lazy" className="h-24 w-24 shrink-0 rounded-2xl object-cover ring-4 ring-brand-50 dark:ring-gray-800" />
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{m.name}</h3>
                  <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">{m.role}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{m.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{m.bio}</p>
                  {m.links.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {m.links.map(({ Icon, href, label }) => (
                        <a
                          key={label}
                          href={href}
                          target={href.startsWith("mailto:") ? undefined : "_blank"}
                          rel="noreferrer"
                          aria-label={t("about.onSite", { name: m.name, site: label })}
                          className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-brand-600 hover:text-white dark:bg-gray-800 dark:text-gray-300"
                        >
                          <Icon size={15} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </article>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Call to action */}
      <Container className="py-16 sm:py-20">
        <div className="flex flex-col items-center gap-5 rounded-3xl bg-gradient-to-r from-brand-600 via-brand-500 to-amber-400 px-6 py-12 text-center text-white">
          <h2 className="text-2xl font-bold sm:text-3xl">{t("about.thanks")}</h2>
          <p lang={lang === "km" ? "en" : "km"} className="text-white/90">
            {t("about.thanksKhmer")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/discover" className={`${buttonClass.secondary} !text-gray-900`}>
              {t("about.start")}
            </Link>
            <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/60 transition hover:bg-white/10">
              {t("about.join")}
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
