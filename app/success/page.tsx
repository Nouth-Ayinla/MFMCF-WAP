"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const name = searchParams?.get("name") ?? "Voter";
  const unit = searchParams?.get("unit") ?? "";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#500088", "#FFD700", "#22c55e", "#6B21A8"];
    const particles = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 3 + 2,
      angle: Math.random() * 360,
    }));

    let raf: number;
    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y += p.speed;
        p.angle += 1;
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
        if (p.y > canvas.height) p.y = -20;
      });
      raf = requestAnimationFrame(animate);
    }
    animate();

    const timeout = setTimeout(() => {
      canvas.style.transition = "opacity 1s ease";
      canvas.style.opacity = "0";
    }, 3000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="pointer-events-none fixed top-0 left-0 w-full h-full z-10" />
      <main className="flex-grow flex items-center justify-center px-container-margin py-12 md:py-24 max-w-2xl lg:max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center w-full">
          {/* Left Column: Confirmation Badge and Text */}
          <div className="flex flex-col items-center text-center lg:text-left lg:items-start space-y-6">
            <div className="relative mb-2">
              <div className="absolute -inset-12 opacity-30 blur-3xl bg-primary/20 rounded-full animate-pulse" />
              <div className="relative flex items-center justify-center w-40 h-40 md:w-48 md:h-48 bg-white rounded-full border-4 border-[#6B21A8] shadow-[8px_8px_0px_0px_#000000] z-20 transition-transform duration-300 hover:scale-105">
                <span
                  className="material-symbols-outlined text-[80px] md:text-[100px] text-[#22c55e]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#FFD700] rounded-full flex items-center justify-center border-2 border-black">
                  <span className="material-symbols-outlined text-black text-xl">workspace_premium</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="font-headline-lg text-headline-lg md:text-[40px] text-on-background tracking-tight">
                Votes Recorded!
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
                Thank you for serving and honoring our leaders and workers today. Your appreciation makes a difference.
              </p>
            </div>
          </div>

          {/* Right Column: Transaction Details and Buttons */}
          <div className="w-full space-y-6">
            <div className="w-full bg-white border-2 border-outline-variant/60 rounded-2xl p-card-padding space-y-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="font-label-bold text-label-bold text-primary uppercase tracking-widest">
                Transaction Details
              </h2>
              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-fixed/30 border border-outline-variant/40 rounded-full">
                  <span className="material-symbols-outlined text-primary text-sm">person</span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">Voted as: {name}</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-fixed/30 border border-outline-variant/40 rounded-full">
                  <span className="material-symbols-outlined text-primary text-sm">group</span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">Unit: {unit}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">event</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">Recorded • July 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">lock</span>
                  <span className="font-label-md text-label-md text-primary font-bold">Secure Submission</span>
                </div>
              </div>
            </div>

            <div className="w-full">
              <button
                onClick={() => router.push("/")}
                className="w-full h-14 bg-black text-white rounded-full font-label-bold text-lg flex items-center justify-center gap-3 hard-shadow active:translate-y-1 hover:bg-[#6B21A8] transition-all duration-150"
              >
                <span className="material-symbols-outlined">refresh</span>
                Cast Another Vote (Shared Device)
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
