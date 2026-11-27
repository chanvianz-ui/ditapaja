"use client";

import AdminMenu from "@/app/admin/admin-menu";
import AdminSidebar from "@/app/admin/admin-sidebar";
import AdminNotificationBell from "@/app/admin/admin-notification-bell";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Search, Users, RefreshCw, ShieldCheck,
  LogOut, Mail, CalendarDays, Clock3, UserRound, AlertCircle,
  UserPlus, LayoutDashboard, CreditCard, KeyRound, ChevronRight,
  UserCheck, CircleUserRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type AdminUser = {
  id: string;
  email: string;
  username?: string | null;
  accountType?: "email" | "username";
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Belum pernah";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
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
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        router.replace("/login");
        return;
      }
      const params = new URLSearchParams({ page: String(pageNumber), search: search.trim() });
      const response = await fetch("/api/admin/users?" + params.toString(), {
        method: "GET",
        headers: { Authorization: "Bearer " + sessionData.session.access_token },
        cache: "no-store",
      });
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (response.status === 403) throw new Error("Akun ini tidak memiliki akses Super Admin.");
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal mengambil data pengguna.");
      setUsers(result.users);
      setHasMore(result.pagination.hasMore);
    } catch (err) {
      console.error("Admin users error:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengambil data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadUsers(page); }, search.trim() ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [page, loadUsers, search]);

  async function refreshUsers() {
    setRefreshing(true);
    await loadUsers(page);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const filteredUsers = users;
  const usernameAccounts = users.filter((user) => user.accountType === "username").length;
  const verifiedAccounts = users.filter((user) => user.accountType !== "username" && !!user.emailConfirmedAt).length;

  function openUserDetail(userId: string) {
    router.push("/admin/users/" + userId);
  }

  return (
    <main className="dt-admin-shell min-h-screen bg-[#15181b] text-[#efede7]">
      <AdminSidebar active="users"/>

      <section className="min-h-screen lg:ml-[264px]">
        <header className="sticky top-0 z-20 border-b border-[#34383a] bg-[#15181b]/90 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-4 sm:px-8 lg:px-10">
            <div><p className="text-[11px] font-medium text-[#dedbd4]">DiTapAja <span className="mx-1.5 text-[#d8d3ca]">/</span> Workspace</p><h1 className="mt-1 text-base font-semibold tracking-tight sm:text-lg">User management</h1></div>
            <div className="flex items-center gap-2">
              <AdminNotificationBell/>
              <button onClick={refreshUsers} disabled={loading || refreshing} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#34383a] bg-white px-3.5 text-xs font-semibold text-[#efede7] transition hover:border-[#b9c8b5] disabled:opacity-50"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""}/><span className="hidden sm:inline">Refresh data</span></button>
              <div className="lg:hidden"><AdminMenu/></div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-8 sm:py-9 lg:px-10">
          <div className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <button onClick={() => router.push("/admin")} className="mb-5 inline-flex items-center gap-2 text-[11px] font-medium text-[#dedbd4] transition hover:text-[#e0b28f]"><ArrowLeft size={14}/> Kembali ke overview</button>
              
              <h2 className="text-[30px] font-semibold leading-tight tracking-[-.045em] sm:text-[38px]">Kelola pengguna.</h2>
              
            </div>
            <button onClick={() => router.push("/admin/users/new")} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#3a2a20] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#493326]"><UserPlus size={16}/> Tambah pengguna <ArrowRight size={15}/></button>
          </div>

          {error && <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#63383e] bg-[#2b1b1d] p-4 text-sm text-[#e5a4a4]"><AlertCircle size={18} className="mt-0.5 shrink-0"/><div><p className="font-semibold">Data pengguna belum berhasil dimuat</p><p className="mt-1">{error}</p></div></div>}

          <section className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-[#34383a] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><p className="text-xs font-medium text-[#dedbd4]">Akun di halaman ini</p><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#15181b] text-[#d2a17d]"><Users size={17}/></span></div><p className="mt-5 text-[32px] font-semibold leading-none tracking-[-.04em]">{loading ? "—" : users.length}</p></article>
            <article className="rounded-2xl border border-[#34383a] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><p className="text-xs font-medium text-[#dedbd4]">Login username</p><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#211d27] text-[#dedbd4]"><CircleUserRound size={17}/></span></div><p className="mt-5 text-[32px] font-semibold leading-none tracking-[-.04em]">{loading ? "—" : usernameAccounts}</p></article>
            <article className="rounded-2xl border border-[#34383a] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><p className="text-xs font-medium text-[#dedbd4]">Email terverifikasi</p><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#15181b] text-[#d2a17d]"><UserCheck size={17}/></span></div><p className="mt-5 text-[32px] font-semibold leading-none tracking-[-.04em]">{loading ? "—" : verifiedAccounts}</p></article>
          </section>

          <section className="mt-7 overflow-hidden rounded-2xl border border-[#34383a] bg-white">
            <div className="flex flex-col justify-between gap-4 border-b border-[#34383a] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
              <div><h3 className="mt-2 text-lg font-semibold tracking-tight">Daftar akun</h3></div>
              <div className="relative w-full sm:max-w-[340px]"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a0a3a2]"/><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari username, email, atau ID..." className="h-11 w-full rounded-xl border border-[#34383a] bg-[#15181b] pl-10 pr-4 text-xs text-[#efede7] outline-none transition placeholder:text-[#a0a3a2] focus:border-[#34383a] focus:bg-white focus:ring-4 focus:ring-[#76553e]"/></div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[780px] text-left">
                <thead className="bg-[#15181b]"><tr className="text-[10px] font-bold uppercase tracking-[.15em] text-[#a0a3a2]"><th className="px-6 py-4">Pengguna</th><th className="px-6 py-4">ID akun</th><th className="px-6 py-4">Terdaftar</th><th className="px-6 py-4">Login terakhir</th><th className="px-6 py-4">Jenis akun</th><th className="px-4 py-4"/></tr></thead>
                <tbody className="divide-y divide-[#f0f2ee]">
                  {loading ? <tr><td colSpan={6} className="px-6 py-16 text-center text-xs text-[#a0a3a2]">Memuat daftar pengguna...</td></tr> : filteredUsers.length === 0 ? <tr><td colSpan={6} className="px-6 py-16 text-center"><UserRound size={25} className="mx-auto mb-3 text-[#d8d3ca]"/><p className="text-sm font-semibold text-[#dedbd4]">Pengguna tidak ditemukan</p><p className="mt-1 text-xs text-[#a0a3a2]">Coba kata kunci pencarian lain.</p></td></tr> : filteredUsers.map((user) => <tr key={user.id} onClick={() => openUserDetail(user.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openUserDetail(user.id); } }} tabIndex={0} role="link" aria-label={"Buka detail " + (user.username || user.email)} className="cursor-pointer transition hover:bg-[#15181b] focus:bg-[#15181b] focus:outline-none">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#15181b] text-[#d2a17d]"><UserRound size={17}/></div><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#efede7]">{user.username ? "@" + user.username : user.email || "Tanpa email"}</p><p className="mt-1 truncate text-[10px] text-[#a0a3a2]">{user.username ? "Akun username" : user.email}</p></div></div></td>
                    <td className="px-6 py-4"><span className="font-mono text-[10px] text-[#dedbd4]">{user.id.slice(0, 8)}...</span></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-[10px] text-[#dedbd4]"><CalendarDays size={13}/>{formatDate(user.createdAt)}</div></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-[10px] text-[#dedbd4]"><Clock3 size={13}/>{formatDate(user.lastSignInAt)}</div></td>
                    <td className="px-6 py-4">{user.accountType === "username" ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#211d27] px-2.5 py-1.5 text-[10px] font-semibold text-[#dedbd4]"><UserRound size={12}/> Username</span> : user.emailConfirmedAt ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#15181b] px-2.5 py-1.5 text-[10px] font-semibold text-[#d2a17d]"><Mail size={12}/> Terverifikasi</span> : <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2a241b] px-2.5 py-1.5 text-[10px] font-semibold text-[#d8b67c]"><Mail size={12}/> Menunggu</span>}</td>
                    <td className="px-4 py-4"><ChevronRight size={16} className="text-[#a0a3a2]"/></td>
                  </tr>)}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#f0f2ee] md:hidden">
              {loading ? <p className="px-5 py-12 text-center text-xs text-[#a0a3a2]">Memuat daftar pengguna...</p> : filteredUsers.length === 0 ? <div className="px-5 py-12 text-center"><UserRound size={25} className="mx-auto mb-3 text-[#d8d3ca]"/><p className="text-sm font-semibold text-[#dedbd4]">Pengguna tidak ditemukan</p><p className="mt-1 text-xs text-[#a0a3a2]">Coba kata kunci lain.</p></div> : filteredUsers.map((user) => <button key={user.id} onClick={() => openUserDetail(user.id)} className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-[#15181b]"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#15181b] text-[#d2a17d]"><UserRound size={17}/></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-[#efede7]">{user.username ? "@" + user.username : user.email || "Tanpa email"}</span><span className="mt-1 block truncate text-[10px] text-[#a0a3a2]">{user.username ? "Akun username" : user.email}</span><span className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-[#dedbd4]"><Clock3 size={11}/>{formatDate(user.lastSignInAt)}</span></span><ChevronRight size={16} className="shrink-0 text-[#a0a3a2]"/></button>)}
            </div>

            <div className="flex flex-col justify-between gap-3 border-t border-[#34383a] px-5 py-4 sm:flex-row sm:items-center sm:px-6"><p className="text-[10px] text-[#a0a3a2]">Halaman {page} <span className="mx-1.5">·</span> {filteredUsers.length} akun ditampilkan</p><div className="flex items-center gap-2"><button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1 || loading} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#34383a] px-3.5 text-[11px] font-semibold text-[#dedbd4] transition hover:bg-[#15181b] disabled:cursor-not-allowed disabled:opacity-40"><ArrowLeft size={13}/> Sebelumnya</button><button onClick={() => setPage((current) => current + 1)} disabled={!hasMore || loading} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#3a2a20] px-3.5 text-[11px] font-semibold text-white transition hover:bg-[#493326] disabled:cursor-not-allowed disabled:opacity-40">Berikutnya <ArrowRight size={13}/></button></div></div>
          </section>

          <footer className="mt-10 flex flex-col gap-2 border-t border-[#34383a] py-6 text-[10px] text-[#a0a3a2] sm:flex-row sm:items-center sm:justify-between"><span>DiTapAja · Superadmin Control Center</span><span>Tap. Review. Grow.</span></footer>
        </div>
      </section>
    </main>
  );
}
