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

const STORY = {
  en: [
    <>
      <strong className="text-gray-900 dark:text-white">Meakutes-Khmer</strong> was developed as a final-year capstone
      project by a Year 4 student at the <strong>Royal University of Phnom Penh (RUPP)</strong>, majoring in{" "}
      <strong>Information Technology Engineering (ITE)</strong>, under the guidance of <strong>Doctor Ky Soklay</strong>.
    </>,
    <>
      The platform has two goals: to apply the technical skills learned over four years of study, and to help promote
      and revitalise Cambodia's tourism industry, which was heavily affected by global events in recent years.
    </>,
    <>
      It reflects a passion for technology, innovation and national pride. By making tourism information easier to find
      and more engaging, we hope to inspire both local and international travellers to discover more of the Kingdom of
      Wonder.
    </>,
    <>
      Special thanks to <strong>Doctor Ky Soklay</strong> for his advice, mentorship and continuous support, which
      shaped the vision and execution of Meakutes-Khmer.
    </>,
  ],
  km: [
    <>
      <strong className="text-gray-900 dark:text-white">Meakutes-Khmer</strong> ត្រូវបានបង្កើតឡើងជាគម្រោងបញ្ចប់ការសិក្សា
      ដោយនិស្សិតឆ្នាំទី៤ នៃ<strong>សាកលវិទ្យាល័យភូមិន្ទភ្នំពេញ (RUPP)</strong> ឯកទេស
      <strong>វិស្វកម្មព័ត៌មានវិទ្យា (ITE)</strong> ក្រោមការណែនាំរបស់ <strong>បណ្ឌិត Ky Soklay</strong>។
    </>,
    <>
      វេទិកានេះមានគោលដៅពីរ៖ អនុវត្តជំនាញបច្ចេកទេសដែលបានរៀនក្នុងរយៈពេលបួនឆ្នាំ និងជួយផ្សព្វផ្សាយ
      និងស្តារវិស័យទេសចរណ៍កម្ពុជាឡើងវិញ ដែលរងផលប៉ះពាល់យ៉ាងខ្លាំងពីព្រឹត្តិការណ៍សកលក្នុងប៉ុន្មានឆ្នាំចុងក្រោយនេះ។
    </>,
    <>
      គម្រោងនេះឆ្លុះបញ្ចាំងពីចំណង់ចំណូលចិត្តលើបច្ចេកវិទ្យា ការច្នៃប្រឌិត និងមោទនភាពជាតិ។
      តាមរយៈការធ្វើឱ្យព័ត៌មានទេសចរណ៍ងាយស្វែងរក និងគួរឱ្យចាប់អារម្មណ៍ជាងមុន យើងសង្ឃឹមថានឹងជំរុញទឹកចិត្តទេសចរ
      ទាំងក្នុងស្រុក និងអន្តរជាតិ ឱ្យមកស្វែងយល់បន្ថែមអំពីព្រះរាជាណាចក្រកម្ពុជា។
    </>,
    <>
      សូមថ្លែងអំណរគុណយ៉ាងជ្រាលជ្រៅចំពោះ <strong>បណ្ឌិត Ky Soklay</strong> សម្រាប់ដំបូន្មាន ការណែនាំ
      និងការគាំទ្រជាប្រចាំ ដែលបានជួយកសាងចក្ខុវិស័យ និងការអនុវត្តគម្រោង Meakutes-Khmer។
    </>,
  ],
};

const STEPS = [
  {
    Icon: Search,
    title: "Find a place",
    text: "Search by name or province, or browse the most popular places.",
    to: "/discover",
    cta: "Discover places",
  },
  {
    Icon: Heart,
    title: "Save and visit",
    text: "Look at photos and the map, then tap the heart to keep it for your trip.",
    to: "/popular",
    cta: "See popular places",
  },
  {
    Icon: Star,
    title: "Rate and review",
    text: "Share your rating and tips to help the next traveller choose.",
    to: "/signup",
    cta: "Create a free account",
  },
];

const OFFERS = [
  { Icon: MapPinned, title: "Destination guides", text: "Places across the provinces of Cambodia, with maps and practical tips." },
  { Icon: MessageSquareHeart, title: "Real experiences", text: "Stories, reviews and comments shared by travellers." },
  { Icon: Star, title: "Ratings", text: "Recommendations to help you choose your next adventure." },
  { Icon: Camera, title: "Photos", text: "See each place before you go." },
  { Icon: Search, title: "Search and filters", text: "Find places by name, province or popularity." },
  { Icon: Heart, title: "Favourites", text: "Save the places you love and find them again in your profile." },
];

