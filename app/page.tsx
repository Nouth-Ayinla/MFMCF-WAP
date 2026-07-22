"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
        if (data.units && Array.isArray(data.units)) {
          setUnits(data.units);
        } else {
          setUnits([]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch units:", err);
        setUnits([]);
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
              className="w-full bg-black text-white py-4 rounded-full font-headline-md hover:bg-[#6B21A8] transition-all active:scale-95 hard-shadow flex items-center justify-center gap-2 group mt-8 disabled:opacity-60"
            >
              <span>{status === "loading" ? "Verifying Identity..." : "Begin Voting"}</span>
              <svg width="9" height="18" viewBox="0 0 9 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-180 transition-transform group-hover:translate-x-1 shrink-0">
                <path d="M8.76392 1.39569L1.84742 8.42319C1.69573 8.57652 1.61064 8.7835 1.61064 8.99919C1.61064 9.21488 1.69573 9.42186 1.84742 9.57519L8.76242 16.6042C8.91403 16.7585 8.99899 16.9661 8.99899 17.1824C8.99899 17.3988 8.91403 17.6064 8.76242 17.7607C8.68835 17.8367 8.59983 17.897 8.50207 17.9383C8.4043 17.9795 8.29927 18.0007 8.19317 18.0007C8.08707 18.0007 7.98204 17.9795 7.88427 17.9383C7.78651 17.897 7.69799 17.8367 7.62392 17.7607L0.70892 10.7347C0.254531 10.2719 -4.76837e-05 9.64926 -4.76837e-05 9.00069C-4.76837e-05 8.35213 0.254531 7.72948 0.70892 7.26669L7.62392 0.240692C7.69801 0.16449 7.78663 0.103916 7.88453 0.0625534C7.98243 0.0211906 8.08764 -0.000120163 8.19392 -0.000120163C8.3002 -0.000120163 8.40541 0.0211906 8.50331 0.0625534C8.60121 0.103916 8.68983 0.16449 8.76392 0.240692C8.91553 0.394976 9.00049 0.602633 9.00049 0.818943C9.00049 1.03525 8.91553 1.24291 8.76392 1.39719" fill="currentColor"/>
              </svg>
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
