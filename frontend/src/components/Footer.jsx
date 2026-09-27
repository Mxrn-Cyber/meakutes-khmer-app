import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Figma, Facebook, Linkedin, Music2 } from "lucide-react";

const EXPLORE = [
  { to: "/discover", label: "Discover places" },
  { to: "/popular", label: "Popular places" },
  { to: "/news", label: "News & Events" },
  { to: "/about", label: "About the project" },
];

const ACCOUNT = [
  { to: "/signup", label: "Create an account" },
  { to: "/login", label: "Log in" },
  { to: "/profile", label: "My profile" },
  { to: "/terms", label: "Terms of use" },
  { to: "/privacy", label: "Privacy policy" },
];

const SOCIAL = [
  { Icon: Facebook, href: "https://web.facebook.com/morn.scripter", label: "Facebook" },
  { Icon: Music2, href: "https://www.tiktok.com/@cybermorn", label: "TikTok" },
  { Icon: Linkedin, href: "https://www.linkedin.com/in/lao-thomorn-347a4b28b/", label: "LinkedIn" },
  { Icon: Figma, href: "https://www.figma.com/@cybermorn", label: "Figma" },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-brand-100 bg-brand-50/40 dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] lg:px-8">
        <div>
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="" className="h-10 w-10 rounded-xl object-contain" />
            <span className="text-lg font-extrabold tracking-tight">
              Meakutes<span className="text-brand-600">-Khmer</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            Discover temples, beaches, mountains and festivals across Cambodia, and share your own
            experience with other travellers.
          </p>
          <p className="mt-2 font-khmer text-sm text-gray-500 dark:text-gray-500">ស្វែងរកភាពស្រស់ស្អាតនៃព្រះរាជាណាចក្រកម្ពុជា</p>
          <div className="mt-5 flex gap-2">
            {SOCIAL.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-brand-600 hover:text-white dark:bg-gray-800 dark:text-gray-300"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <FooterList title="Explore" items={EXPLORE} />
        <FooterList title="Account" items={ACCOUNT} />

        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex gap-3">
              <MapPin size={16} className="mt-0.5 shrink-0 text-brand-600" />
              <span>
                #219A, Second Floor, Building A, Russian Federation Blvd, Teuk Laak 1, Toul Kork,
                Phnom Penh, Cambodia
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={16} className="shrink-0 text-brand-600" />
              <a href="tel:+855966960144" className="hover:text-gray-900 dark:hover:text-white">
                +855 96 696 0144
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={16} className="shrink-0 text-brand-600" />
              <a href="mailto:laothomorn@gmail.com" className="hover:text-gray-900 dark:hover:text-white">
                laothomorn@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-gray-500 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Meakutes-Khmer. All rights reserved.</p>
          <p>
            Designed by{" "}
            <a href="https://github.com/Mxrn-Cyber" target="_blank" rel="noreferrer" className="font-medium text-gray-700 hover:text-brand-600 dark:text-gray-300">
              Lao Thomorn
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterList({ title, items }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h4>
      <ul className="mt-4 space-y-2.5 text-sm">
        {items.map((i) => (
          <li key={i.to}>
            <Link to={i.to} className="text-gray-600 transition hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
