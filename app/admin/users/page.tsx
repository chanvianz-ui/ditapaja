"use client";

import AdminMenu from "@/app/admin/admin-menu";
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
      const response = await fetch("/api/admin/users?page=" + pageNumber, {
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
  }, [router]);

  useEffect(() => { void loadUsers(page); }, [page, loadUsers]);

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
    return user.email.toLowerCase().includes(keyword) ||
      (user.username || "").toLowerCase().includes(keyword) ||
      user.id.toLowerCase().includes(keyword);
  });
  const usernameAccounts = users.filter((user) => user.accountType === "username").length;
  const verifiedAccounts = users.filter((user) => user.accountType !== "username" && !!user.emailConfirmedAt).length;

  function openUserDetail(userId: string) {
    router.push("/admin/users/" + userId);
  }

  return (
    <main className="min-h-screen bg-[#f4f5f2] text-[#20251f]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col bg-[#202720] px-5 py-6 text-white lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d8e5d2] text-[#26372a]"><LayoutDashboard size={20}/></div>
          <div><p className="text-[15px] font-bold tracking-tight">DiTapAja</p><p className="mt-0.5 text-[10px] font-medium uppercase tracking-[.18em] text-[#9eaa9d]">Control center</p></div>
        </div>
        <div className="mt-12">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#829083]">Workspace</p>
          <button onClick={() => router.push("/admin")} className="mt-4 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm text-[#b7c1b5] transition hover:bg-white/5 hover:text-white"><LayoutDashboard size={17}/> Overview</button>
          <button onClick={() => router.push("/admin/orders")} className="mt-1.5 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm text-[#b7c1b5] transition hover:bg-white/5 hover:text-white"><CreditCard size={17}/> Order management</button>
          <div className="mt-1.5 flex items-center gap-3 rounded-xl bg-[#354337] px-3.5 py-3 text-sm font-semibold text-[#e5efe2]"><Users size={17}/> User management <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c3d9b9]"/></div>
          <button onClick={() => router.push("/admin/pins")} className="mt-1.5 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm text-[#b7c1b5] transition hover:bg-white/5 hover:text-white"><KeyRound size={17}/> Activation PINs</button>
        </div>
        <div className="mt-auto">
          <div className="rounded-2xl border border-white/10 bg-white/[.045] p-4"><div className="flex items-center gap-2 text-[#d5e3d0]"><ShieldCheck size={16}/><span className="text-xs font-semibold">Superadmin access</span></div><p className="mt-2 text-[11px] leading-5 text-[#9eaa9d]">Akses penuh untuk mengelola platform DiTapAja.</p></div>
          <button onClick={handleLogout} className="mt-4 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-[#b7c1b5] transition hover:bg-rose-500/10 hover:text-rose-200"><LogOut size={17}/> Sign out</button>
        </div>
      </aside>

      <section className="min-h-screen lg:ml-[264px]">
        <header className="sticky top-0 z-20 border-b border-[#e7e9e3] bg-[#f8f9f6]/90 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-4 sm:px-8 lg:px-10">
            <div><p className="text-[11px] font-medium text-[#899187]">DiTapAja <span className="mx-1.5 text-[#c0c6bd]">/</span> Workspace</p><h1 className="mt-1 text-base font-semibold tracking-tight sm:text-lg">User management</h1></div>
            <div className="flex items-center gap-2">
              <button onClick={refreshUsers} disabled={loading || refreshing} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e1e5dc] bg-white px-3.5 text-xs font-semibold text-[#536052] transition hover:border-[#b9c8b5] disabled:opacity-50"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""}/><span className="hidden sm:inline">Refresh data</span></button>
              <div className="lg:hidden"><AdminMenu/></div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-8 sm:py-9 lg:px-10">
          <div className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <button onClick={() => router.push("/admin")} className="mb-5 inline-flex items-center gap-2 text-[11px] font-medium text-[#879184] transition hover:text-[#526b4e]"><ArrowLeft size={14}/> Kembali ke overview</button>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#dce5d7] bg-[#edf3e9] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-[#526b4e]"><Users size={12}/> Account directory</div>
              <h2 className="text-[30px] font-semibold leading-tight tracking-[-.045em] sm:text-[38px]">Kelola pengguna.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#7d877b]">Lihat akun, pantau aktivitas masuk, dan buka detail setiap pengguna.</p>
            </div>
            <button onClick={() => router.push("/admin/users/new")} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#29382b] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3a4b3b]"><UserPlus size={16}/> Tambah pengguna <ArrowRight size={15}/></button>
          </div>

          {error && <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#f0c9c4] bg-[#fff4f1] p-4 text-sm text-[#a3453a]"><AlertCircle size={18} className="mt-0.5 shrink-0"/><div><p className="font-semibold">Data pengguna belum berhasil dimuat</p><p className="mt-1">{error}</p></div></div>}

          <section className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-[#e5e8e1] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><p className="text-xs font-medium text-[#7e887c]">Akun di halaman ini</p><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf3e9] text-[#668060]"><Users size={17}/></span></div><p className="mt-5 text-[32px] font-semibold leading-none tracking-[-.04em]">{loading ? "—" : users.length}</p><p className="mt-3 text-[11px] text-[#9aa296]">Maksimal 20 akun per halaman</p></article>
            <article className="rounded-2xl border border-[#e5e8e1] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><p className="text-xs font-medium text-[#7e887c]">Login username</p><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1eef6] text-[#796a9c]"><CircleUserRound size={17}/></span></div><p className="mt-5 text-[32px] font-semibold leading-none tracking-[-.04em]">{loading ? "—" : usernameAccounts}</p><p className="mt-3 text-[11px] text-[#9aa296]">Akun tanpa email</p></article>
            <article className="rounded-2xl border border-[#e5e8e1] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><p className="text-xs font-medium text-[#7e887c]">Email terverifikasi</p><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf1e7] text-[#63805c]"><UserCheck size={17}/></span></div><p className="mt-5 text-[32px] font-semibold leading-none tracking-[-.04em]">{loading ? "—" : verifiedAccounts}</p><p className="mt-3 text-[11px] text-[#9aa296]">Di halaman yang sedang dibuka</p></article>
          </section>

          <section className="mt-7 overflow-hidden rounded-2xl border border-[#e2e7df] bg-white">
            <div className="flex flex-col justify-between gap-4 border-b border-[#edf0eb] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
              <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8b9887]">Directory</p><h3 className="mt-2 text-lg font-semibold tracking-tight">Daftar akun</h3><p className="mt-1 text-xs text-[#929b90]">Pilih akun untuk membuka informasi lengkap.</p></div>
              <div className="relative w-full sm:max-w-[340px]"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa296]"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari username, email, atau ID..." className="h-11 w-full rounded-xl border border-[#e5e9e2] bg-[#f8f9f6] pl-10 pr-4 text-xs text-[#394338] outline-none transition placeholder:text-[#a1a99e] focus:border-[#aebfa7] focus:bg-white focus:ring-4 focus:ring-[#edf3e9]"/></div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[780px] text-left">
                <thead className="bg-[#f8f9f6]"><tr className="text-[10px] font-bold uppercase tracking-[.15em] text-[#929b90]"><th className="px-6 py-4">Pengguna</th><th className="px-6 py-4">ID akun</th><th className="px-6 py-4">Terdaftar</th><th className="px-6 py-4">Login terakhir</th><th className="px-6 py-4">Jenis akun</th><th className="px-4 py-4"/></tr></thead>
                <tbody className="divide-y divide-[#f0f2ee]">
                  {loading ? <tr><td colSpan={6} className="px-6 py-16 text-center text-xs text-[#929b90]">Memuat daftar pengguna...</td></tr> : filteredUsers.length === 0 ? <tr><td colSpan={6} className="px-6 py-16 text-center"><UserRound size={25} className="mx-auto mb-3 text-[#c3cbc0]"/><p className="text-sm font-semibold text-[#687365]">Pengguna tidak ditemukan</p><p className="mt-1 text-xs text-[#a0a89d]">Coba kata kunci pencarian lain.</p></td></tr> : filteredUsers.map((user) => <tr key={user.id} onClick={() => openUserDetail(user.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openUserDetail(user.id); } }} tabIndex={0} role="link" aria-label={"Buka detail " + (user.username || user.email)} className="cursor-pointer transition hover:bg-[#f8faf6] focus:bg-[#f0f5ed] focus:outline-none">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf3e9] text-[#668060]"><UserRound size={17}/></div><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#394338]">{user.username ? "@" + user.username : user.email || "Tanpa email"}</p><p className="mt-1 truncate text-[10px] text-[#9aa296]">{user.username ? "Akun username" : user.email}</p></div></div></td>
                    <td className="px-6 py-4"><span className="font-mono text-[10px] text-[#879184]">{user.id.slice(0, 8)}...</span></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-[10px] text-[#7f897c]"><CalendarDays size={13}/>{formatDate(user.createdAt)}</div></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-[10px] text-[#7f897c]"><Clock3 size={13}/>{formatDate(user.lastSignInAt)}</div></td>
                    <td className="px-6 py-4">{user.accountType === "username" ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1eef6] px-2.5 py-1.5 text-[10px] font-semibold text-[#796a9c]"><UserRound size={12}/> Username</span> : user.emailConfirmedAt ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf3e9] px-2.5 py-1.5 text-[10px] font-semibold text-[#63805c]"><Mail size={12}/> Terverifikasi</span> : <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f8f1e5] px-2.5 py-1.5 text-[10px] font-semibold text-[#a17b3e]"><Mail size={12}/> Menunggu</span>}</td>
                    <td className="px-4 py-4"><ChevronRight size={16} className="text-[#aab3a6]"/></td>
                  </tr>)}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#f0f2ee] md:hidden">
              {loading ? <p className="px-5 py-12 text-center text-xs text-[#929b90]">Memuat daftar pengguna...</p> : filteredUsers.length === 0 ? <div className="px-5 py-12 text-center"><UserRound size={25} className="mx-auto mb-3 text-[#c3cbc0]"/><p className="text-sm font-semibold text-[#687365]">Pengguna tidak ditemukan</p><p className="mt-1 text-xs text-[#a0a89d]">Coba kata kunci lain.</p></div> : filteredUsers.map((user) => <button key={user.id} onClick={() => openUserDetail(user.id)} className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-[#f8faf6]"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf3e9] text-[#668060]"><UserRound size={17}/></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-[#394338]">{user.username ? "@" + user.username : user.email || "Tanpa email"}</span><span className="mt-1 block truncate text-[10px] text-[#9aa296]">{user.username ? "Akun username" : user.email}</span><span className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-[#879184]"><Clock3 size={11}/>{formatDate(user.lastSignInAt)}</span></span><ChevronRight size={16} className="shrink-0 text-[#aab3a6]"/></button>)}
            </div>

            <div className="flex flex-col justify-between gap-3 border-t border-[#edf0eb] px-5 py-4 sm:flex-row sm:items-center sm:px-6"><p className="text-[10px] text-[#9aa296]">Halaman {page} <span className="mx-1.5">·</span> {filteredUsers.length} akun ditampilkan</p><div className="flex items-center gap-2"><button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1 || loading} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#e1e5dc] px-3.5 text-[11px] font-semibold text-[#647060] transition hover:bg-[#f8f9f6] disabled:cursor-not-allowed disabled:opacity-40"><ArrowLeft size={13}/> Sebelumnya</button><button onClick={() => setPage((current) => current + 1)} disabled={!hasMore || loading} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#29382b] px-3.5 text-[11px] font-semibold text-white transition hover:bg-[#3a4b3b] disabled:cursor-not-allowed disabled:opacity-40">Berikutnya <ArrowRight size={13}/></button></div></div>
          </section>

          <footer className="mt-10 flex flex-col gap-2 border-t border-[#e2e7df] py-6 text-[10px] text-[#9aa296] sm:flex-row sm:items-center sm:justify-between"><span>DiTapAja · Superadmin Control Center</span><span>Tap. Review. Grow.</span></footer>
        </div>
      </section>
    </main>
  );
}
