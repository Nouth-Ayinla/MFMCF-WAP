"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import ConfirmationModal from "@/components/admin/ConfirmationModal";

type Worker = { id: string; name: string; unit: string; status: "VERIFIED" | "PENDING" };

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function WorkerRosterPage() {
  const router = useRouter();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [unit, setUnit] = useState("All Units");
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [dynamicUnits, setDynamicUnits] = useState<string[]>([]);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  // Copy-paste import states
  const [pasteText, setPasteText] = useState("");

  const [activeTab, setActiveTab] = useState<"workers" | "units">("workers");
  const [adminUnits, setAdminUnits] = useState<{ id: string; name: string; createdAt: string }[]>([]);
  const [adminUnitsLoading, setAdminUnitsLoading] = useState(true);
  const [newUnitName, setNewUnitName] = useState("");
  const [unitSaveError, setUnitSaveError] = useState<string | null>(null);
  const [unitSaving, setUnitSaving] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<{ id: string; name: string } | null>(null);
  const [editingUnit, setEditingUnit] = useState<{ id: string; name: string } | null>(null);
  const [importTargetUnit, setImportTargetUnit] = useState("detect");

  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [editWorkerName, setEditWorkerName] = useState("");
  const [editWorkerUnit, setEditWorkerUnit] = useState("");
  const [editWorkerStatus, setEditWorkerStatus] = useState<"VERIFIED" | "PENDING">("PENDING");
  const [confirmWorkerDeleteOpen, setConfirmWorkerDeleteOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);

  const loadAdminUnits = useCallback(async () => {
    setAdminUnitsLoading(true);
    try {
      const res = await fetch("/api/admin/units");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      if (data.units) {
        setAdminUnits(data.units);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminUnitsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (activeTab === "units") {
      loadAdminUnits();
    }
  }, [activeTab, loadAdminUnits]);

  async function handleAddUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!newUnitName.trim()) return;
    setUnitSaving(true);
    setUnitSaveError(null);
    try {
      const res = await fetch("/api/admin/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newUnitName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save unit.");
      }
      setNewUnitName("");
      loadAdminUnits();
      loadUnits(); // Sync selection dropdown and verification list
    } catch (err: any) {
      setUnitSaveError(err.message ?? "Failed to save unit.");
    } finally {
      setUnitSaving(false);
    }
  }

  async function handleEditUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUnit || !newUnitName.trim()) return;
    if (editingUnit.name === newUnitName.trim()) {
      setEditingUnit(null);
      setNewUnitName("");
      return;
    }
    setUnitSaving(true);
    setUnitSaveError(null);
    try {
      const res = await fetch(`/api/admin/units/${editingUnit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newUnitName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update unit.");
      }
      setEditingUnit(null);
      setNewUnitName("");
      loadAdminUnits();
      loadUnits(); // Sync selection dropdown and verification list
    } catch (err: any) {
      setUnitSaveError(err.message ?? "Failed to update unit.");
    } finally {
      setUnitSaving(false);
    }
  }

  function triggerDeleteUnit(id: string, name: string) {
    setUnitToDelete({ id, name });
    setConfirmModalOpen(true);
  }

  async function handleDeleteUnitConfirm() {
    if (!unitToDelete) return;
    try {
      const res = await fetch(`/api/admin/units/${unitToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadAdminUnits();
        loadUnits(); // Sync selection dropdown and verify list
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to delete unit.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete unit.");
    } finally {
      setConfirmModalOpen(false);
      setUnitToDelete(null);
    }
  }

  const pageSize = 10;

  const loadUnits = useCallback(async () => {
    try {
      const res = await fetch("/api/verify/units");
      const data = await res.json();
      if (data.units) {
        setDynamicUnits(data.units);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (unit) params.set("unit", unit);

    const res = await fetch(`/api/admin/workers?${params.toString()}`);
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    const data = await res.json();
    setWorkers(data.workers ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, search, unit, router]);

  useEffect(() => {
    load();
    loadUnits();
  }, [load, loadUnits]);

  async function handleAddWorker(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newUnit.trim()) return;
    await fetch("/api/admin/workers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), unit: newUnit.trim() }),
    });
    setNewName("");
    setNewUnit("");
    setShowAdd(false);
    setPage(1);
    load();
    loadUnits();
  }

  async function handleSaveEditWorker(e: React.FormEvent) {
    e.preventDefault();
    if (!editingWorker || !editWorkerName.trim() || !editWorkerUnit.trim()) return;
    try {
      const res = await fetch(`/api/admin/workers/${editingWorker.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editWorkerName.trim(),
          unit: editWorkerUnit.trim(),
          status: editWorkerStatus,
        }),
      });
      if (res.ok) {
        setEditingWorker(null);
        setEditWorkerName("");
        setEditWorkerUnit("");
        setShowAdd(false);
        load();
        loadUnits();
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to update worker.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update worker.");
    }
  }

  function triggerDeleteWorker(worker: Worker) {
    setWorkerToDelete(worker);
    setConfirmWorkerDeleteOpen(true);
  }

  async function handleDeleteWorkerConfirm() {
    if (!workerToDelete) return;
    try {
      const res = await fetch(`/api/admin/workers/${workerToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        load();
        loadUnits();
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to delete worker.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete worker.");
    } finally {
      setConfirmWorkerDeleteOpen(false);
      setWorkerToDelete(null);
    }
  }

  function parseImportText(text: string, targetUnit?: string) {
    const lines = text.split("\n").map(line => line.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    if (targetUnit && targetUnit !== "detect") {
      return lines.map((line) => {
        const name = line.trim();
        return { name, unit: targetUnit };
      }).filter((r) => r.name);
    }

    const firstLine = lines[0].toLowerCase();
    let hasHeader = false;
    let nameIdx = 0;
    let unitIdx = 1;
    let delimiter = ",";

    // Detect delimiter: comma, semicolon, or tab
    if (firstLine.includes(";")) {
      delimiter = ";";
    } else if (firstLine.includes("\t")) {
      delimiter = "\t";
    }

    const firstLineParts = firstLine.split(delimiter).map(p => p.trim());
    const tempNameIdx = firstLineParts.indexOf("name");
    const tempUnitIdx = firstLineParts.indexOf("unit");

    if (tempNameIdx !== -1 && tempUnitIdx !== -1) {
      hasHeader = true;
      nameIdx = tempNameIdx;
      unitIdx = tempUnitIdx;
    }

    const linesToParse = hasHeader ? lines.slice(1) : lines;

    return linesToParse
      .map((line) => {
        const cols = line.split(delimiter);
        const name = cols[nameIdx]?.trim();
        const unit = cols[unitIdx]?.trim();
        return { name, unit };
      })
      .filter((r) => r.name && r.unit);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg("Importing...");

    try {
      const text = await file.text();
      const rows = parseImportText(text, importTargetUnit);
      if (rows.length === 0) {
        setImportMsg(
          importTargetUnit === "detect"
            ? "No valid rows found. Format should contain 'name' and 'unit' values."
            : "No valid rows found."
        );
        return;
      }

      const res = await fetch("/api/admin/workers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      setImportMsg(res.ok ? `Imported ${data.imported} workers.` : data.error ?? "Import failed.");
      setPage(1);
      load();
      loadUnits();
    } catch (err) {
      setImportMsg("Failed to read file.");
    }
    e.target.value = "";
  }

  async function handleTextPasteImport() {
    if (!pasteText.trim()) return;
    setImportMsg("Importing...");

    const rows = parseImportText(pasteText, importTargetUnit);
    if (rows.length === 0) {
      setImportMsg(
        importTargetUnit === "detect"
          ? "No valid rows found. Format should be: Name, Unit (one per line)."
          : "No valid names found."
      );
      return;
    }

    try {
      const res = await fetch("/api/admin/workers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      setImportMsg(res.ok ? `Imported ${data.imported} workers.` : data.error ?? "Import failed.");
      setPasteText("");
      setPage(1);
      load();
      loadUnits();
    } catch (err) {
      setImportMsg("Failed to import pasted text.");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminShell>
      <header className="sticky top-14 md:top-0 z-40 bg-white border-b px-4 md:px-10 py-4 md:h-16 md:flex md:items-center">
        {activeTab === "workers" ? (
          <div className="relative w-full md:max-w-2xl">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-surface-container-low border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
              placeholder="Search PRIESTS OF GOD GENERATION..."
            />
          </div>
        ) : (
          <h1 className="text-xl md:text-2xl font-bold text-primary">Unit Directory</h1>
        )}
      </header>

      <main className="flex-grow p-4 md:p-10 max-w-container-max mx-auto w-full">
        {/* Tab Selector */}
        <div className="flex border-b border-outline-variant mb-6">
          <button
            onClick={() => setActiveTab("workers")}
            className={`px-6 py-2.5 text-sm font-semibold border-b-2 transition-all select-none min-h-[44px] ${
              activeTab === "workers"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Workers Roster
          </button>
          <button
            onClick={() => setActiveTab("units")}
            className={`px-6 py-2.5 text-sm font-semibold border-b-2 transition-all select-none min-h-[44px] ${
              activeTab === "units"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Unit Directory
          </button>
        </div>

        {activeTab === "workers" ? (
          <>
            <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-3">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-primary">Worker Roster Management</h2>
                <p className="text-on-surface-variant mt-1 text-sm md:text-base">
                  Pre-populate and map workers to their respective units.
                </p>
              </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-primary text-white px-4 py-2 rounded shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">person_add</span>
            <span className="text-sm uppercase tracking-wide">Add New Worker</span>
          </button>
        </div>

        {showAdd && (
          <form
            onSubmit={editingWorker ? handleSaveEditWorker : handleAddWorker}
            className="bg-white border p-5 mb-4 flex flex-wrap items-end gap-4 shadow-sm rounded-xl max-w-3xl"
          >
            <div className="flex-grow min-w-[180px]">
              <label className="text-xs text-on-surface-variant font-semibold uppercase">Name</label>
              <input
                value={editingWorker ? editWorkerName : newName}
                onChange={(e) => editingWorker ? setEditWorkerName(e.target.value) : setNewName(e.target.value)}
                className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-secondary mt-1 bg-surface-container-low min-h-[38px]"
                placeholder="Full name"
                required
              />
            </div>
            <div className="flex-grow min-w-[150px]">
              <label className="text-xs text-on-surface-variant font-semibold uppercase">Unit</label>
              <input
                type="text"
                list="units-list"
                value={editingWorker ? editWorkerUnit : newUnit}
                onChange={(e) => editingWorker ? setEditWorkerUnit(e.target.value) : setNewUnit(e.target.value)}
                className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-secondary mt-1 bg-surface-container-low min-h-[38px]"
                placeholder="e.g. Choir"
                required
              />
              <datalist id="units-list">
                {dynamicUnits.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
            {editingWorker && (
              <div>
                <label className="text-xs text-on-surface-variant font-semibold uppercase">Status</label>
                <select
                  value={editWorkerStatus}
                  onChange={(e) => setEditWorkerStatus(e.target.value as "VERIFIED" | "PENDING")}
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-secondary mt-1 bg-surface-container-low min-h-[38px] cursor-pointer"
                >
                  <option value="PENDING">Pending</option>
                  <option value="VERIFIED">Verified</option>
                </select>
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-primary text-white font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 min-h-[38px] cursor-pointer select-none"
              >
                {editingWorker ? "Update Worker" : "Save Worker"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setEditingWorker(null);
                  setNewName("");
                  setNewUnit("");
                }}
                className="px-4 py-2 border border-outline-variant text-on-surface font-semibold rounded-lg text-sm hover:bg-surface-container-low min-h-[38px] cursor-pointer select-none"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="bg-white border p-4 mb-4 flex flex-wrap items-center gap-3 md:gap-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant uppercase">Filter by:</span>
            <select
              value={unit}
              onChange={(e) => {
                setUnit(e.target.value);
                setPage(1);
              }}
              className="border py-2 px-3 text-sm cursor-pointer"
            >
              <option value="All Units">All Units</option>
              {dynamicUnits.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white border overflow-x-auto">
          <table className="w-full min-w-[520px] text-left border-collapse">
            <thead>
              <tr className="bg-[#F3F4F6] border-b">
                <th className="p-4 text-xs uppercase tracking-wider">Worker Name</th>
                <th className="p-4 text-xs uppercase tracking-wider">Unit Mapping</th>
                <th className="p-4 text-xs uppercase tracking-wider text-center">Status</th>
                <th className="p-4 text-xs uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-on-surface-variant">
                    Loading...
                  </td>
                </tr>
              ) : workers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-on-surface-variant">
                    No workers found.
                  </td>
                </tr>
              ) : (
                workers.map((w) => (
                  <tr key={w.id} className="hover:bg-surface-container-low transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xs">
                          {initials(w.name)}
                        </div>
                        <div className="font-semibold text-sm">{w.name}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-block bg-[#6B21A8] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                        {w.unit}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase border ${w.status === "VERIFIED"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-orange-100 text-orange-800 border-orange-200"
                          }`}
                      >
                        {w.status === "VERIFIED" ? "Verified" : "Pending"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1.5 justify-center">
                        <button
                          onClick={() => {
                            setEditingWorker(w);
                            setEditWorkerName(w.name);
                            setEditWorkerUnit(w.unit);
                            setEditWorkerStatus(w.status);
                            setShowAdd(true);
                          }}
                          title="Edit Worker"
                          className="inline-flex w-9 h-9 rounded-full border border-gray-100 items-center justify-center text-outline hover:text-primary hover:bg-surface-container-low transition-colors select-none min-h-[36px] cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => triggerDeleteWorker(w)}
                          title="Delete Worker"
                          className="inline-flex w-9 h-9 rounded-full border border-gray-100 items-center justify-center text-outline hover:text-error hover:bg-rose-50 transition-colors select-none min-h-[36px] cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="p-4 border-t flex justify-between items-center bg-white">
            <span className="text-xs text-on-surface-variant">
              Showing {workers.length} of {total} workers
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 border text-xs disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 border bg-primary text-white text-xs">{page}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 border text-xs disabled:opacity-50 hover:bg-surface-container-low"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Card View (hidden on desktop) */}
        <div className="md:hidden space-y-4">
          <div className="divide-y divide-gray-100 bg-white border rounded-xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-6 text-center text-on-surface-variant">Loading...</div>
            ) : workers.length === 0 ? (
              <div className="p-6 text-center text-on-surface-variant">No workers found.</div>
            ) : (
              workers.map((w) => (
                <div key={w.id} className="p-4 flex flex-col gap-3 hover:bg-surface-container-low transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xs shrink-0">
                        {initials(w.name)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-on-surface">{w.name}</div>
                        <span className="inline-block bg-[#6B21A8]/10 text-[#6B21A8] border border-[#6B21A8]/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase mt-1">
                          {w.unit}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase border ${
                          w.status === "VERIFIED"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-orange-100 text-orange-800 border-orange-200"
                        }`}
                      >
                        {w.status === "VERIFIED" ? "Verified" : "Pending"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Card Actions */}
                  <div className="flex items-center justify-end gap-2 border-t pt-2 mt-1">
                    <button
                      onClick={() => {
                        setEditingWorker(w);
                        setEditWorkerName(w.name);
                        setEditWorkerUnit(w.unit);
                        setEditWorkerStatus(w.status);
                        setShowAdd(true);
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-outline hover:text-primary px-3 py-1.5 border rounded-lg hover:bg-surface-container-low transition-colors select-none min-h-[32px] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Edit
                    </button>
                    <button
                      onClick={() => triggerDeleteWorker(w)}
                      className="flex items-center gap-1 text-xs font-semibold text-outline hover:text-error px-3 py-1.5 border hover:bg-rose-50 hover:border-rose-100 rounded-lg transition-colors select-none min-h-[32px] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Mobile Pagination */}
          <div className="p-4 border bg-white rounded-xl flex justify-between items-center shadow-sm">
            <span className="text-xs text-on-surface-variant">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 border text-xs disabled:opacity-50 hover:bg-surface-container-low min-h-[32px] rounded-lg font-semibold"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 border text-xs disabled:opacity-50 hover:bg-surface-container-low min-h-[32px] rounded-lg font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Import settings dropdown */}
        <div className="bg-white border rounded-xl p-4 mt-8 mb-6 shadow-sm max-w-3xl flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-outline">tune</span>
            <span className="text-xs uppercase tracking-wider font-bold text-on-surface-variant">Import Configuration</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-on-surface-variant">Assign Unit:</span>
            <select
              value={importTargetUnit}
              onChange={(e) => setImportTargetUnit(e.target.value)}
              className="border border-outline-variant bg-surface-container-lowest rounded-lg py-1 pl-3 pr-8 text-xs font-semibold text-on-surface cursor-pointer focus:outline-none focus:ring-1 focus:ring-secondary"
            >
              <option value="detect">Detect from file / text (Name, Unit)</option>
              {dynamicUnits.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* File Upload Section */}
          <div className="bg-[#F9FAFB] border-2 border-dashed rounded-xl p-6 text-center hover:border-secondary transition-all flex flex-col justify-between">
            <div>
              <span className="material-symbols-outlined text-4xl text-outline mb-3">cloud_upload</span>
              <h3 className="font-semibold text-lg text-primary mb-1">Upload Worker Roster File</h3>
              <p className="text-xs text-on-surface-variant mb-6">
                {importTargetUnit === "detect" ? (
                  <>Bulk import workers with a <code>.csv</code> or <code>.txt</code> file containing name and unit columns.</>
                ) : (
                  <>Bulk import workers from a list of names. All will be mapped to <strong>{importTargetUnit}</strong>.</>
                )}
              </p>
            </div>
            <div>
              <label className="bg-primary text-white font-bold py-2.5 px-5 rounded-full shadow-sm hover:opacity-90 cursor-pointer inline-block text-sm select-none">
                Select File (.csv, .txt)
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Copy-Paste Text Area Section */}
          <div className="bg-[#F9FAFB] border-2 border-dashed rounded-xl p-6 hover:border-secondary transition-all flex flex-col justify-between">
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl text-outline mb-3">assignment</span>
              <h3 className="font-semibold text-lg text-primary mb-1">Paste Raw Worker List</h3>
              <p className="text-xs text-on-surface-variant mb-3">
                {importTargetUnit === "detect" ? (
                  <>Paste list below. Each line should contain <strong>Name, Unit</strong> (e.g. <code>John Doe, Choir</code>).</>
                ) : (
                  <>Paste list of <strong>Names only</strong> (one per line). All will be assigned to <strong>{importTargetUnit}</strong>.</>
                )}
              </p>
            </div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="w-full h-24 border rounded p-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-secondary mb-3 resize-none bg-white"
              placeholder={
                importTargetUnit === "detect"
                  ? "Sister Rebecca, Choir\nBro. Joseph, Media & Tech"
                  : "Sister Rebecca\nBro. Joseph"
              }
            />
            <div className="text-center">
              <button
                onClick={handleTextPasteImport}
                disabled={!pasteText.trim()}
                className="bg-primary text-white font-bold py-2 px-5 rounded shadow-sm hover:opacity-90 disabled:opacity-50 text-sm w-full md:w-auto cursor-pointer"
              >
                Import Pasted List
              </button>
            </div>
          </div>
        </div>

        {importMsg && (
          <div className="mt-4 p-3 bg-surface border rounded text-sm text-center text-on-surface-variant font-medium">
            {importMsg}
          </div>
        )}
      </>
    ) : (
      <>
        {/* Inline Add/Edit Unit Form */}
        <form onSubmit={editingUnit ? handleEditUnit : handleAddUnit} className="bg-white border rounded-xl p-5 mb-6 shadow-sm max-w-3xl w-full">
          <h3 className="text-xs uppercase tracking-wider font-bold text-on-surface-variant mb-2">
            {editingUnit ? `Edit Unit: ${editingUnit.name}` : "Add New Unit"}
          </h3>
          {unitSaveError && <p className="text-xs text-error mb-2">{unitSaveError}</p>}
          <div className="flex items-center gap-2 max-w-2xl w-full">
            <input
              value={newUnitName}
              onChange={(e) => {
                setNewUnitName(e.target.value);
                setUnitSaveError(null);
              }}
              className="flex-grow bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary min-h-[40px]"
              placeholder="e.g. Drama Unit"
              required
            />
            <button
              type="submit"
              disabled={unitSaving}
              className="bg-primary text-white font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50 transition-all min-h-[40px] flex items-center justify-center gap-1.5 shrink-0 select-none cursor-pointer"
            >
              {unitSaving && <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>}
              {editingUnit ? "Update Unit" : "Save Unit"}
            </button>
            {editingUnit && (
              <button
                type="button"
                onClick={() => {
                  setEditingUnit(null);
                  setNewUnitName("");
                  setUnitSaveError(null);
                }}
                className="bg-white border border-outline-variant text-on-surface font-semibold px-4 py-2 rounded-lg text-sm hover:bg-surface-container-low transition-all min-h-[40px] select-none cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Desktop Units Table View */}
        <div className="hidden md:block bg-white border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-[#F3F4F6] border-b text-on-surface font-semibold text-xs uppercase tracking-wider">
                <th className="p-4 w-[60%]">Unit Name</th>
                <th className="p-4 w-[25%]">Created At</th>
                <th className="p-4 w-[15%] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-body-md">
              {adminUnitsLoading ? (
                <tr>
                  <td colSpan={3} className="p-10 text-center text-on-surface-variant">
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                      Loading units...
                    </div>
                  </td>
                </tr>
              ) : adminUnits.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-10 text-center text-on-surface-variant">
                    No units registered. Add a unit above to get started.
                  </td>
                </tr>
              ) : (
                adminUnits.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container-low transition-all">
                    <td className="p-4 font-semibold text-sm text-on-surface">
                      {u.name}
                    </td>
                    <td className="p-4 text-xs text-on-surface-variant">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1.5 justify-center">
                        <button
                          onClick={() => {
                            setEditingUnit({ id: u.id, name: u.name });
                            setNewUnitName(u.name);
                            setUnitSaveError(null);
                          }}
                          title="Edit Unit"
                          className="inline-flex w-9 h-9 rounded-full border border-gray-100 items-center justify-center text-outline hover:text-primary hover:bg-surface-container-low transition-colors select-none min-h-[36px] cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => triggerDeleteUnit(u.id, u.name)}
                          title="Delete Unit"
                          className="inline-flex w-9 h-9 rounded-full border border-gray-100 items-center justify-center text-outline hover:text-error hover:bg-rose-50 transition-colors select-none min-h-[36px] cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Units Card View (hidden on desktop) */}
        <div className="md:hidden divide-y divide-gray-100 bg-white border rounded-xl overflow-hidden shadow-sm">
          {adminUnitsLoading ? (
            <div className="p-6 text-center text-on-surface-variant flex items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin text-primary">sync</span>
              Loading units...
            </div>
          ) : adminUnits.length === 0 ? (
            <div className="p-6 text-center text-on-surface-variant">
              No units registered. Add a unit above to get started.
            </div>
          ) : (
            adminUnits.map((u) => (
              <div key={u.id} className="p-4 flex flex-col gap-3 hover:bg-surface-container-low transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-on-surface">{u.name}</div>
                    <div className="text-[10px] text-on-surface-variant mt-1">
                      Created: {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 border-t pt-2 mt-1">
                  <button
                    onClick={() => {
                      setEditingUnit({ id: u.id, name: u.name });
                      setNewUnitName(u.name);
                      setUnitSaveError(null);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-outline hover:text-primary px-3 py-1.5 border rounded-lg hover:bg-surface-container-low transition-colors select-none min-h-[32px] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Edit
                  </button>
                  <button
                    onClick={() => triggerDeleteUnit(u.id, u.name)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#B91C1C] px-3 py-1.5 border border-red-100 hover:bg-rose-50 hover:border-rose-100 rounded-lg transition-colors select-none min-h-[32px] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </>
    )}
      </main>

      {/* Custom Unit Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModalOpen}
        title="Delete Fellowship Unit"
        message={unitToDelete ? `Are you sure you want to delete the unit "${unitToDelete.name}"?\n\nThis won't delete workers, but they will no longer be mapped to this unit.` : ""}
        confirmLabel="Delete Unit"
        isDanger
        onConfirm={handleDeleteUnitConfirm}
        onCancel={() => {
          setConfirmModalOpen(false);
          setUnitToDelete(null);
        }}
      />

      {/* Custom Worker Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmWorkerDeleteOpen}
        title="Delete Worker"
        message={workerToDelete ? `Are you sure you want to delete worker "${workerToDelete.name}" from the roster?\n\nThis will remove them from verification lists.` : ""}
        confirmLabel="Delete Worker"
        isDanger
        onConfirm={handleDeleteWorkerConfirm}
        onCancel={() => {
          setConfirmWorkerDeleteOpen(false);
          setWorkerToDelete(null);
        }}
      />
    </AdminShell>
  );
}
