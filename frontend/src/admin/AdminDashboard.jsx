import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Newspaper, Users, Star } from "lucide-react";
import { api } from "../api/client";

function StatCard({ icon: Icon, label, value, to }) {
  return (
    <Link
      to={to}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-card ring-1 ring-gray-900/5 dark:ring-white/10 p-6 flex items-center gap-4 transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 dark:bg-brand-900/30">
        <Icon className="text-brand-600 dark:text-brand-400" size={24} />
      </div>
      <div>
        <p className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </Link>
  );
}

const AdminDashboard = () => {
  const [stats, setStats] = useState({ destinations: null, news: null, users: null });

  useEffect(() => {
    Promise.all([
      api.listDestinations({ status: "all" }).catch(() => []),
      api.listNews({ status: "all" }).catch(() => []),
      api.adminListUsers().catch(() => []),
    ]).then(([destinations, news, users]) => {
      setStats({ destinations: destinations.length, news: news.length, users: users.length });
    });
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard icon={MapPin} label="Destinations" value={stats.destinations ?? "..."} to="/admin/destinations" />
        <StatCard icon={Newspaper} label="News & events" value={stats.news ?? "..."} to="/admin/news" />
        <StatCard icon={Users} label="Users" value={stats.users ?? "..."} to="/admin/users" />
      </div>
      <div className="mt-8 bg-white dark:bg-gray-900 rounded-2xl shadow-card ring-1 ring-gray-900/5 dark:ring-white/10 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Star size={18} className="text-amber-400" /> Reviews need moderation from time to time
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Check the Reviews page for anything flagged, or that looks off.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
