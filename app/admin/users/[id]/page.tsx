"use client";

import AdminMenu from "@/app/admin/admin-menu";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Activity, AlertCircle, ArrowLeft, Ban, CalendarDays, CheckCircle2,
  Clock3, CreditCard, ExternalLink, KeyRound, LayoutDashboard, LogOut,
  Mail, MessageSquare, MousePointerClick, RefreshCw, ShieldCheck, UserCheck,
  Users, XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type UserDetail = {
  id: string;
  email: string;
  username?: string | null;
  accountType?: "email" | "username";
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
  fullName: string;
  bannedUntil?: string | null;
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

type UserStats = { totalCards: number; activeCards: number; totalTaps: number; totalReviewClicks: number };

function formatDate(value: string | null) {
  if (!value) return "Belum pernah";
  return new Date(value).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatCard({ label, value, note, icon: Icon, tone }: { label: string; value: number; note: string; icon: React.ElementType; tone: string }) {
  return <article className="rounded-2xl border border-[#e5e8e1] bg-white p-5 sm:p-6">
    <div className="flex items-start justify-between"><p className="text-xs font-medium text-[#7e887c]">{label}</p><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon size={17}/></span></div>
    <p className="mt-5 text-[32px] font-semibold leading-none tracking-[-.04em]">{value.toLocaleString("id-ID")}</p>
    <p className="mt-3 text-[11px] text-[#9aa296]">{note}</p>
  </article>;
}

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [stats, setStats] = useState<UserStats>({ totalCards: 0, activeCards: 0, totalTaps: 0, totalReviewClicks: 0 });
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const loadDetails = useCallback(async () => {
    setError("");
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) { router.replace("/login"); return; }
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        cache: "no-store",
      });
      if (response.status === 401) { router.replace("/login"); return; }
      if (response.status === 403) throw new Error("Akun ini tidak memiliki akses Super Admin.");
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal mengambil detail pengguna.");
      setUser(result.user);
      setStats(result.stats);
      setCards(result.cards);
    } catch (err) {
      console.error("User detail error:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengambil data.");
    } finally { setLoading(false); setRefreshing(false); }
  }, [router, userId]);

  useEffect(() => { void loadDetails(); }, [loadDetails]);

  async function handleRefresh() { setRefreshing(true); await loadDetails(); }

  async function updateAccountStatus(action: "suspend" | "activate") {
    const prompt = action === "suspend"
      ? "Tangguhkan akun ini? Pengguna tidak akan bisa login sampai akun diaktifkan kembali."
      : "Aktifkan kembali akun ini agar pengguna bisa login?";
    if (!window.confirm(prompt)) return;
    setStatusLoading(true); setStatusMessage(""); setError("");
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) { router.replace("/login"); return; }
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionData.session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal memperbarui status akun.");
      setStatusMessage(result.message);
      await loadDetails();
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan."); }
    finally { setStatusLoading(false); }
  }

  async function handleLogout() { await supabase.auth.signOut(); router.replace("/login"); }
  const isSuspended = !!user?.bannedUntil;

  return (
    <main className="min-h-screen bg-[#f4f5f2] text-[#20251f]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col bg-[#202720] px-5 py-6 text-white lg:flex">
        <div className="flex items-center gap-3 px-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d8e5d2] text-[#26372a]"><LayoutDashboard size={20}/></div><div><p className="text-[15px] font-bold tracking-tight">DiTapAja</p><p className="mt-0.5 text-[10px] font-medium uppercase tracking-[.18em] text-[#9eaa9d]">Control center</p></div></div>
        <div className="mt-12"><p className="px-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#829083]">Workspace</p>
          <button onClick={() => router.push("/admin")} className="mt-4 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm text-[#b7c1b5] transition hover:bg-white/5 hover:text-white"><LayoutDashboard size={17}/> Overview</button>
          <button onClick={() => router.push("/admin/orders")} className="mt-1.5 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm text-[#b7c1b5] transition hover:bg-white/5 hover:text-white"><CreditCard size={17}/> Order management</button>
          <div className="mt-1.5 flex items-center gap-3 rounded-xl bg-[#354337] px-3.5 py-3 text-sm font-semibold text-[#e5efe2]"><Users size={17}/> User management <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c3d9b9]"/></div>
          <button onClick={() => router.push("/admin/pins")} className="mt-1.5 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm text-[#b7c1b5] transition hover:bg-white/5 hover:text-white"><KeyRound size={17}/> Activation PINs</button>
        </div>
        <div className="mt-auto"><div className="rounded-2xl border border-white/10 bg-white/[.045] p-4"><div className="flex items-center gap-2 text-[#d5e3d0]"><ShieldCheck size={16}/><span className="text-xs font-semibold">Superadmin access</span></div><p className="mt-2 text-[11px] leading-5 text-[#9eaa9d]">Akses penuh untuk mengelola platform DiTapAja.</p></div><button onClick={handleLogout} className="mt-4 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-[#b7c1b5] transition hover:bg-rose-500/10 hover:text-rose-200"><LogOut size={17}/> Sign out</button></div>
      </aside>

      <section className="min-h-screen lg:ml-[264px]">
        <header className="sticky top-0 z-20 border-b border-[#e7e9e3] bg-[#f8f9f6]/90 backdrop-blur-xl"><div className="flex items-center justify-between px-4 py-4 sm:px-8 lg:px-10"><div><p className="text-[11px] font-medium text-[#899187]">DiTapAja <span className="mx-1.5 text-[#c0c6bd]">/</span> Workspace</p><h1 className="mt-1 text-base font-semibold tracking-tight sm:text-lg">User detail</h1></div><div className="flex items-center gap-2"><button onClick={handleRefresh} disabled={loading || refreshing} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e1e5dc] bg-white px-3.5 text-xs font-semibold text-[#536052] transition hover:border-[#b9c8b5] disabled:opacity-50"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""}/><span className="hidden sm:inline">Refresh data</span></button><div className="lg:hidden"><AdminMenu/></div></div></div></header>

        <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-8 sm:py-9 lg:px-10">
          <button onClick={() => router.push("/admin/users")} className="mb-5 inline-flex items-center gap-2 text-[11px] font-medium text-[#879184] transition hover:text-[#526b4e]"><ArrowLeft size={14}/> Kembali ke daftar pengguna</button>
          <div className="mb-7"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#dce5d7] bg-[#edf3e9] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-[#526b4e]"><Users size={12}/> Account profile</div><h2 className="text-[30px] font-semibold leading-tight tracking-[-.045em] sm:text-[38px]">Detail pengguna.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#7d877b]">Informasi akun, status akses, dan performa kartu NFC milik pengguna.</p></div>

          {statusMessage && <div className="mb-5 flex items-center gap-2 rounded-xl border border-[#dce5d7] bg-[#edf3e9] p-4 text-sm text-[#526b4e]"><CheckCircle2 size={17}/>{statusMessage}</div>}
          {error && <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#f0c9c4] bg-[#fff4f1] p-4 text-sm text-[#a3453a]"><AlertCircle size={18} className="mt-0.5 shrink-0"/><div><p className="font-semibold">Data pengguna belum berhasil dimuat</p><p className="mt-1">{error}</p></div></div>}

          {loading ? <div className="rounded-2xl border border-[#e2e7df] bg-white p-16 text-center text-sm text-[#929b90]">Memuat detail pengguna...</div> : user ? <>
            <section className="overflow-hidden rounded-2xl border border-[#e2e7df] bg-white">
              <div className="h-2 bg-[#a9c39e]"/>
              <div className="p-5 sm:p-7">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#edf3e9] text-[#607c59]"><Users size={28}/></div>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="break-all text-xl font-semibold tracking-tight sm:text-2xl">{user.fullName || user.username || user.email || "DiTapAja User"}</h3><span className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${isSuspended ? "bg-[#fff0ed] text-[#a45e54]" : "bg-[#edf3e9] text-[#55744e]"}`}>{isSuspended ? "Account suspended" : "Account active"}</span></div>
                    <p className="mt-2 break-all text-sm text-[#7d877b]">{user.username ? `Username: @${user.username}` : user.email || "Tidak ada email"}</p>
                    <p className="mt-2 break-all font-mono text-[10px] text-[#a0a89d]">ID: {user.id}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f4f6f2] px-3 py-2 text-[10px] font-semibold text-[#687365]">{user.accountType === "username" ? <Users size={13}/> : <Mail size={13}/>} {user.accountType === "username" ? "Username account" : "Email account"}</span>
                      {user.accountType !== "username" && <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-semibold ${user.emailConfirmedAt ? "bg-[#edf3e9] text-[#55744e]" : "bg-[#fbf4e7] text-[#9b7a43]"}`}>{user.emailConfirmedAt ? <CheckCircle2 size={13}/> : <XCircle size={13}/>} {user.emailConfirmedAt ? "Email terverifikasi" : "Email belum diverifikasi"}</span>}
                    </div>
                  </div>
                  <button type="button" onClick={() => void updateAccountStatus(isSuspended ? "activate" : "suspend")} disabled={statusLoading} className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${isSuspended ? "bg-[#29382b] text-white hover:bg-[#3a4b3b]" : "border border-[#efdfdc] bg-white text-[#a45e54] hover:bg-[#fff4f1]"}`}>{statusLoading ? <RefreshCw size={15} className="animate-spin"/> : isSuspended ? <UserCheck size={15}/> : <Ban size={15}/>} {isSuspended ? "Activate account" : "Suspend account"}</button>
                </div>
                <div className="mt-7 grid gap-4 border-t border-[#edf0eb] pt-5 sm:grid-cols-2"><div className="flex items-start gap-3"><CalendarDays size={17} className="mt-0.5 text-[#91a08c]"/><div><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#9aa296]">Terdaftar</p><p className="mt-1 text-xs font-semibold text-[#485346]">{formatDate(user.createdAt)}</p></div></div><div className="flex items-start gap-3"><Clock3 size={17} className="mt-0.5 text-[#91a08c]"/><div><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#9aa296]">Login terakhir</p><p className="mt-1 text-xs font-semibold text-[#485346]">{formatDate(user.lastSignInAt)}</p></div></div></div>
              </div>
            </section>

            <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total kartu NFC" value={stats.totalCards} note="Seluruh kartu terdaftar" icon={CreditCard} tone="bg-[#edf1f7] text-[#627b9a]"/>
              <StatCard label="Kartu aktif" value={stats.activeCards} note="Kartu yang dapat digunakan" icon={Activity} tone="bg-[#edf3e9] text-[#63805c]"/>
              <StatCard label="Total tap" value={stats.totalTaps} note="Interaksi pada kartu NFC" icon={MousePointerClick} tone="bg-[#f7f0e3] text-[#a17b3e]"/>
              <StatCard label="Klik Google Review" value={stats.totalReviewClicks} note="Aksi menuju halaman ulasan" icon={MessageSquare} tone="bg-[#f2eef7] text-[#796a9c]"/>
            </section>

            <section className="mt-7 overflow-hidden rounded-2xl border border-[#e2e7df] bg-white">
              <div className="flex flex-col justify-between gap-2 border-b border-[#edf0eb] px-5 py-5 sm:flex-row sm:items-end sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8b9887]">Card portfolio</p><h3 className="mt-2 text-lg font-semibold tracking-tight">Kartu NFC pengguna</h3><p className="mt-1 text-xs text-[#929b90]">Semua kartu yang terdaftar pada akun ini.</p></div><span className="text-[11px] font-medium text-[#929b90]">{cards.length} kartu</span></div>
              {cards.length === 0 ? <div className="px-5 py-16 text-center"><CreditCard size={28} className="mx-auto mb-3 text-[#c3cbc0]"/><p className="text-sm font-semibold text-[#687365]">Belum ada kartu NFC</p><p className="mt-1 text-xs text-[#a0a89d]">Pengguna ini belum membuat kartu NFC.</p></div> : <>
                <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[850px] text-left"><thead className="bg-[#f8f9f6]"><tr className="text-[10px] font-bold uppercase tracking-[.15em] text-[#929b90]"><th className="px-6 py-4">Kartu</th><th className="px-6 py-4">Public code</th><th className="px-6 py-4">Tap</th><th className="px-6 py-4">Review click</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Dibuat</th><th className="px-6 py-4">Link</th></tr></thead><tbody className="divide-y divide-[#f0f2ee]">{cards.map(card => <tr key={card.id} className="transition hover:bg-[#fafbf9]"><td className="px-6 py-5"><p className="text-sm font-semibold">{card.card_name || "Untitled Card"}</p></td><td className="px-6 py-5 font-mono text-xs text-[#7d877b]">{card.public_code}</td><td className="px-6 py-5 text-sm font-semibold">{card.totalTaps.toLocaleString("id-ID")}</td><td className="px-6 py-5 text-sm font-semibold">{card.totalReviewClicks.toLocaleString("id-ID")}</td><td className="px-6 py-5"><span className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${card.active ? "bg-[#edf3e9] text-[#55744e]" : "bg-[#f0f1ee] text-[#858d82]"}`}>{card.active ? "Active" : "Inactive"}</span></td><td className="px-6 py-5 text-xs text-[#7d877b]">{formatDate(card.created_at)}</td><td className="px-6 py-5"><a href={`/c/${card.public_code}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#607c59] hover:underline">Buka <ExternalLink size={13}/></a></td></tr>)}</tbody></table></div>
                <div className="divide-y divide-[#f0f2ee] md:hidden">{cards.map(card => <article key={card.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{card.card_name || "Untitled Card"}</p><p className="mt-1 font-mono text-[10px] text-[#929b90]">{card.public_code}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${card.active ? "bg-[#edf3e9] text-[#55744e]" : "bg-[#f0f1ee] text-[#858d82]"}`}>{card.active ? "Active" : "Inactive"}</span></div><div className="mt-4 grid grid-cols-2 gap-3"><div><p className="text-[10px] text-[#9aa296]">Tap</p><p className="mt-1 text-sm font-semibold">{card.totalTaps.toLocaleString("id-ID")}</p></div><div><p className="text-[10px] text-[#9aa296]">Review click</p><p className="mt-1 text-sm font-semibold">{card.totalReviewClicks.toLocaleString("id-ID")}</p></div></div><div className="mt-3 flex items-center justify-between"><p className="text-[10px] text-[#9aa296]">{formatDate(card.created_at)}</p><a href={`/c/${card.public_code}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#607c59]">Buka kartu <ExternalLink size={12}/></a></div></article>)}</div>
              </>}
            </section>
          </> : <div className="rounded-2xl border border-[#e2e7df] bg-white p-12 text-center text-sm text-[#929b90]">Data pengguna tidak ditemukan.</div>}
          <footer className="py-8 text-center text-[10px] text-[#a0a89d]">DiTapAja Control Center <span className="mx-1">·</span> User profile</footer>
        </div>
      </section>
    </main>
  );
}
