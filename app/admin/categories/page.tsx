"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import ConfirmationModal from "@/components/admin/ConfirmationModal";

type Nominee = {
  id: string;
  name: string;
  categoryId: string;
  _count?: {
    votes: number;
  };
};

type Category = {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  unit: string;
  nominees: Nominee[];
};

export default function CategoryManagementPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(0);
  const [nominees, setNominees] = useState<{ id?: string; name: string }[]>([{ name: "" }]);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [categoryUnit, setCategoryUnit] = useState("All Units");
  const [units, setUnits] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load categories");
      }
      const data = await res.json();
      setCategories(data.categories ?? []);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to fetch categories.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
    // Load registered units for dropdown options
    fetch("/api/admin/units")
      .then((r) => r.json())
      .then((data) => {
        if (data.units && Array.isArray(data.units)) {
          setUnits(data.units.map((u: any) => u.name));
        }
      })
      .catch((err) => console.error("Failed to load units:", err));
  }, [load]);

  const openAddDrawer = () => {
    setEditingCategory(null);
    setTitle("");
    setDescription("");
    setOrder(categories.length > 0 ? Math.max(...categories.map((c) => c.order)) + 1 : 1);
    setNominees([{ name: "" }]);
    setCategoryUnit("All Units");
    setFormError(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (category: Category) => {
    setEditingCategory(category);
    setTitle(category.title);
    setDescription(category.description);
    setOrder(category.order);
    // Pre-fill nominees mapping
    setNominees(category.nominees.map((n) => ({ id: n.id, name: n.name })));
    setCategoryUnit(category.unit || "All Units");
    setFormError(null);
    setDrawerOpen(true);
  };

  const addNomineeField = () => {
    setNominees([...nominees, { name: "" }]);
  };

  const removeNomineeField = (index: number) => {
    if (nominees.length <= 1) {
      setFormError("A category must have at least one nominee.");
      return;
    }
    setNominees(nominees.filter((_, idx) => idx !== index));
  };

  const updateNomineeField = (index: number, val: string) => {
    // Check if the pasted value contains commas or newlines
    if (val.includes(",") || val.includes("\n")) {
      const parts = val.split(/[,\n]/).map((p) => p.trim()).filter(Boolean);
      if (parts.length > 1) {
        const updated = [...nominees];
        // Replace the current field with the first part
        updated[index] = { ...updated[index], name: parts[0] };
        // Create new fields for the rest of the parts
        const newNominees = parts.slice(1).map((name) => ({ name }));
        // Insert them immediately after the current index
        updated.splice(index + 1, 0, ...newNominees);
        setNominees(updated);
        setFormError(null);
        return;
      }
    }

    const updated = [...nominees];
    updated[index].name = val;
    setNominees(updated);
    setFormError(null);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic Validations
    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!description.trim()) {
      setFormError("Description is required.");
      return;
    }
    const activeNominees = nominees.map((n) => n.name.trim()).filter(Boolean);
    if (activeNominees.length === 0) {
      setFormError("At least one nominee name is required.");
      return;
    }

    setFormSaving(true);
    try {
      if (editingCategory) {
        // PATCH update
        const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            order,
            unit: categoryUnit,
            nominees: nominees.filter((n) => n.name.trim()),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to update category");
      } else {
        // POST create
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            order,
            unit: categoryUnit,
            nominees: activeNominees,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to create category");
      }
      setDrawerOpen(false);
      load();
    } catch (err: any) {
      setFormError(err.message ?? "Something went wrong while saving.");
    } finally {
      setFormSaving(false);
    }
  };

  const triggerDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setConfirmModalOpen(true);
  };

  const handleDeleteCategoryConfirm = async () => {
    if (!categoryToDelete) return;
    try {
      const res = await fetch(`/api/admin/categories/${categoryToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to delete category");
      }
      load();
    } catch (err: any) {
      alert(err.message ?? "Failed to delete category.");
    } finally {
      setConfirmModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <AdminShell>
      {/* Header */}
      <header className="sticky top-14 md:top-0 z-40 bg-white border-b px-4 md:px-10 py-4 md:h-16 flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-primary">Category Management</h1>
        <button
          onClick={openAddDrawer}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 min-h-[40px] select-none"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Add Category
        </button>
      </header>

      <main className="flex-grow p-4 md:p-10 max-w-container-max mx-auto w-full">
        <div className="mb-6">
          <p className="text-on-surface-variant text-sm md:text-base">
            Create and edit election categories, assign nominees, and monitor real-time vote distribution.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2">
            <span className="material-symbols-outlined animate-spin text-primary">sync</span>
            <span className="text-on-surface-variant font-medium">Loading categories...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white border rounded-2xl p-10 text-center shadow-sm">
            <span className="material-symbols-outlined text-4xl text-outline mb-3">category</span>
            <h3 className="font-semibold text-lg text-on-surface mb-1">No Categories</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Create your first voting category to get the election started.
            </p>
            <button
              onClick={openAddDrawer}
              className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Add Category
            </button>
          </div>
        ) : (
          /* Responsive Categories List */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {categories.map((cat) => {
              const totalCatVotes = cat.nominees.reduce((sum, n) => sum + (n._count?.votes ?? 0), 0);

              return (
                <div
                  key={cat.id}
                  className="bg-white border border-outline-variant rounded-2xl p-5 md:p-6 shadow-sm flex flex-col justify-between hover:border-outline transition-colors"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="bg-primary-fixed text-primary-container text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Order {cat.order}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                            cat.unit === "All Units" || !cat.unit
                              ? "bg-gray-100 text-gray-700 border-gray-200"
                              : "bg-[#6B21A8]/10 text-[#6B21A8] border-[#6B21A8]/20"
                          }`}>
                            {cat.unit || "All Units"}
                          </span>
                          <span className="text-xs font-mono text-outline">{cat.slug}</span>
                        </div>
                        <h2 className="text-lg font-bold text-on-surface leading-snug">{cat.title}</h2>
                      </div>

                      {/* Action buttons (desktop only) */}
                      <div className="hidden md:flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditDrawer(cat)}
                          title="Edit Category"
                          className="w-9 h-9 rounded-full border border-gray-100 flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container-low transition-colors select-none min-h-[36px] cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => triggerDeleteCategory(cat)}
                          title="Delete Category"
                          className="w-9 h-9 rounded-full border border-gray-100 flex items-center justify-center text-outline hover:text-error hover:bg-rose-50 transition-colors select-none min-h-[36px] cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                      {cat.description}
                    </p>

                    {/* Nominees Standings */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs uppercase tracking-wider text-outline font-bold">
                        <span>Nominee Standings</span>
                        <span>{totalCatVotes} Votes Cast</span>
                      </div>
                      <div className="space-y-3.5">
                        {cat.nominees.map((nom) => {
                          const votes = nom._count?.votes ?? 0;
                          const percent = totalCatVotes > 0 ? (votes / totalCatVotes) * 100 : 0;

                          return (
                            <div key={nom.id}>
                              <div className="flex justify-between items-baseline mb-1">
                                <span className="font-semibold text-sm truncate pr-2 text-on-surface">
                                  {nom.name}
                                </span>
                                <span className="text-xs font-bold text-on-surface-variant">
                                  {votes} votes ({percent.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-surface-container-low overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action buttons (mobile only) */}
                    <div className="md:hidden flex items-center justify-end gap-2 border-t pt-4 mt-6">
                      <button
                        onClick={() => openEditDrawer(cat)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 border rounded-full text-xs font-bold text-outline hover:text-primary hover:bg-surface-container-low transition-all cursor-pointer select-none min-h-[34px]"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        Edit Category
                      </button>
                      <button
                        onClick={() => triggerDeleteCategory(cat)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 border border-rose-100 rounded-full text-xs font-bold text-[#B91C1C] hover:text-error hover:bg-rose-50 hover:border-rose-200 transition-all cursor-pointer select-none min-h-[34px]"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Form Drawer Overlay (Add / Edit Form Drawer) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] flex overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Slider Drawer Panel / Bottom Sheet */}
          <div className="relative w-full md:w-screen md:max-w-md h-[85vh] md:h-full bg-white shadow-2xl flex flex-col justify-between rounded-t-2xl md:rounded-t-none mt-auto md:mt-0 animate-in slide-in-from-bottom md:slide-in-from-right duration-200 md:ml-auto">
            {/* Header */}
            <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between rounded-t-2xl md:rounded-t-none">
              <h2 className="text-lg font-bold text-primary">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-outline hover:text-on-surface transition-colors p-1"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Form Scroll Body */}
            <form
              onSubmit={handleSaveCategory}
              className="flex-grow overflow-y-auto px-6 py-5 space-y-6"
            >
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider font-bold text-on-surface-variant">
                  Category Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="e.g. Most Dedicated Leader"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider font-bold text-on-surface-variant">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-24 bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                  placeholder="Describe the category requirements or scope..."
                  required
                />
              </div>

              {/* Order */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider font-bold text-on-surface-variant">
                  Display Order
                </label>
                <input
                  type="number"
                  min={0}
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  required
                />
                <p className="text-[11px] text-outline">
                  Lower numbers appear first on the ballot overview list.
                </p>
              </div>

              {/* Unit Mapping */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider font-bold text-on-surface-variant">
                  Unit Mapping
                </label>
                <select
                  value={categoryUnit}
                  onChange={(e) => setCategoryUnit(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                  required
                >
                  <option value="All Units">All Units (Global Category)</option>
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-outline">
                  Map this category to a specific unit, or select &quot;All Units&quot; to make it visible to everyone.
                </p>
              </div>

              {/* Nominees list */}
              <div className="space-y-3.5 border-t pt-5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs uppercase tracking-wider font-bold text-on-surface-variant">
                    Nominees
                  </label>
                  <button
                    type="button"
                    onClick={addNomineeField}
                    className="text-xs text-primary font-bold hover:opacity-80 inline-flex items-center gap-1 min-h-[32px] select-none"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Add Nominee
                  </button>
                </div>

                <div className="space-y-3">
                  {nominees.map((nom, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-grow relative">
                        <input
                          value={nom.name}
                          onChange={(e) => updateNomineeField(index, e.target.value)}
                          className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-sm pr-12 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                          placeholder={`Nominee #${index + 1} name`}
                          required
                        />
                        {nom.id && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-50 text-green-700 text-[8px] font-extrabold tracking-wider border border-green-200 uppercase px-1.5 py-0.5 rounded">
                            Saved
                          </span>
                        )}
                      </div>

                      {/* Delete target button */}
                      <button
                        type="button"
                        onClick={() => removeNomineeField(index)}
                        disabled={nominees.length <= 1}
                        className="w-10 h-10 border border-gray-100 flex items-center justify-center text-outline hover:text-error hover:bg-rose-50 rounded-lg disabled:opacity-30 disabled:hover:bg-white select-none shrink-0 min-h-[40px]"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </form>

            {/* Sticky Actions Footer */}
            <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-lowest flex items-center gap-3 rounded-b-2xl md:rounded-b-none pb-safe">
              <button
                type="submit"
                disabled={formSaving}
                onClick={handleSaveCategory}
                className="flex-grow flex-1 bg-black text-white font-bold py-3 px-4 rounded-xl text-sm hover:bg-[#6B21A8] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-h-[44px] shadow-sm cursor-pointer"
              >
                {formSaving && <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>}
                {editingCategory ? "Save Changes" : "Create Category"}
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex-1 border border-outline-variant text-on-surface font-semibold py-3 px-4 rounded-xl text-sm hover:bg-surface-container-low transition-all min-h-[44px] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Category Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModalOpen}
        title="Delete Category"
        message={
          categoryToDelete
            ? `WARNING: Are you sure you want to delete category "${categoryToDelete.title}"?\n\nThis will permanently delete this category, all of its nominees, and all ${categoryToDelete.nominees.reduce(
                (sum, n) => sum + (n._count?.votes ?? 0),
                0
              )} votes cast for them.\n\nTHIS ACTION CANNOT BE UNDONE.`
            : ""
        }
        confirmLabel="Delete Category"
        isDanger
        onConfirm={handleDeleteCategoryConfirm}
        onCancel={() => {
          setConfirmModalOpen(false);
          setCategoryToDelete(null);
        }}
      />
    </AdminShell>
  );
}
