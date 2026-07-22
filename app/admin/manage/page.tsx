"use client";

import { useEffect, useState, useCallback } from "react";
import AdminShell from "@/components/admin/AdminShell";

type Admin = {
  id: string;
  email: string;
  fullName: string | null;
  role: "admin" | "superadmin";
  banned: boolean;
  lastSignInAt: string | null;
  createdAt: string;
  isSelf: boolean;
};

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showInvite, setShowInvite] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "superadmin">("admin");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/manage");
    const data = await res.json();
    if (res.ok) setAdmins(data.admins ?? []);
    else setError(data.error ?? "Could not load admins.");
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setInviteLoading(true);
    const res = await fetch("/api/admin/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password, role }),
    });
    const data = await res.json();
    setInviteLoading(false);
    if (!res.ok) {
      setInviteError(data.error ?? "Could not create admin.");
      return;
    }
    setFullName("");
    setEmail("");
    setPassword("");
    setRole("admin");
    setShowInvite(false);
    load();
  }

  async function toggleRole(admin: Admin) {
    const nextRole = admin.role === "superadmin" ? "admin" : "superadmin";
    if (!confirm(`Make ${admin.email} a ${nextRole}?`)) return;
    await fetch(`/api/admin/manage/${admin.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setRole", role: nextRole }),
    });
    load();
  }

  async function toggleBanned(admin: Admin) {
    const action = admin.banned ? "reactivate" : "deactivate";
    if (!confirm(`${action === "deactivate" ? "Deactivate" : "Reactivate"} ${admin.email}?`)) return;
    await fetch(`/api/admin/manage/${admin.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setBanned", banned: !admin.banned }),
    });
    load();
  }

  async function deleteAdmin(admin: Admin) {
    if (!confirm(`Permanently delete ${admin.email}? This can't be undone.`)) return;
    await fetch(`/api/admin/manage/${admin.id}`, { method: "DELETE" });
    load();
  }

  return (
    <AdminShell>
      <header className="sticky top-14 md:top-0 z-40 bg-white border-b px-4 md:px-10 py-4 md:h-16 md:flex md:items-center">
        <h1 className="text-xl md:text-2xl font-bold text-primary">Manage Admins</h1>
      </header>

      <main className="flex-grow p-4 md:p-10 max-w-container-max mx-auto w-full">
        <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-3">
          <p className="text-on-surface-variant text-sm md:text-base max-w-lg">
            Superadmins can invite new admins, change roles, deactivate access, or remove accounts.
          </p>
          <button
            onClick={() => setShowInvite((s) => !s)}
            className="bg-primary text-white px-4 py-2 rounded shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">person_add</span>
            <span className="text-sm uppercase tracking-wide">Invite Admin</span>
          </button>
        </div>

        {showInvite && (
          <form onSubmit={handleInvite} className="bg-white border p-4 mb-6 flex flex-col gap-3 shadow-sm">
            {inviteError && <p className="text-sm text-[#DC2626]">{inviteError}</p>}
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-on-surface-variant uppercase">Full Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant uppercase">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant uppercase">Temporary Password</label>
                <input
                  type="text"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant uppercase">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "admin" | "superadmin")}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={inviteLoading}
                className="bg-primary text-white px-4 py-2 rounded text-sm disabled:opacity-60"
              >
                {inviteLoading ? "Creating..." : "Create Admin"}
              </button>
              <button type="button" onClick={() => setShowInvite(false)} className="px-4 py-2 rounded text-sm border">
                Cancel
              </button>
            </div>
          </form>
        )}

        {error && <p className="text-sm text-[#DC2626] mb-4">{error}</p>}

        {/* Responsive layout: Table on desktop, Cards on mobile */}
        <div className="block">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border overflow-x-auto">
            <table className="w-full min-w-[600px] text-left border-collapse">
              <thead>
                <tr className="bg-[#F3F4F6] border-b">
                  <th className="p-4 text-xs uppercase tracking-wider">Admin</th>
                  <th className="p-4 text-xs uppercase tracking-wider">Role</th>
                  <th className="p-4 text-xs uppercase tracking-wider text-center">Status</th>
                  <th className="p-4 text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-on-surface-variant">
                      Loading...
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-on-surface-variant">
                      No admins found.
                    </td>
                  </tr>
                ) : (
                  admins.map((a) => (
                    <tr key={a.id} className="hover:bg-surface-container-low transition-all">
                      <td className="p-4">
                        <div className="font-semibold text-sm">
                          {a.fullName ?? "—"} {a.isSelf && <span className="text-xs text-on-surface-variant">(you)</span>}
                        </div>
                        <div className="text-xs text-on-surface-variant">{a.email}</div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full uppercase ${
                            a.role === "superadmin" ? "bg-black text-white" : "bg-[#6B21A8] text-white"
                          }`}
                        >
                          {a.role}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase border ${
                            a.banned
                              ? "bg-red-100 text-red-800 border-red-200"
                              : "bg-green-100 text-green-800 border-green-200"
                          }`}
                        >
                          {a.banned ? "Deactivated" : "Active"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {!a.isSelf && (
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => toggleRole(a)}
                              title={a.role === "superadmin" ? "Demote to admin" : "Promote to superadmin"}
                              className="p-1.5 hover:text-secondary transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                {a.role === "superadmin" ? "arrow_downward" : "arrow_upward"}
                              </span>
                            </button>
                            <button
                              onClick={() => toggleBanned(a)}
                              title={a.banned ? "Reactivate" : "Deactivate"}
                              className="p-1.5 hover:text-orange-600 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                {a.banned ? "lock_open" : "lock"}
                              </span>
                            </button>
                            <button
                              onClick={() => deleteAdmin(a)}
                              title="Delete"
                              className="p-1.5 hover:text-error transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Grid View */}
          <div className="md:hidden space-y-4">
            {loading ? (
              <p className="text-center text-sm text-on-surface-variant py-6">Loading...</p>
            ) : admins.length === 0 ? (
              <p className="text-center text-sm text-on-surface-variant py-6">No admins found.</p>
            ) : (
              admins.map((a) => (
                <div key={a.id} className="bg-white border border-outline-variant rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                      {(a.fullName ?? a.email).substring(0, 2)}
                    </div>
                    <div className="min-w-0 flex-grow">
                      <div className="font-semibold text-sm text-on-surface truncate flex items-center gap-2">
                        {a.fullName ?? "—"}
                        {a.isSelf && <span className="text-[10px] text-on-surface-variant bg-gray-100 px-2 py-0.5 rounded-full font-normal">(you)</span>}
                      </div>
                      <div className="text-xs text-on-surface-variant truncate">{a.email}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <span
                      className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full uppercase ${
                        a.role === "superadmin" ? "bg-black text-white" : "bg-[#6B21A8] text-white"
                      }`}
                    >
                      {a.role}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase border ${
                        a.banned
                          ? "bg-red-100 text-red-800 border-red-200"
                          : "bg-green-100 text-green-800 border-green-200"
                      }`}
                    >
                      {a.banned ? "Deactivated" : "Active"}
                    </span>
                  </div>

                  {!a.isSelf && (
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => toggleRole(a)}
                        className="flex items-center gap-1 text-xs font-bold text-outline hover:text-secondary transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {a.role === "superadmin" ? "arrow_downward" : "arrow_upward"}
                        </span>
                        {a.role === "superadmin" ? "Demote" : "Promote"}
                      </button>
                      <button
                        onClick={() => toggleBanned(a)}
                        className="flex items-center gap-1 text-xs font-bold text-outline hover:text-orange-600 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {a.banned ? "lock_open" : "lock"}
                        </span>
                        {a.banned ? "Reactivate" : "Deactivate"}
                      </button>
                      <button
                        onClick={() => deleteAdmin(a)}
                        className="flex items-center gap-1 text-xs font-bold text-outline hover:text-error transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </AdminShell>
  );
}
