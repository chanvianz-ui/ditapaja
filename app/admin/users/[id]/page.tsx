
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  CreditCard,
  Activity,
  MousePointerClick,
  MessageSquare,
  Mail,
  CalendarDays,
  Clock3,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type UserDetail = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
  fullName: string;
};

type UserCard = {
  id: string;
  card_name: string | null;
  public_code: string;
  destination_url: string;
  active: boolean;
  created_at: string;
  totalTaps: number;
  totalReviewClicks: number;
};

type UserStats = {
  totalCards: number;
  activeCards: number;
  totalTaps: number;
  totalReviewClicks: number;
};

function formatDate(value: string | null) {
  if (!value) return "Belum pernah";

  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight">
            {value.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#155eef]">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const userId = params.id;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalCards: 0,
    activeCards: 0,
    totalTaps: 0,
    totalReviewClicks: 0,
  });
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDetails = useCallback(async () => {
    setError("");

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `/api/admin/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error("Akun ini tidak memiliki akses Super Admin.");
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal mengambil detail pengguna.");
      }

      setUser(result.user);
      setStats(result.stats);
      setCards(result.cards);
    } catch (err) {
      console.error("User detail error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router, userId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadDetails();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#17243b]">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/users")}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-blue-50 hover:text-[#155eef]"
              aria-label="Back to users"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-lg font-bold">DiTapAja</h1>
              <p className="text-xs text-slate-400">
                Admin Control Center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-[#155eef] sm:flex">
              <ShieldCheck size={15} />
              Super Admin
            </span>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Sign out"
            >
              <Users size={17} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
              <button
                onClick={() => router.push("/admin")}
                className="hover:text-[#155eef]"
              >
                Admin
              </button>
              <span>/</span>
              <button
                onClick={() => router.push("/admin/users")}
                className="hover:text-[#155eef]"
              >
                Users
              </button>
              <span>/</span>
              <span className="font-semibold text-[#155eef]">
                User Detail
              </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              User Detail
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Account information and NFC card performance.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:text-[#155eef] disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-sm text-slate-400">
            Loading user details...
          </div>
        ) : user ? (
          <>
            <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#155eef]">
                  <Users size={30} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="break-all text-xl font-bold">
                    {user.fullName || user.email || "DiTapAja User"}
                  </h3>
                  <p className="mt-1 break-all text-sm text-slate-500">
                    {user.email || "No email"}
                  </p>
                  <p className="mt-2 break-all font-mono text-xs text-slate-400">
                    ID: {user.id}
                  </p>
                </div>

                <div>
                  {user.emailConfirmedAt ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 size={15} />
                      Email Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-600">
                      <XCircle size={15} />
                      Email Pending
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <CalendarDays size={18} className="mt-0.5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Registered At</p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock3 size={18} className="mt-0.5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Last Login</p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatDate(user.lastSignInAt)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total NFC Cards"
                value={stats.totalCards}
                icon={CreditCard}
              />
              <StatCard
                label="Active Cards"
                value={stats.activeCards}
                icon={Activity}
              />
              <StatCard
                label="Total Taps"
                value={stats.totalTaps}
                icon={MousePointerClick}
              />
              <StatCard
                label="Review Clicks"
                value={stats.totalReviewClicks}
                icon={MessageSquare}
              />
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <h3 className="font-bold">User NFC Cards</h3>
                <p className="mt-1 text-xs text-slate-400">
                  All NFC cards registered to this account
                </p>
              </div>

              {cards.length === 0 ? (
                <div className="p-16 text-center">
                  <CreditCard
                    size={30}
                    className="mx-auto mb-3 text-slate-300"
                  />
                  <p className="text-sm font-semibold text-slate-500">
                    No NFC cards found
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    This user has not created any NFC cards yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left">
                    <thead className="bg-slate-50">
                      <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="px-6 py-4">Card</th>
                        <th className="px-6 py-4">Public Code</th>
                        <th className="px-6 py-4">Taps</th>
                        <th className="px-6 py-4">Review Clicks</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Created</th>
                        <th className="px-6 py-4">Link</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {cards.map((card) => (
                        <tr key={card.id} className="hover:bg-slate-50/70">
                          <td className="px-6 py-5">
                            <p className="text-sm font-semibold">
                              {card.card_name || "Untitled Card"}
                            </p>
                          </td>

                          <td className="px-6 py-5 font-mono text-xs text-slate-500">
                            {card.public_code}
                          </td>

                          <td className="px-6 py-5 text-sm font-semibold">
                            {card.totalTaps.toLocaleString("id-ID")}
                          </td>

                          <td className="px-6 py-5 text-sm font-semibold">
                            {card.totalReviewClicks.toLocaleString("id-ID")}
                          </td>

                          <td className="px-6 py-5">
                            {card.active ? (
                              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-600">
                                Active
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-500">
                                Inactive
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-5 text-xs text-slate-500">
                            {formatDate(card.created_at)}
                          </td>

                          <td className="px-6 py-5">
                            <a
                              href={`/c/${card.public_code}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#155eef] hover:underline"
                            >
                              Open <ExternalLink size={13} />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : null}

        <footer className="py-8 text-center text-xs text-slate-400">
          DiTapAja Admin Control Center · Tap. Review. Grow.
        </footer>
      </div>
    </main>
  );
}
