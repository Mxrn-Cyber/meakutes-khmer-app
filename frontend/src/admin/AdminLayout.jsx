import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
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
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const baseLinks = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/destinations", label: "Destinations", icon: MapPin },
  { to: "/admin/news", label: "News & Events", icon: Newspaper },
  { to: "/admin/taxonomy", label: "Categories & Tags", icon: Tags },
  { to: "/admin/media", label: "Media Library", icon: Image },
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
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-200 dark:border-gray-700">
        <img src="/logo.png" alt="" className="h-9 w-9 rounded-lg object-contain" />
        <div className="leading-tight">
          <p className="font-bold text-gray-900 dark:text-white">Meakutes-Khmer</p>
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
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-4 space-y-1">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ExternalLink size={18} />
          View website
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-gray-700"
        >
          <LogOut size={18} />
          Log out
        </button>
        {user && (
          <div className="flex items-center gap-3 px-3 pt-3">
            {user.avatar_url ? (
              <img src={api.mediaUrl(user.avatar_url)} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-gray-700 text-blue-700 dark:text-gray-200 flex items-center justify-center text-sm font-semibold">
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
    await logout();
    navigate("/login");
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:block md:w-64 md:flex-shrink-0 md:sticky md:top-0 md:h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        {sidebar}
      </aside>

      {/* Phone menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white dark:bg-gray-800 shadow-xl">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={20} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur px-4 py-3 md:px-10">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="md:hidden rounded-lg p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
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
            className="rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
