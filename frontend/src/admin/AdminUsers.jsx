import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const ALL_ROLES = ["admin", "editor", "user"];

const AdminUsers = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");

  const load = () => api.adminListUsers().then(setUsers).catch((err) => setError(err.message || "Failed to load users"));

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 text-gray-600 dark:text-gray-300">
        Only admins can manage users and roles.
      </div>
    );
  }

  const toggleRole = async (target, role) => {
    if (target.id === currentUser?.id && role === "admin" && target.roles.includes("admin")) {
      if (!window.confirm("Remove your own admin role? You may lose access to this panel.")) return;
    }
    const nextRoles = target.roles.includes(role)
      ? target.roles.filter((r) => r !== role)
      : [...target.roles, role];
    try {
      const updated = await api.adminSetUserRoles(target.id, nextRoles);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      alert(err.message || "Failed to update roles");
    }
  };

  const toggleActive = async (target) => {
    if (target.id === currentUser?.id && target.is_active) {
      if (!window.confirm("Deactivate your own account? You will be signed out.")) return;
    }
    try {
      const updated = await api.adminSetUserActive(target.id, !target.is_active);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      alert(err.message || "Failed to update account status");
    }
  };

  if (users === null) {
    return <div className="text-gray-500 dark:text-gray-400">{error || "Loading users..."}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Users & Roles</h1>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-left text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3">Active</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100 dark:border-gray-700">
                <td className="px-4 py-3 text-gray-900 dark:text-white">
                  {u.display_name || "-"} {u.id === currentUser?.id && <span className="text-xs text-gray-400">(you)</span>}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.email}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {ALL_ROLES.map((role) => {
                      const has = u.roles.includes(role);
                      return (
                        <button
                          key={role}
                          onClick={() => toggleRole(u, role)}
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            has
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {role}
                        </button>
                      );
                    })}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(u)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      u.is_active
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    {u.is_active ? "Active" : "Deactivated"}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
