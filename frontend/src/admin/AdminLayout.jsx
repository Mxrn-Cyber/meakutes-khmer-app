import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  GalleryHorizontalEnd,
  LayoutDashboard,
  MapPin,
  Newspaper,
  Tags,
  Image,
  Star,
  Users,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import { api } from "../api/client";

const baseLinks = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/destinations", label: "Destinations", icon: MapPin },
  { to: "/admin/news", label: "News & Events", icon: Newspaper },
  { to: "/admin/taxonomy", label: "Categories & Tags", icon: Tags },
  { to: "/admin/media", label: "Media Library", icon: Image },
  { to: "/admin/site-images", label: "Site photos", icon: GalleryHorizontalEnd },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
];

const adminOnlyLinks = [{ to: "/admin/users", label: "Users & Roles", icon: Users }];

function useTheme() {
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("theme") === "dark";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      /* storage unavailable */
    }
  }, [dark]);
  return [dark, () => setDark((d) => !d)];
}

function SidebarContent({ links, onNavigate, user, onLogout }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-200 dark:border-gray-800">
        <img src="/images/logo.webp" alt="" className="h-9 w-9 rounded-xl object-contain" />
        <div className="leading-tight">
          <p className="font-extrabold tracking-tight text-gray-900 dark:text-white">Meakutes<span className="text-brand-600">-Khmer</span></p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Admin panel</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 dark:border-gray-800 px-3 py-4 space-y-1">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ExternalLink size={18} />
          View website
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-gray-800"
        >
          <LogOut size={18} />
          Log out
        </button>
        {user && (
          <div className="flex items-center gap-3 px-3 pt-3">
            {user.avatar_url ? (
              <img src={api.mediaUrl(user.avatar_url)} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-gray-800 text-brand-700 dark:text-gray-200 flex items-center justify-center text-sm font-semibold">
                {(user.display_name || user.email || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {user.display_name || user.email}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {user.roles?.includes("admin") ? "Admin" : "Editor"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const AdminLayout = () => {
  const { isAdmin, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, toggleDark] = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const links = isAdmin ? [...baseLinks, ...adminOnlyLinks] : baseLinks;
  const current = links.find((l) => (l.end ? pathname === l.to : pathname.startsWith(l.to)));

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    navigate("/login", { state: { message: "Logged out successfully." } });
    await logout();
  };

  const sidebar = (
    <SidebarContent
      links={links}
      user={user}
      onLogout={handleLogout}
      onNavigate={() => setMenuOpen(false)}
    />
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:block md:w-64 md:flex-shrink-0 md:sticky md:top-0 md:h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        {sidebar}
      </aside>

      {/* Phone menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white dark:bg-gray-900 shadow-lift">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X size={20} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur px-4 py-3 md:px-10">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="md:hidden rounded-xl p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Menu size={22} />
          </button>
          <p className="flex-1 truncate font-semibold text-gray-900 dark:text-white md:hidden">
            {current?.label || "Admin"}
          </p>
          <div className="hidden md:block md:flex-1" />
          <button
            type="button"
            onClick={toggleDark}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
            className="rounded-xl p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-10 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
