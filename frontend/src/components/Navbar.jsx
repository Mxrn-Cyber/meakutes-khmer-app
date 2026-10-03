import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Moon,
  Sun,
  Heart,
  User,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import { useTripContext } from "../context/useTrip";
import { api } from "../api/client";
import { useLang } from "../i18n";
import LanguageMenu from "./LanguageMenu";

const NAV_LINKS = [
  { to: "/", key: "nav.home", end: true },
  { to: "/discover", key: "nav.discover" },
  { to: "/popular", key: "nav.popular" },
  { to: "/news", key: "nav.news" },
  { to: "/about", key: "nav.about" },
];

const favoriteImage = (trip) =>
  trip.images?.[0] ? api.mediaUrl(trip.images[0].url) : "/placeholder-image.jpg";

function readStoredTheme() {
  try {
    return localStorage.getItem("theme") === "dark";
  } catch {
    return false;
  }
}

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}

function Avatar({ user, size = 32 }) {
  if (user?.avatar_url) {
    return (
      <img
        src={api.mediaUrl(user.avatar_url)}
        alt=""
        style={{ width: size, height: size }}
        className="rounded-full object-cover ring-2 ring-white dark:ring-gray-900"
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size }}
      className="grid place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white"
    >
      {(user?.display_name || user?.email || "?").charAt(0).toUpperCase()}
    </span>
  );
}

const iconButton =
  "grid h-10 w-10 place-items-center rounded-full text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800";

export default function Navbar() {
  const { user, logout, isEditor } = useAuth();
  const { favorites, removeFromFavorites } = useTripContext();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t, pick, tv } = useLang();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [favOpen, setFavOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [dark, setDark] = useState(readStoredTheme);

  const favRef = useRef(null);
  const userRef = useRef(null);
  useClickOutside(favRef, () => setFavOpen(false));
  useClickOutside(userRef, () => setUserOpen(false));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      /* storage unavailable */
    }
  }, [dark]);

  useEffect(() => {
    setMobileOpen(false);
    setFavOpen(false);
    setUserOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);


  const handleLogout = async () => {
    // Leave protected pages first, so their own redirect doesn't drop the message.
    navigate("/login", { state: { message: t("nav.loggedOut") } });
    await logout();
  };

  const linkClass = ({ isActive }) =>
    `rounded-full px-3.5 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
    }`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition ${
        scrolled || mobileOpen
          ? "border-b border-gray-200/80 bg-white/90 shadow-sm backdrop-blur-lg dark:border-gray-800 dark:bg-gray-950/90"
          : "bg-white/70 backdrop-blur dark:bg-gray-950/70"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8" aria-label={t("nav.main")}>
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <img src="/logo.png" alt="" className="h-9 w-9 rounded-xl object-contain" />
          <span className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">
            <span translate="no">Meakutes<span className="text-brand-600">-Khmer</span></span>
          </span>
        </Link>

        <div className="ml-6 hidden flex-1 items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {t(l.key)}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <LanguageMenu className="hidden sm:block" />

          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            className={`${iconButton} hidden sm:grid`}
            aria-label={dark ? t("nav.toLight") : t("nav.toDark")}
            title={dark ? t("nav.lightMode") : t("nav.darkMode")}
          >
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {user && (
            <div className="relative" ref={favRef}>
              <button
                type="button"
                onClick={() => setFavOpen((o) => !o)}
                className={`${iconButton} relative`}
                aria-label={t("nav.favourites")}
                aria-expanded={favOpen}
              >
                <Heart size={19} />
                {favorites.length > 0 && (
                  <span
                    key={favorites.length}
                    className="absolute right-1 top-1 grid h-4 min-w-[1rem] animate-heart-pop place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white"
                  >
                    {favorites.length}
                  </span>
                )}
              </button>
              {favOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] origin-top-right animate-pop overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10">
                  <p className="border-b border-gray-100 px-4 py-3 text-sm font-semibold dark:border-gray-800">
                    {t("nav.savedPlaces", { count: favorites.length })}
                  </p>
                  {favorites.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      {t("nav.savedEmpty")}
                    </p>
                  ) : (
                    <ul className="max-h-80 overflow-y-auto py-1">
                      {favorites.map((trip) => (
                        <li key={trip.id} className="flex items-center gap-1 pr-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <Link to={`/trip/${trip.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-4">
                            <img src={favoriteImage(trip)} alt="" className="h-11 w-11 rounded-lg object-cover" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{pick(trip, "name")}</span>
                              <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                                {tv(trip.province)}
                              </span>
                            </span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFromFavorites(trip.id)}
                            className="rounded-full p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-gray-700"
                            aria-label={t("nav.remove", { name: pick(trip, "name") })}
                          >
                            <Trash2 size={15} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="relative hidden lg:block" ref={userRef}>
              <button
                type="button"
                onClick={() => setUserOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-expanded={userOpen}
              >
                <Avatar user={user} />
                <span className="max-w-[8rem] truncate text-sm font-medium">{user.first_name || user.display_name}</span>
                <ChevronDown size={16} className="text-gray-500" />
              </button>
              {userOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right animate-pop overflow-hidden rounded-2xl bg-white py-1.5 shadow-lift ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10">
                  <div className="border-b border-gray-100 px-4 pb-2.5 pt-1.5 dark:border-gray-800">
                    <p className="truncate text-sm font-semibold">{user.display_name}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  <Link to="/profile" className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                    <User size={16} /> {t("nav.profile")}
                  </Link>
                  {isEditor && (
                    <Link to="/admin" className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                      <LayoutDashboard size={16} /> {t("nav.admin")}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-gray-800"
                  >
                    <LogOut size={16} /> {t("nav.logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-1 lg:flex">
              <Link to="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                {t("nav.login")}
              </Link>
              <Link to="/signup" className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">
                {t("nav.signup")}
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className={`${iconButton} lg:hidden`}
            aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="h-[calc(100vh-4rem)] animate-slide-down overflow-y-auto border-t border-gray-200 bg-white px-4 pb-8 pt-4 dark:border-gray-800 dark:bg-gray-950 lg:hidden">
          {user && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gray-50 p-3 dark:bg-gray-900">
              <Avatar user={user} size={40} />
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.display_name}</p>
                <p className="truncate text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
          )}
          <div className="space-y-1">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-3 text-base font-medium ${
                    isActive
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                      : "text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  }`
                }
              >
                {t(l.key)}
              </NavLink>
            ))}
          </div>
          <LanguageMenu variant="panel" className="mt-4" />
          <div className="my-4">
            <button type="button" onClick={() => setDark((d) => !d)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 text-sm font-medium dark:bg-gray-800">
              {dark ? <Sun size={18} /> : <Moon size={18} />} {dark ? t("nav.light") : t("nav.dark")}
            </button>
          </div>
          {user ? (
            <div className="space-y-1 border-t border-gray-200 pt-4 dark:border-gray-800">
              <Link to="/profile" className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
                <User size={18} /> {t("nav.profile")}
              </Link>
              {isEditor && (
                <Link to="/admin" className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
                  <LayoutDashboard size={18} /> {t("nav.admin")}
                </Link>
              )}
              <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-gray-800">
                <LogOut size={18} /> {t("nav.logout")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 border-t border-gray-200 pt-4 dark:border-gray-800">
              <Link to="/login" className="rounded-xl bg-gray-100 py-3 text-center font-semibold dark:bg-gray-800">
                {t("nav.login")}
              </Link>
              <Link to="/signup" className="rounded-xl bg-brand-600 py-3 text-center font-semibold text-white">
                {t("nav.signup")}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
