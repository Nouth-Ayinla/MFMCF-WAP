"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Nominee = { id: string; name: string };
type Category = { id: string; title: string; description: string; nominees: Nominee[] };

function getInitials(name: string) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function VotePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/");
          return;
        }
        const data = await res.json();
        setCategories(data.categories ?? []);
        setSelections(data.votedMap ?? {});
      })
      .finally(() => setLoading(false));
  }, [router]);

  function selectNominee(categoryId: string, nomineeId: string) {
    setSelections((prev) => ({ ...prev, [categoryId]: nomineeId }));
  }

  async function handleSubmit() {
    setError(null);
    if (Object.keys(selections).length < categories.length) {
      setError("Please make a selection in every category before submitting.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selections }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Could not submit votes.");
      return;
    }
    const params = new URLSearchParams({ name: data.name ?? "", unit: data.unit ?? "" });
    router.push(`/success?${params.toString()}`);
  }

  if (loading) {
    return <div className="pt-32 text-center text-on-surface-variant">Loading ballot...</div>;
  }

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-surface border-b border-outline-variant shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between px-container-margin h-16">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>
            stars
          </span>
          <span className="font-display text-headline-md text-primary">MFMCF FUTA WAP</span>
        </div>
      </header>

      <main className="pt-24 pb-24 px-container-margin min-h-screen max-w-3xl lg:max-w-5xl mx-auto space-y-gutter">
        <div className="text-center md:text-left mb-8 border-b border-outline-variant pb-6">
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
            Cast Your Votes
          </h1>
          <p className="text-on-surface-variant font-body-md">
            Please make a selection in each category below to complete your ballot.
          </p>
        </div>

        {categories.map((category) => (
          <section
            key={category.id}
            className="bg-white border-2 border-outline-variant/60 rounded-2xl p-card-padding mb-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>
                workspace_premium
              </span>
              <h2 className="font-headline-md text-headline-md text-primary">{category.title}</h2>
            </div>
            <p className="text-on-surface-variant mb-6 font-body-md border-b border-outline-variant/30 pb-4">{category.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.nominees.map((nominee) => {
                const selected = selections[category.id] === nominee.id;
                const initials = getInitials(nominee.name);
                return (
                  <div
                    key={nominee.id}
                    onClick={() => selectNominee(category.id, nominee.id)}
                    className={`group cursor-pointer flex items-center gap-3 p-4 bg-white rounded-xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${selected
                        ? "border-primary shadow-[4px_4px_0px_0px_rgba(107,33,168,1)]"
                        : "border-outline-variant hover:border-primary hover:shadow-[4px_4px_0px_0px_rgba(107,33,168,0.3)]"
                      }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "border-primary bg-primary" : "border-outline-variant group-hover:border-primary"
                        }`}
                    >
                      {selected && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                    </div>

                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                      selected ? "bg-primary text-white" : "bg-primary-fixed text-primary-container"
                    }`}>
                      {initials}
                    </div>

                    <span className="font-label-bold text-body-md text-on-surface flex-grow break-words line-clamp-2">{nominee.name}</span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {error && <p className="text-[#DC2626] font-label-md text-label-md text-center mb-4">{error}</p>}

        <div className="pt-8 max-w-xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-black text-white py-4 px-8 rounded-full font-label-bold text-body-lg hover:bg-[#6B21A8] transition-all shadow-[0px_4px_0px_0px_rgba(107,33,168,1)] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Review & Submit Votes ✨"}
          </button>
        </div>
      </main>
    </>
  );
}
