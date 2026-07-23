"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";

type ElectionSettings = {
  status: "active" | "stopped";
  endsAt: string | null;
  categoriesLocked: boolean;
  updatedAt?: string;
};

function toLocalDatetimeString(isoString: string | null) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const tzoffset = date.getTimezoneOffset() * 60000;
  const localISOTime = new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
  return localISOTime;
}

function formatPrettyDateTime(isoString: string | null) {
  if (!isoString) return "No timer set";
  try {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return isoString;
  }
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<ElectionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [timerInput, setTimerInput] = useState("");
  const [systemTime, setSystemTime] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    // Live clock for admin reference
    const interval = setInterval(() => {
      setSystemTime(new Date().toLocaleTimeString());
    }, 1000);
    setSystemTime(new Date().toLocaleTimeString());
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/admin/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        setIsSuperAdmin(data.admin?.role === "superadmin");
      })
      .catch(() => {});
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load settings");
      }
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        setTimerInput(toLocalDatetimeString(data.settings.endsAt));
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while loading settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleToggleCategoryLock = async () => {
    if (!settings) return;
    const confirmMsg = settings.categoriesLocked
      ? "Are you sure you want to unlock category management? All admins will be able to add, edit, or delete categories."
      : "Are you sure you want to lock category management? All modifications to categories and nominees will be blocked.";
    if (!confirm(confirmMsg)) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: settings.status,
          endsAt: settings.endsAt,
          categoriesLocked: !settings.categoriesLocked,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update category lock status");
      }

      setSettings(data.settings);
      setSuccess(`Category management has been ${data.settings.categoriesLocked ? "locked" : "unlocked"} successfully.`);
    } catch (err: any) {
      setError(err.message || "Failed to update lock status.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (newStatus: "active" | "stopped") => {
    if (!settings) return;
    const confirmMsg =
      newStatus === "stopped"
        ? "Are you sure you want to stop the election? Voters will no longer be able to check in or cast votes."
        : "Are you sure you want to resume the election? Voters will be allowed to cast ballots.";
    if (!confirm(confirmMsg)) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          endsAt: settings.endsAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update status");
      }

      setSettings(data.settings);
      setSuccess(`Election has been ${newStatus === "active" ? "resumed" : "stopped"} successfully.`);
    } catch (err: any) {
      setError(err.message || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTimer = async () => {
    if (!settings) return;
    if (!timerInput) {
      setError("Please choose a date and time before saving.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const endsAtISO = new Date(timerInput).toISOString();
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: settings.status,
          endsAt: endsAtISO,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save timer");
      }

      setSettings(data.settings);
      setSuccess("Election countdown timer saved successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to save timer.");
    } finally {
      setSaving(false);
    }
  };

  const handleClearTimer = async () => {
    if (!settings) return;
    if (!confirm("Are you sure you want to disable the countdown timer?")) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: settings.status,
          endsAt: null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to clear timer");
      }

      setSettings(data.settings);
      setTimerInput("");
      setSuccess("Election countdown timer disabled successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to clear timer.");
    } finally {
      setSaving(false);
    }
  };

  const isTimerExpired = settings?.endsAt
    ? new Date() > new Date(settings.endsAt)
    : false;

  const isVotingStopped = settings?.status === "stopped";
  const isVotingClosed = isVotingStopped || isTimerExpired;

  return (
    <AdminShell>
      {/* Header */}
      <header className="sticky top-14 md:top-0 z-40 bg-white border-b px-4 md:px-10 py-4 md:h-16 md:flex md:items-center md:justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-primary">Election Settings</h1>
        <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-full mt-2 md:mt-0">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Server Time: {systemTime || "—"}
        </div>
      </header>

      <main className="p-4 md:p-10 max-w-4xl mx-auto w-full space-y-6">
        <div>
          <p className="text-on-surface-variant text-sm md:text-base">
            Control the appreciation election lifecycle, halt voting, or schedule an automatic countdown timer.
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl shadow-sm text-sm">
            <div className="flex items-center gap-2 font-bold mb-1">
              <span className="material-symbols-outlined">error</span>
              Error
            </div>
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-r-xl shadow-sm text-sm">
            <div className="flex items-center gap-2 font-bold mb-1">
              <span className="material-symbols-outlined">check_circle</span>
              Success
            </div>
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-on-surface-variant flex flex-col items-center gap-2">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
            <p>Loading election settings...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Status Panel */}
            <div className="bg-white border rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-2xl">sensors</span>
                  <h2 className="text-lg font-bold">Election Control</h2>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Start or stop the election process. Halting the election immediately blocks all voter logins and vote submissions.
                </p>

                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/60">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                        Current Status
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isVotingClosed
                              ? "bg-red-500"
                              : "bg-green-500 animate-pulse"
                          }`}
                        />
                        <span className="font-bold text-base md:text-lg">
                          {isVotingClosed
                            ? isVotingStopped
                              ? "STOPPED"
                              : "EXPIRED"
                            : "ACTIVE"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t flex flex-col gap-3">
                {isVotingStopped ? (
                  <button
                    onClick={() => handleUpdateStatus("active")}
                    disabled={saving}
                    className="w-full bg-[#10B981] text-white py-3.5 rounded-xl font-bold hover:bg-[#059669] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">play_arrow</span>
                    Resume Voting Process
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus("stopped")}
                    disabled={saving}
                    className="w-full bg-[#EF4444] text-white py-3.5 rounded-xl font-bold hover:bg-[#DC2626] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">pause</span>
                    Halt / Stop Election
                  </button>
                )}
              </div>
            </div>

            {/* Timer Panel */}
            <div className="bg-white border rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-2xl">alarm</span>
                  <h2 className="text-lg font-bold">Election Timer</h2>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Configure an automatic end time. Once reached, voting shuts down automatically.
                </p>

                <div className="mt-4 border-t pt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                      End Date & Time (Local)
                    </label>
                    <input
                      type="datetime-local"
                      value={timerInput}
                      onChange={(e) => setTimerInput(e.target.value)}
                      className="w-full border border-outline-variant bg-surface-container-lowest rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold"
                    />
                  </div>

                  <div className="p-3 bg-surface-container-lowest border rounded-xl flex items-center justify-between text-xs text-on-surface-variant">
                    <span className="font-medium">Scheduled Closing:</span>
                    <span className="font-bold text-on-surface">
                      {formatPrettyDateTime(settings?.endsAt ?? null)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t flex gap-3">
                <button
                  onClick={handleSaveTimer}
                  disabled={saving}
                  className="flex-1 bg-black text-white py-3.5 rounded-xl font-bold hover:bg-[#6B21A8] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  Save Timer
                </button>
                {settings?.endsAt && (
                  <button
                    onClick={handleClearTimer}
                    disabled={saving}
                    className="border border-outline-variant hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-on-surface py-3.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center"
                    title="Disable Countdown"
                  >
                    <span className="material-symbols-outlined">timer_off</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category Lock Panel */}
            <div className="bg-white border rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    {settings?.categoriesLocked ? "lock" : "lock_open"}
                  </span>
                  <h2 className="text-lg font-bold">Category Lock</h2>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Lock category modifications. When locked, admins are prevented from adding, editing, or deleting categories or nominees.
                </p>

                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/60">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                        Lock Status
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            settings?.categoriesLocked
                              ? "bg-red-500"
                              : "bg-green-500 animate-pulse"
                          }`}
                        />
                        <span className="font-bold text-base md:text-lg">
                          {settings?.categoriesLocked ? "LOCKED" : "UNLOCKED"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t flex flex-col gap-3">
                {isSuperAdmin ? (
                  <button
                    onClick={handleToggleCategoryLock}
                    disabled={saving}
                    className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 text-white ${
                      settings?.categoriesLocked
                        ? "bg-[#10B981] hover:bg-[#059669]"
                        : "bg-[#EF4444] hover:bg-[#DC2626]"
                    }`}
                  >
                    <span className="material-symbols-outlined">
                      {settings?.categoriesLocked ? "lock_open" : "lock"}
                    </span>
                    {settings?.categoriesLocked ? "Unlock Categories" : "Lock Categories"}
                  </button>
                ) : (
                  <div className="text-xs text-center text-on-surface-variant font-medium bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/40">
                    <span className="material-symbols-outlined text-[16px] align-middle mr-1.5 text-outline">info</span>
                    Only superadmins can toggle category locks.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminShell>
  );
}
