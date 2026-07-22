"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Nominee = { id: string; name: string };
type Category = { id: string; title: string; description: string; nominees: Nominee[] };

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

      <div className="fixed top-16 left-0 w-full bg-white z-40 px-container-margin py-4 border-b border-outline-variant">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface">
            Cast Your Votes
          </h1>
        </div>
      </div>

      <main className="pt-48 pb-32 px-container-margin min-h-screen max-w-3xl mx-auto space-y-gutter">
        {categories.map((category) => (
          <section
            key={category.id}
            className="bg-[#F9FAFB] border border-[#E9D5FF] rounded-xl p-card-padding mb-4"
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>
                workspace_premium
              </span>
              <h2 className="font-headline-md text-headline-md">{category.title}</h2>
            </div>
            <p className="text-on-surface-variant mb-8 font-body-md">{category.description}</p>

            <div className="flex flex-col gap-3">
              {category.nominees.map((nominee) => {
                const selected = selections[category.id] === nominee.id;
                return (
                  <div
                    key={nominee.id}
                    onClick={() => selectNominee(category.id, nominee.id)}
                    className={`group cursor-pointer flex items-center justify-between p-4 bg-white rounded-xl border transition-all ${selected
                        ? "border-primary shadow-[4px_4px_0px_0px_rgba(107,33,168,1)]"
                        : "border-outline-variant hover:shadow-[4px_4px_0px_0px_rgba(107,33,168,1)]"
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selected ? "border-primary bg-primary" : "border-outline-variant"
                          }`}
                      >
                        {selected && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                      </div>
                      <span className="font-label-bold text-body-lg text-on-surface">{nominee.name}</span>
                    </div>
                    {selected && (
                      <span
                        className="material-symbols-outlined text-primary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {error && <p className="text-[#DC2626] font-label-md text-label-md text-center">{error}</p>}
      </main>

      <footer className="fixed bottom-0 left-0 w-full bg-white border-t border-outline-variant p-container-margin z-50">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-black text-white py-4 px-8 rounded-full font-label-bold text-body-lg hover:bg-neutral-800 transition-all shadow-[0px_4px_0px_0px_rgba(107,33,168,1)] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Review & Submit Votes ✨"}
          </button>
        </div>
      </footer>
    </>
  );
}
