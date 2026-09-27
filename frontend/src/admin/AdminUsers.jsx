import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { api } from "../api/client";
import { useConfirm, useToast } from "../components/Feedback";
import { useAuth } from "../context/AuthContext";

const ALL_ROLES = ["admin", "editor", "user"];

const AdminUsers = () => {
  const confirm = useConfirm();
  const toast = useToast();
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");

  const load = () => api.adminListUsers().then(setUsers).catch((err) => setError(err.message || "Failed to load users"));

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card ring-1 ring-gray-900/5 dark:ring-white/10 p-6 text-gray-600 dark:text-gray-300">
        Only admins can manage users and roles.
      </div>
    );
  }

  const toggleRole = async (target, role) => {
    if (target.id === currentUser?.id && role === "admin" && target.roles.includes("admin")) {
      if (!(await confirm({ title: "Please confirm", message: "Remove your own admin role? You may lose access to this panel.", danger: true }))) return;
    }
    const nextRoles = target.roles.includes(role)
      ? target.roles.filter((r) => r !== role)
      : [...target.roles, role];
    try {
      const updated = await api.adminSetUserRoles(target.id, nextRoles);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      toast.error(err.message || "Failed to update roles");
    }
  };

  const toggleActive = async (target) => {
    if (target.id === currentUser?.id && target.is_active) {
      if (!(await confirm({ title: "Please confirm", message: "Deactivate your own account? You will be signed out.", danger: true }))) return;
    }
    try {
      const updated = await api.adminSetUserActive(target.id, !target.is_active);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      toast.error(err.message || "Failed to update account status");
    }
  };

  const removeUser = async (target) => {
    const ok = await confirm({
      title: `Delete ${target.email}?`,
      message: "Their reviews, comments and saved places will be deleted too. This cannot be undone.",
      confirmLabel: "Delete user",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.adminDeleteUser(target.id);
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      toast.success(`${target.email} was deleted.`);
    } catch (err) {
      toast.error(err.message || "Failed to delete the user");
    }
  };

  if (users === null) {
    return <div className="text-gray-500 dark:text-gray-400">{error || "Loading users..."}</div>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Users & Roles</h1>

      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 text-sm bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-900">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card ring-1 ring-gray-900/5 dark:ring-white/10 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100 transition hover:bg-gray-50/60 dark:border-gray-800 dark:hover:bg-gray-800/40">
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
                              ? "bg-brand-600 text-white border-brand-600"
                              : "bg-white text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
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
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                    }`}
                  >
                    {u.is_active ? "Active" : "Deactivated"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id !== currentUser?.id && (
                    <button
                      onClick={() => removeUser(u)}
                      title="Delete user"
                      aria-label={`Delete ${u.email}`}
                      className="rounded-full p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-gray-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
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