const TEAM = [
  {
    name: "Ky Soklay",
    role: "Project advisor",
    title: "Doctor, Royal University of Phnom Penh",
    bio: "Guided the vision of Meakutes-Khmer and mentored the project from idea to launch.",
    photo: "/avatar.png",
    links: [],
  },
  {
    name: "Lao Thomorn",
    role: "Designer and developer",
    title: "ITE, Royal University of Phnom Penh",
    bio: "Designed and built the website, from the user interface to the database and hosting.",
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
  { key: "places", label: "Places to visit" },
  { key: "provinces", label: "Provinces" },
  { key: "reviews", label: "Traveller reviews" },
  { key: "members", label: "Members" },
];

const fmt = new Intl.NumberFormat("en-US");

function startsInKhmer() {
  if (typeof document === "undefined") return false;
  return /googtrans=\/[a-z-]+\/km/.test(document.cookie) || document.documentElement.lang?.startsWith("km");
}

export default function About() {
  const [stats, setStats] = useState(null);
  const [statsFailed, setStatsFailed] = useState(false);
  const [lang, setLang] = useState(startsInKhmer() ? "km" : "en");

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
        eyebrow="About us"
        title="Bringing Cambodia's beauty closer to every traveller"
        subtitle="Meakutes-Khmer is a tourism website built to promote and revitalise Cambodia's tourism industry."
        tall
      />

      {/* Live numbers */}
      {!statsFailed && (
        <Container className="relative z-10 -mt-12">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-gray-900/5 shadow-lift ring-1 ring-gray-900/5 dark:bg-white/10 dark:ring-white/10 lg:grid-cols-4">
            {STAT_ITEMS.map(({ key, label }) => (
              <div key={key} className="bg-white px-6 py-6 text-center dark:bg-gray-900 sm:py-8">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="mt-1 text-3xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400 sm:text-4xl">
                  {stats ? fmt.format(stats[key] ?? 0) : <span className="mx-auto block h-9 w-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />}
                </dd>
              </div>
            ))}
          </dl>
          {stats?.average_rating > 0 && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <Star size={15} className="fill-amber-400 text-amber-400" />
              Travellers rate places <strong className="text-gray-800 dark:text-gray-200">{stats.average_rating.toFixed(1)}</strong> out of 5 on average
            </p>
          )}
        </Container>
      )}

      {/* Our story */}
      <Container className="py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              <GraduationCap size={16} /> Final-year capstone project, RUPP
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                {lang === "km" ? <span className="notranslate font-khmer" translate="no">រឿងរ៉ាវរបស់យើង</span> : "Our story"}
              </h2>
              <div
                role="tablist"
                aria-label="Story language"
                className="notranslate inline-flex rounded-full bg-gray-100 p-1 text-sm font-semibold dark:bg-gray-800"
                translate="no"
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
                    className={`rounded-full px-4 py-1.5 transition ${code === "km" ? "font-khmer" : ""} ${
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
            <div
              key={lang}
              lang={lang}
              translate={lang === "km" ? "no" : undefined}
              className={`mt-6 animate-fade-in space-y-5 text-gray-700 dark:text-gray-300 ${
                lang === "km" ? "notranslate font-khmer text-[17px] leading-loose" : "text-[17px] leading-relaxed"
              }`}
            >
              {STORY[lang].map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
          <img
            src="/Trip-Image/about-team.png"
            alt="The Meakutes-Khmer team"
            loading="lazy"
            className="aspect-[4/5] w-full rounded-3xl object-cover shadow-lift"
          />
        </div>
      </Container>

      {/* How it works */}
      <section className="bg-brand-50/60 py-16 dark:bg-gray-900/40 sm:py-20">
        <Container>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">How it works</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Plan your trip in three steps</h2>
          </div>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map(({ Icon, title, text, to, cta }, i) => (
              <li key={title} className="relative flex flex-col rounded-3xl bg-white p-6 shadow-card ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white">
                    <Icon size={22} />
                  </span>
                  <span className="text-sm font-bold text-brand-600 dark:text-brand-400">Step {i + 1}</span>
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
            ))}
          </ol>
        </Container>
      </section>

      {/* What you'll find */}
      <Container className="py-16 sm:py-20">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">What you'll find here</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {OFFERS.map(({ Icon, title, text }) => (
            <div key={title} className="flex gap-4 rounded-2xl p-5 ring-1 ring-gray-900/5 transition hover:shadow-card dark:ring-white/10">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                <Icon size={22} />
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* Team */}
      <section className="border-t border-brand-100 bg-brand-50/60 py-16 dark:border-gray-800 dark:bg-gray-900/40 sm:py-20">
        <Container>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Our team</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">The people behind Meakutes-Khmer.</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:max-w-4xl">
            {TEAM.map((m) => (
              <article key={m.name} className="flex gap-5 rounded-3xl bg-white p-6 shadow-card ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10">
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
                          aria-label={`${m.name} on ${label}`}
                          className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-brand-600 hover:text-white dark:bg-gray-800 dark:text-gray-300"
                        >
                          <Icon size={15} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* Call to action */}
      <Container className="py-16 sm:py-20">
        <div className="flex flex-col items-center gap-5 rounded-3xl bg-gradient-to-r from-brand-600 via-brand-500 to-amber-400 px-6 py-12 text-center text-white">
          <h2 className="text-2xl font-bold sm:text-3xl">Thank you for visiting. Let's explore Cambodia together.</h2>
          <p className="notranslate font-khmer text-white/90" translate="no">
            សូមអរគុណ! តោះទៅស្វែងយល់ពីកម្ពុជាជាមួយគ្នា
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/discover" className={`${buttonClass.secondary} !text-gray-900`}>
              Start exploring
            </Link>
            <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/60 transition hover:bg-white/10">
              Join for free
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
