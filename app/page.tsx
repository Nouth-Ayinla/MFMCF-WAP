"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const FALLBACK_UNITS = ["Ushering", "Media & Tech", "Choir", "Sanctuary", "Prayer"];

export default function VerifyPage() {
  const router = useRouter();
  const [units, setUnits] = useState<string[]>([]);
  const [unit, setUnit] = useState("");
  const [name, setName] = useState("");
  const [unitError, setUnitError] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    fetch("/api/verify/units")
      .then((res) => res.json())
      .then((data) => {
        if (data.units && data.units.length > 0) {
          setUnits(data.units);
        } else {
          setUnits(FALLBACK_UNITS);
        }
      })
      .catch((err) => {
        console.error(err);
        setUnits(FALLBACK_UNITS);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!unit) {
      setUnitError(true);
      return;
    }
    setUnitError(false);

    if (name.trim() === "") {
      setSubmitError("Please enter your name to proceed.");
      return;
    }

    setStatus("loading");
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, unit }),
    });
    const data = await res.json();

    if (!res.ok) {
      setSubmitError(data.error ?? "Something went wrong.");
      setStatus("idle");
      return;
    }

    setStatus("done");
    router.push("/vote");
  }

  return (
    <>
      <header className="fixed top-0 w-full bg-surface border-b border-outline-variant shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between px-container-margin h-16 z-50">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            stars
          </span>
          <span className="font-display text-headline-md text-primary">MFMCF FUTA WAP</span>
        </div>
      </header>

      <main className="flex-grow pt-24 pb-32 px-container-margin max-w-2xl mx-auto w-full">
        <section className="mb-section-gap text-center">
          <div className="inline-flex items-center justify-center bg-primary-fixed p-3 rounded-full mb-4">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              celebration
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-2 text-on-surface">
            MFMCF FUTA
          </h1>
          <h2 className="font-headline-md text-primary-container">Worker&apos;s Appreciation 2026</h2>
        </section>

        <div className="bg-[#F9FAFB] border border-[#E9D5FF] rounded-xl p-card-padding mb-8">
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Thank you for your service and dedication! GOD BLESS YOU .
          </p>
        </div>

        <div className="bg-white border-2 border-primary-fixed rounded-2xl p-card-padding shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block font-label-bold text-label-bold text-on-surface uppercase" htmlFor="unit-select">
                Select Your Unit
              </label>
              <div className="relative">
                <select
                  id="unit-select"
                  value={unit}
                  onChange={(e) => {
                    setUnit(e.target.value);
                    setUnitError(false);
                  }}
                  className={`w-full bg-surface-container-low border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-container focus:border-primary-container appearance-none font-body-md text-on-surface cursor-pointer ${unitError ? "border-[#DC2626]" : "border-outline"
                    }`}
                >
                  <option disabled value="">
                    Choose your unit...
                  </option>
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                  expand_more
                </span>
              </div>
              {unitError && (
                <p className="text-[#DC2626] font-label-md text-label-md">
                  * Please select your unit before entering your name
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block font-label-bold text-label-bold text-on-surface uppercase" htmlFor="name-input">
                Your Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-surface-container-low border border-outline rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-container focus:border-primary-container font-body-md text-on-surface transition-all outline-none"
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  person
                </span>
              </div>
            </div>

            {submitError && <p className="text-[#DC2626] font-label-md text-label-md">{submitError}</p>}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-black text-white py-4 rounded-full font-headline-md hover:bg-zinc-800 transition-all active:scale-95 hard-shadow flex items-center justify-center gap-2 group mt-8 disabled:opacity-60"
            >
              <span>{status === "loading" ? "Verifying Identity..." : "Begin Voting"}</span>
              <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
                arrow_forward
              </span>
            </button>
          </form>
        </div>

        <footer className="mt-section-gap text-center">
          <p className="font-label-md text-primary-container font-medium opacity-80">
            PRIESTS OF GOD GENERATION
          </p>
        </footer>
      </main>
    </>
  );
}
