"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const BASE_NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: "dashboard" },
  { href: "/admin/workers", label: "Workers & Units", icon: "group" },
  { href: "/admin/categories", label: "Category Management", icon: "category" },
  { href: "/admin/logs", label: "Audit Logs", icon: "history" },
];

const MANAGE_ADMINS_ITEM = { href: "/admin/manage", label: "Manage Admins", icon: "admin_panel_settings" };

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/admin/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not logged in");
      })
      .then((data) => {
        setIsSuperAdmin(data.admin?.role === "superadmin");
      })
      .catch(() => { });
  }, []);

  const navItems = isSuperAdmin ? [...BASE_NAV_ITEMS, MANAGE_ADMINS_ITEM] : BASE_NAV_ITEMS;
  // Bottom tab bar stays to 4 slots even for superadmins — Manage Admins lives in the drawer only.
  const tabItems = BASE_NAV_ITEMS;

  async function handleSignOut() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  function isActive(href: string) {
    if (!pathname) return false;
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-on-surface">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[280px] bg-black text-white border-r flex-col overflow-y-auto z-[60]">
        <div className="px-10 py-8">
          <h1 className="text-2xl font-bold">WAP Admin</h1>
          <p className="text-sm opacity-70">PRIESTS OF GOD GENERATION</p>
        </div>
        <nav className="flex-grow flex flex-col">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-10 py-4 transition-all ${isActive(item.href) ? "border-l-4 border-white bg-white/10 font-bold" : "opacity-80 hover:opacity-100"
                }`}
            >
              <span className="material-symbols-outlined" style={isActive(item.href) ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                {item.icon}
              </span>
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
          <button onClick={handleSignOut} className="flex items-center gap-3 px-10 py-4 opacity-80 hover:opacity-100 transition-all mt-auto mb-8 text-left">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm">Sign Out</span>
          </button>
        </nav>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-50 bg-black text-white h-14 flex items-center justify-between px-4">
        <button onClick={() => setDrawerOpen(true)} className="p-1 -ml-1" aria-label="Open menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="font-bold text-sm">WAP Admin</span>
        <div className="w-6" />
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-[70] flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-64 bg-black text-white h-full flex flex-col animate-in slide-in-from-left duration-200">
            <div className="px-6 py-6 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">WAP Admin</h1>
                <p className="text-xs opacity-70">PRIESTS OF GOD GENERATION</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <nav className="flex-grow flex flex-col">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center gap-3 px-6 py-4 transition-all ${isActive(item.href) ? "border-l-4 border-white bg-white/10 font-bold" : "opacity-80"
                    }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
              <Link href="/admin/settings" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-6 py-4 opacity-80">
                <span className="material-symbols-outlined">settings</span>
                <span className="text-sm">Settings</span>
              </Link>
              <button onClick={handleSignOut} className="flex items-center gap-3 px-6 py-4 opacity-80 mt-auto mb-6 text-left">
                <span className="material-symbols-outlined">logout</span>
                <span className="text-sm">Sign Out</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="md:ml-[280px] flex flex-col min-h-screen pb-20 md:pb-0">{children}</div>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-white border-t shadow-[0px_-2px_8px_0px_rgba(0,0,0,0.06)]">
        {tabItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${isActive(item.href) ? "text-primary" : "text-on-surface-variant"
              }`}
          >
            <span className="material-symbols-outlined text-[22px]" style={isActive(item.href) ? { fontVariationSettings: "'FILL' 1" } : undefined}>
              {item.icon}
            </span>
            <span className="text-[10px] font-medium">{item.label.split(" ")[0]}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
