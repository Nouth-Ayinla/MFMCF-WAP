"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";

type AuditLog = {
  id: string;
  action: string;
  details: string;
  adminId: string | null;
  adminName: string | null;
  ipAddress: string | null;
  createdAt: string;
};

function formatDateTime(isoString: string) {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch (e) {
    return isoString;
  }
}

function timeAgo(isoString: string) {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch (e) {
    return "";
  }
}

function getActionBadgeStyle(action: string) {
  const normalized = action.toUpperCase();
  if (normalized.startsWith("CREATE_") || normalized.startsWith("ADD_") || normalized === "INVITE_ADMIN") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (normalized.startsWith("UPDATE_") || normalized.startsWith("EDIT_") || normalized.includes("PROMOTE") || normalized.includes("DEMOTE") || normalized.includes("REACTIVATE")) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (normalized.startsWith("DELETE_") || normalized.startsWith("REMOVE_") || normalized.includes("DEACTIVATE") || normalized.includes("BAN") || normalized.includes("EXPIRE")) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  return "bg-blue-50 text-blue-700 border-blue-200";
}

function initials(name: string) {
  if (!name) return "SYS";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const pageSize = 15;

  // Debounce search term to prevent excessive database hits
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    }

    try {
      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load logs");
      }
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, router]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminShell>
      {/* Sticky Header with Search */}
      <header className="sticky top-14 md:top-0 z-40 bg-white border-b px-4 md:px-10 py-4 md:h-16 md:flex md:items-center md:justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-primary mb-3 md:mb-0">System Audit Logs</h1>
        <div className="relative w-full md:max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            placeholder="Search by action, details, actor..."
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-grow p-4 md:p-10 max-w-container-max mx-auto w-full flex flex-col">
        <div className="mb-6">
          <p className="text-on-surface-variant text-sm md:text-base">
            Track administrative changes, system operations, and setup updates for the election.
          </p>
        </div>

        {/* Adaptive View */}
        <div className="flex-grow flex flex-col justify-between">
          <div>
            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block bg-white border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-[#F3F4F6] border-b text-on-surface font-semibold text-xs uppercase tracking-wider">
                    <th className="p-4 w-[20%]">Timestamp</th>
                    <th className="p-4 w-[20%]">Actor</th>
                    <th className="p-4 w-[20%]">Action</th>
                    <th className="p-4 w-[28%]">Details</th>
                    <th className="p-4 w-[12%]">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-body-md">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-on-surface-variant">
                        <div className="flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                          Loading logs...
                        </div>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-on-surface-variant">
                        No audit logs matching query.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-container-low transition-all">
                        <td className="p-4 text-xs text-on-surface-variant whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold shrink-0">
                              {initials(log.adminName || "")}
                            </div>
                            <span className="font-medium text-sm truncate" title={log.adminName || "System"}>
                              {log.adminName || "System / Voter"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block border text-[10px] font-bold px-2 py-0.5 rounded-full uppercase truncate max-w-full ${getActionBadgeStyle(
                              log.action
                            )}`}
                            title={log.action}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-on-surface break-words">
                          {log.details}
                        </td>
                        <td className="p-4 text-xs font-mono text-on-surface-variant whitespace-nowrap">
                          {log.ipAddress || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card-Based View (< 768px) */}
            <div className="md:hidden space-y-3">
              {loading ? (
                <div className="bg-white border rounded-xl p-6 text-center text-on-surface-variant shadow-sm">
                  <div className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                    Loading logs...
                  </div>
                </div>
              ) : logs.length === 0 ? (
                <div className="bg-white border rounded-xl p-6 text-center text-on-surface-variant shadow-sm">
                  No audit logs matching query.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white border rounded-xl p-4 shadow-sm flex flex-col gap-3 hover:border-outline-variant transition-colors"
                  >
                    {/* Top Row: Action & Time */}
                    <div className="flex justify-between items-center gap-2">
                      <span
                        className={`inline-block border text-[10px] font-bold px-2 py-0.5 rounded-full uppercase truncate ${getActionBadgeStyle(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                      <span className="text-[11px] text-on-surface-variant font-medium shrink-0">
                        {timeAgo(log.createdAt)}
                      </span>
                    </div>

                    {/* Middle: Details */}
                    <p className="text-sm text-on-surface font-medium leading-relaxed">
                      {log.details}
                    </p>

                    {/* Divider */}
                    <div className="border-t border-gray-100" />

                    {/* Bottom Row: Actor & IP */}
                    <div className="flex justify-between items-center text-xs text-on-surface-variant font-medium">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center text-[9px] font-bold shrink-0">
                          {initials(log.adminName || "")}
                        </div>
                        <span className="truncate">{log.adminName || "System / Voter"}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                        <span className="material-symbols-outlined text-[14px]">lan</span>
                        {log.ipAddress || "—"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Touch-Friendly Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 bg-white border rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
              <span className="text-xs text-on-surface-variant font-medium">
                Showing {logs.length} of {total} records (Page {page} of {totalPages})
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-4 py-2 border rounded-lg text-xs font-semibold text-on-surface bg-surface hover:bg-surface-container-low disabled:opacity-50 disabled:hover:bg-surface transition-all select-none min-h-[44px]"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  Previous
                </button>
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                    .map((p, i, arr) => (
                      <span key={p} className="flex items-center">
                        {i > 0 && arr[i - 1] !== p - 1 && (
                          <span className="px-2 text-on-surface-variant text-xs font-bold">...</span>
                        )}
                        <button
                          onClick={() => setPage(p)}
                          disabled={loading}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-semibold transition-all select-none min-h-[44px] ${
                            page === p
                              ? "bg-primary text-white font-bold"
                              : "border text-on-surface bg-white hover:bg-surface-container-low"
                          }`}
                        >
                          {p}
                        </button>
                      </span>
                    ))}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-4 py-2 border rounded-lg text-xs font-semibold text-on-surface bg-surface hover:bg-surface-container-low disabled:opacity-50 disabled:hover:bg-surface transition-all select-none min-h-[44px]"
                >
                  Next
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </AdminShell>
  );
}
