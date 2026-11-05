
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Users,
  RefreshCw,
  ShieldCheck,
  LogOut,
  Mail,
  CalendarDays,
  Clock3,
  UserRound,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type AdminUser = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Belum pernah";

  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async (pageNumber: number) => {
    setError("");

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `/api/admin/users?page=${pageNumber}`,
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
        throw new Error(result.error || "Gagal mengambil data pengguna.");
      }

      setUsers(result.users);
      setHasMore(result.pagination.hasMore);
    } catch (err) {
      console.error("Admin users error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadUsers(page);
  }, [page, loadUsers]);

  async function refreshUsers() {
    setRefreshing(true);
    await loadUsers(page);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const filteredUsers = users.filter((user) => {
    const keyword = search.toLowerCase();

    return (
      user.email.toLowerCase().includes(keyword) ||
      user.id.toLowerCase().includes(keyword)
    );
  });

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#17243b]">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin")}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-blue-50 hover:text-[#155eef]"
              aria-label="Back to overview"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-lg font-bold tracking-tight">
                DiTapAja
              </h1>
              <p className="text-xs text-slate-400">
                Admin Control Center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-[#155eef] sm:flex">
              <ShieldCheck size={15} />
              Super Admin
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
            <span
              className="cursor-pointer hover:text-[#155eef]"
              onClick={() => router.push("/admin")}
            >
              Admin Overview
            </span>
            <span>/</span>
            <span className="font-semibold text-[#155eef]">Users</span>
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#155eef]">
                  Management
                </span>
              </div>

              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                User Management
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                View and monitor registered DiTapAja accounts.
              </p>
            </div>

            <button
              onClick={refreshUsers}
              disabled={loading || refreshing}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-[#155eef] disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh Users
            </button>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Users on this page
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {loading ? "—" : users.length}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#155eef]">
                <Users size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Current Page
                </p>
                <p className="mt-2 text-3xl font-bold">{page}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <CalendarDays size={21} />
              </div>
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-bold">Registered Users</h3>
              <p className="mt-1 text-xs text-slate-400">
                Showing up to 20 accounts per page
              </p>
            </div>

            <div className="relative w-full sm:max-w-[320px]">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search email or user ID..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>
          </div>

          {error && (
            <div className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">User ID</th>
                  <th className="px-6 py-4">Registered</th>
                  <th className="px-6 py-4">Last Login</th>
                  <th className="px-6 py-4">Email Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-400">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <UserRound size={28} className="mx-auto mb-3 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-500">
                        No users found
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Try another search keyword.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                     <tr
  key={user.id}
  onClick={() => router.push(`/admin/users/${user.id}`)}
  className="cursor-pointer transition hover:bg-blue-50/70"
>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#155eef]">
                            <UserRound size={19} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#17243b]">
                              {user.email || "No email"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              DiTapAja Account
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="font-mono text-xs text-slate-500">
                          {user.id.slice(0, 8)}...
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <CalendarDays size={14} />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock3 size={14} />
                          {formatDate(user.lastSignInAt)}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        {user.emailConfirmedAt ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-600">
                            <Mail size={13} />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-600">
                            <Mail size={13} />
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-xs text-slate-400">
              Page {page} · {filteredUsers.length} users displayed
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1 || loading}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft size={15} />
                Previous
              </button>

              <button
                onClick={() => setPage((current) => current + 1)}
                disabled={!hasMore || loading}
                className="flex items-center gap-2 rounded-xl bg-[#155eef] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </section>

        <footer className="py-8 text-center text-xs text-slate-400">
          DiTapAja Admin Control Center · Tap. Review. Grow.
        </footer>
      </div>
    </main>
  );
}
