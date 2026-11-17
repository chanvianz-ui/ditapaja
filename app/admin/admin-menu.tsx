"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ClipboardList, Users, KeyRound, LogOut, Menu, X, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Order Management", icon: ClipboardList },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/pins", label: "Activation PINs", icon: KeyRound },
];

export default function AdminMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open admin menu"
        aria-expanded={open}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
      >
        <Menu size={19} strokeWidth={2} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100]">
          <button
            type="button"
            aria-label="Close admin menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
          />
          <aside className="absolute right-0 top-0 flex h-full w-[min(340px,88vw)] flex-col border-l border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <ShieldCheck size={19} />
                </div>
                <div>
                  <p className="text-sm font-bold tracking-tight text-slate-900">DiTapAja</p>
                  <p className="mt-0.5 text-xs text-slate-400">Admin Control Center</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                <X size={19} />
              </button>
            </div>

            <div className="pt-7">
              <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
              <nav className="space-y-1.5">
                {items.map((item) => {
                  const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => { setOpen(false); router.push(item.href); }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition ${active ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}
                    >
                      <Icon size={18} />
                      {item.label}
                      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="mt-auto border-t border-slate-100 pt-5">
              <div className="mb-3 rounded-xl bg-slate-50 p-3.5">
                <div className="flex items-center gap-2 text-slate-700">
                  <ShieldCheck size={16} />
                  <span className="text-xs font-bold">Superadmin access</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">Kelola aktivitas dan data platform DiTapAja.</p>
              </div>
              <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">
                <LogOut size={18} />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
