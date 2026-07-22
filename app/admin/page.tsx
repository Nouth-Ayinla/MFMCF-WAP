"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";

type Overview = {
  totalVotes: number;
  participatingUnits: number;
  totalUnits: number;
  topVotingUnit: { unit: string; votes: number } | null;
  leaderboard: { title: string; nominees: { name: string; votes: number }[] }[];
  recentActivity: { id: string; voterUnit: string; categoryTitle: string; createdAt: string }[];
  isFiltered?: boolean;
  participatingMembers?: number;
  totalMembers?: number;
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString();
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState("All Units");
  const [units, setUnits] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/verify/units")
      .then((r) => r.json())
      .then((data) => {
        if (data.units) {
          setUnits(data.units);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedUnit && selectedUnit !== "All Units") {
      params.set("unit", selectedUnit);
    }
    fetch(`/api/admin/overview?${params.toString()}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [selectedUnit]);

  const maxLeaderboardVotes = Math.max(
    1,
    ...(data?.leaderboard.flatMap((c) => c.nominees.map((n) => n.votes)) ?? [1])
  );

  return (
    <AdminShell>
      {/* Header */}
      <header className="sticky top-14 md:top-0 z-40 bg-white border-b px-4 md:px-10 py-4 md:h-16 md:flex md:items-center md:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl md:text-2xl font-bold text-primary">Live Voting Overview</h1>
          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live Voting Active
          </span>
          <div className="flex items-center gap-1.5 ml-0 md:ml-4">
            <span className="text-xs uppercase tracking-wider font-bold text-on-surface-variant">Filter by:</span>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="border border-outline-variant bg-surface-container-lowest rounded-lg py-1 pl-3 pr-8 text-xs font-semibold text-on-surface cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="All Units">All Units</option>
              {units.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
        <button className="hidden md:flex items-center gap-2 bg-black text-white px-4 py-2 rounded font-semibold text-sm hover:opacity-90">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export Results (CSV)
        </button>
      </header>

      <main className="p-4 md:p-10 max-w-container-max mx-auto w-full">
        {/* Mobile export button, full-width under the header */}
        <button className="md:hidden w-full mb-4 flex items-center justify-center gap-2 bg-black text-white px-4 py-3 rounded-lg font-semibold text-sm">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export Results (CSV)
        </button>

        {/* Stat cards: horizontal scroll-snap on mobile, grid on desktop */}
        <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 pb-2 md:pb-0 mb-6 [&::-webkit-scrollbar]:hidden">
          <StatCard
            icon="how_to_vote"
            label="Total Votes Cast"
            value={loading ? "—" : data?.totalVotes ?? 0}
            sub="+ live"
          />
          {data?.isFiltered ? (
            <StatCard
              icon="group"
              label="Participating Members"
              value={loading ? "—" : `${data?.participatingMembers ?? 0} / ${data?.totalMembers ?? 0}`}
              sub="Members active"
            />
          ) : (
            <StatCard
              icon="hub"
              label="Participating Units"
              value={loading ? "—" : `${data?.participatingUnits ?? 0} / ${data?.totalUnits ?? 0}`}
              sub="Units active"
            />
          )}
          <StatCard
            icon="military_tech"
            label="Top Voting Unit"
            value={loading ? "—" : data?.topVotingUnit?.unit ?? "—"}
            sub={data?.topVotingUnit ? `${data.topVotingUnit.votes} votes` : undefined}
            accent
          />
          <StatCard icon="sensors" label="System Status" value="100%" sub="Operational" />
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-4 md:gap-6">
          {/* Leaderboard */}
          <section className="bg-white border rounded-xl p-5 md:p-8">
            <div className="mb-6">
              <h2 className="text-lg md:text-2xl font-bold">Leaderboard Analytics</h2>
              <p className="text-sm text-on-surface-variant">Live standing across all WAP categories.</p>
            </div>

            {loading ? (
              <p className="text-sm text-on-surface-variant">Loading standings...</p>
            ) : data?.leaderboard.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No votes recorded yet.</p>
            ) : (
              <div className="space-y-8">
                {data?.leaderboard.map((cat) => (
                  <div key={cat.title}>
                    <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">{cat.title}</h3>
                    <div className="space-y-3">
                      {cat.nominees.map((n, i) => (
                        <div key={n.name}>
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="font-semibold text-sm md:text-base truncate pr-2">{n.name}</span>
                            <span className="text-sm md:text-base font-bold whitespace-nowrap">{n.votes} Votes</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-surface-container-low overflow-hidden">
                            <div
                              className={`h-full rounded-full ${i === 0 ? "bg-primary" : i === 1 ? "bg-secondary" : "bg-outline-variant"}`}
                              style={{ width: `${(n.votes / maxLeaderboardVotes) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Live activity log */}
          <section className="bg-white border rounded-xl p-5 md:p-6 flex flex-col max-h-[520px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                Live Activity Log
              </h2>
              <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Real-time</span>
            </div>
            <div className="flex-grow overflow-y-auto -mr-2 pr-2 space-y-4">
              {loading ? (
                <p className="text-sm text-on-surface-variant">Loading...</p>
              ) : data?.recentActivity.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No activity yet.</p>
              ) : (
                data?.recentActivity.map((a) => (
                  <div key={a.id} className="border-l-2 border-green-500 pl-3">
                    <p className="text-sm">
                      New vote submitted from <span className="font-bold">{a.voterUnit}</span>
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {timeAgo(a.createdAt)} • Category: {a.categoryTitle}
                    </p>
                  </div>
                ))
              )}
            </div>
            <button className="mt-4 text-primary font-semibold text-sm flex items-center justify-center gap-1 pt-3 border-t">
              View All Records
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </section>
        </div>
      </main>
    </AdminShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="snap-start shrink-0 w-[65vw] xs:w-[55vw] md:w-auto bg-white border rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-on-surface-variant font-medium">{label}</span>
        <span className={`material-symbols-outlined text-[20px] ${accent ? "text-primary" : "text-outline"}`}>{icon}</span>
      </div>
      <div className="text-xl md:text-2xl font-bold truncate">{value}</div>
      {sub && <div className={`text-xs font-medium ${accent ? "text-primary" : "text-on-surface-variant"}`}>{sub}</div>}
    </div>
  );
}
