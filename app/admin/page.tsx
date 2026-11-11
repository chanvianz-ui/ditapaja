
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  CreditCard,
  Activity,
  MousePointerClick,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type AdminStats = {
  totalUsers: number;
  totalCards: number;
  activeCards: number;
  totalTaps: number;
  totalReviewClicks: number;
};

const initialStats: AdminStats = {
  totalUsers: 0,
  totalCards: 0,
  activeCards: 0,
  totalTaps: 0,
  totalReviewClicks: 0,
};

export default function AdminPage() {
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadStats() {
    setError("");

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        router.replace("/login");
        return;
      }

      const response = await fetch("/api/admin/overview", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal mengambil data Admin");
      }

      setStats(result.stats);
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadStats();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Registered accounts",
    },
    {
      label: "Total NFC Cards",
      value: stats.totalCards,
      icon: CreditCard,
      description: "All registered cards",
    },
    {
      label: "Active Cards",
      value: stats.activeCards,
      icon: Activity,
      description: "Currently activated",
    },
    {
      label: "Total Taps",
      value: stats.totalTaps,
      icon: MousePointerClick,
      description: "Total NFC interactions",
    },
    {
      label: "Review Clicks",
      value: stats.totalReviewClicks,
      icon: MessageSquare,
      description: "Clicks to Google Review",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#17243b]">
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-[250px] border-r border-slate-200 bg-white p-5 lg:block">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
            <LayoutDashboard size={21} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              DiTapAja
            </h1>
            <p className="text-xs text-slate-400">Control Center</p>
          </div>
        </div>

        <div className="mt-12">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Management
          </p>

          <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-[#155eef]">
            <LayoutDashboard size={18} />
            Overview
          </div>

          <button
            onClick={() => router.push("/admin/pins")}
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-blue-50 hover:text-[#155eef]"
          >
            <KeyRound size={18} />
            Activation PINs
          </button>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-[#155eef]">
              <ShieldCheck size={18} />
              <span className="text-xs font-bold">Super Admin</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              You have full administrative access to DiTapAja.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <section className="lg:ml-[250px]">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3.5 backdrop-blur-xl sm:px-8 sm:py-4">
          <div>
            <p className="text-xs font-medium text-slate-400">
              DiTapAja / Administration
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight">
              Admin Overview
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              System Online
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-[#155eef] disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 lg:hidden"
              aria-label="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 sm:py-8">
          <div className="mb-7">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#155eef]">
                Super Admin
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Platform Overview
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Monitor your entire DiTapAja platform from one place.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Unable to load statistics</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {statCards.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-200/40 transition-shadow hover:shadow-md sm:p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {item.label}
                      </p>

                      <p className="mt-3 text-3xl font-bold tracking-tight text-[#17243b]">
                        {loading
                          ? "—"
                          : item.value.toLocaleString("id-ID")}
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 text-[#155eef] ring-1 ring-blue-100">
                      <Icon size={21} />
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-slate-400">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-200/40 sm:p-6 xl:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">Platform Activity</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Overall platform performance
                  </p>
                </div>

                <Activity size={20} className="text-[#155eef]" />
              </div>

              <div className="mt-7 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-xs text-slate-500">
                    NFC Cards Activated
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {loading ? "—" : stats.activeCards.toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-xs text-slate-500">
                    Inactive Cards
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {loading
                      ? "—"
                      : (stats.totalCards - stats.activeCards).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-xs font-semibold text-[#155eef]">
                  Platform Insight
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  DiTapAja has recorded{" "}
                  <strong>{stats.totalTaps.toLocaleString("id-ID")}</strong>{" "}
                  NFC taps and{" "}
                  <strong>
                    {stats.totalReviewClicks.toLocaleString("id-ID")}
                  </strong>{" "}
                  review button clicks across the platform.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-200/40 sm:p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-[#155eef]" />
                <h3 className="font-bold">Admin Access</h3>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Your account is registered as the platform Super Admin.
                Administrative statistics are protected by server-side
                authentication.
              </p>

              <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <ShieldCheck size={17} />
                  <span className="text-sm font-bold">
                    Protected Access
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-emerald-700/80">
                  Only the configured Super Admin account can access
                  administrative data.
                </p>
              </div>
            </div>
          </div>

          <footer className="mt-10 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
            DiTapAja Admin Control Center · Tap. Review. Grow.
          </footer>
        </div>
      </section>
    </main>
  );
}
