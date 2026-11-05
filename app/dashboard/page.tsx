
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  MousePointerClick,
  Users,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type Profile = {
  full_name: string | null;
};

type NfcCard = {
  id: string;
  public_code: string;
  destination_url: string;
  active: boolean;
};

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cards, setCards] = useState<NfcCard[]>([]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      setEmail(data.user.email ?? "");

      const [profileResult, cardsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data.user.id)
          .maybeSingle(),

        supabase
          .from("nfc_cards")
          .select("id, public_code, destination_url, active")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false }),
      ]);

      setProfile(profileResult.data);
      setCards(cardsResult.data ?? []);
      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const displayName = profile?.full_name || email.split("@")[0];

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-6 lg:flex lg:flex-col">
          <a href="/" className="text-2xl font-bold tracking-tight">
            DiTap<span className="text-blue-600">Aja.</span>
          </a>

          <p className="mt-12 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Workspace
          </p>

          <nav className="mt-4 space-y-2">
            <a className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              <LayoutDashboard size={19} /> Overview
            </a>
            <a href="#cards" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50">
              <CreditCard size={19} /> My Cards
            </a>
            <a href="#analytics" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50">
              <BarChart3 size={19} /> Analytics
            </a>
          </nav>

          <div className="mt-auto border-t border-slate-100 pt-5">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={19} /> Sign Out
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-5 md:px-10">
            <div>
              <p className="text-xs text-slate-400">Workspace / Overview</p>
              <h1 className="mt-1 text-xl font-bold">Dashboard</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">{displayName}</p>
                <p className="text-xs text-slate-400">{email}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-8 p-5 md:p-10">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm text-slate-500">Welcome back,</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight">
                  {displayName} 👋
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Pantau performa kartu NFC kamu dari sini.
                </p>
              </div>

              <button
                onClick={() => router.push("/dashboard/cards/new")}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
              >
                <Plus size={18} /> Add New Card
              </button>
            </div>

            <div id="analytics" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { label: "Total Taps", value: "—", icon: MousePointerClick },
                { label: "Unique Visitors", value: "—", icon: Users },
                { label: "Review Clicks", value: "—", icon: ExternalLink },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <item.icon className="text-blue-600" size={20} />
                  </div>
                  <p className="mt-5 text-3xl font-bold">{item.value}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    Analytics akan tampil setelah kartu menerima aktivitas.
                  </p>
                </div>
              ))}
            </div>

            <div id="cards" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <div>
                  <h3 className="font-bold">My NFC Cards</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Kelola semua kartu NFC kamu.
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {cards.length} Cards
                </span>
              </div>

              {cards.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <CreditCard size={26} />
                  </div>
                  <h4 className="mt-5 font-semibold">Belum ada kartu NFC</h4>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                    Tambahkan kartu NFC pertama kamu untuk mulai mengumpulkan data tap.
                  </p>
                  <button
                    onClick={() => router.push("/dashboard/cards/new")}
                    className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Tambahkan Kartu
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cards.map((card) => (
                    <div key={card.id} className="flex flex-wrap items-center justify-between gap-4 p-6">
                      <div>
                        <p className="font-semibold">{card.public_code}</p>
                        <p className="mt-1 max-w-md truncate text-sm text-slate-500">
                          {card.destination_url}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${card.active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {card.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-center text-xs text-slate-400">
              DiTapAja · Free Dashboard · No Monthly Subscription
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
