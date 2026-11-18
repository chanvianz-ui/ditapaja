"use client";

import AdminMenu from "@/app/admin/admin-menu";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, ArrowUpRight, CreditCard, KeyRound, LayoutDashboard,
  LogOut, MessageSquare, MousePointerClick, RefreshCw, ShieldCheck,
  Users, Wallet, AlertCircle, ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type AdminStats = {
  totalUsers: number;
  totalCards: number;
  activeCards: number;
  totalTaps: number;
  totalReviewClicks: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  paidRevenue: number;
  monthlyRevenue: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
};
type AdminOverviewResponse =
  | { success: true; stats: AdminStats }
  | { success: false; error?: string };

const initialStats: AdminStats = {
  totalUsers: 0, totalCards: 0, activeCards: 0, totalTaps: 0,
  totalReviewClicks: 0, totalOrders: 0, paidOrders: 0,
  pendingOrders: 0, paidRevenue: 0, monthlyRevenue: 0, topProducts: [],
};
const number = (value: number) => Number(value || 0).toLocaleString("id-ID");
const rupiah = (value: number) => "Rp" + number(value);

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadStats() {
    setError("");
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        router.replace("/login");
        return;
      }
      const response = await fetch("/api/admin/overview", {
        method: "GET",
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        cache: "no-store",
      });
      const result = (await response.json()) as AdminOverviewResponse;
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (!response.ok || result.success === false) {
        throw new Error(result.success === false ? result.error || "Gagal mengambil data Admin" : "Gagal mengambil data Admin");
      }
      setStats(result.stats);
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengambil data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { void loadStats(); }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadStats();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const primaryStats = [
    { label: "Total pengguna", value: stats.totalUsers, note: "Akun terdaftar", icon: Users, tone: "blue" },
    { label: "Kartu NFC", value: stats.totalCards, note: `${number(stats.activeCards)} kartu aktif`, icon: CreditCard, tone: "violet" },
    { label: "Total interaksi", value: stats.totalTaps, note: "Aktivitas tap NFC", icon: MousePointerClick, tone: "amber" },
    { label: "Total pesanan", value: stats.totalOrders, note: `${number(stats.paidOrders)} pembayaran lunas`, icon: Wallet, tone: "green" },
  ];
  const secondaryStats = [
    { label: "Kartu aktif", value: stats.activeCards, icon: Activity },
    { label: "Klik Google Review", value: stats.totalReviewClicks, icon: MessageSquare },
    { label: "Menunggu pembayaran", value: stats.pendingOrders, icon: RefreshCw },
    { label: "Pesanan lunas", value: stats.paidOrders, icon: ShieldCheck },
  ];

  return (
    <main className="dt-admin-shell min-h-screen bg-[#f4f5f2] text-[#20251f]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col bg-[#202720] px-5 py-6 text-white lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d8e5d2] text-[#26372a]"><LayoutDashboard size={20} /></div>
          <div><p className="text-[15px] font-bold tracking-tight">DiTapAja</p><p className="mt-0.5 text-[10px] font-medium uppercase tracking-[.18em] text-[#9eaa9d]">Control center</p></div>
        </div>
        <div className="mt-12">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#829083]">Workspace</p>
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#354337] px-3.5 py-3 text-sm font-semibold text-[#e5efe2]"><LayoutDashboard size={17} /> Overview <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c3d9b9]" /></div>
          <button onClick={() => router.push("/admin/orders")} className="mt-1.5 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm text-[#b7c1b5] transition hover:bg-white/5 hover:text-white"><CreditCard size={17} /> Order management</button>
          <button onClick={() => router.push("/admin/users")} className="mt-1.5 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm text-[#b7c1b5] transition hover:bg-white/5 hover:text-white"><Users size={17} /> User management</button>
          <button onClick={() => router.push("/admin/pins")} className="mt-1.5 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm text-[#b7c1b5] transition hover:bg-white/5 hover:text-white"><KeyRound size={17} /> Activation PINs</button>
        </div>
        <div className="mt-auto">
          <div className="rounded-2xl border border-white/10 bg-white/[.045] p-4">
            <div className="flex items-center gap-2 text-[#d5e3d0]"><ShieldCheck size={16} /><span className="text-xs font-semibold">Superadmin access</span></div>
            <p className="mt-2 text-[11px] leading-5 text-[#9eaa9d]">Akses penuh untuk mengelola platform DiTapAja.</p>
          </div>
          <button onClick={handleLogout} className="mt-4 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-[#b7c1b5] transition hover:bg-rose-500/10 hover:text-rose-200"><LogOut size={17} /> Sign out</button>
        </div>
      </aside>

      <section className="min-h-screen lg:ml-[264px]">
        <header className="sticky top-0 z-20 border-b border-[#e7e9e3] bg-[#f8f9f6]/90 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-4 sm:px-8 lg:px-10">
            <div><p className="text-[11px] font-medium text-[#899187]">DiTapAja <span className="mx-1.5 text-[#c0c6bd]">/</span> Workspace</p><h1 className="mt-1 text-base font-semibold tracking-tight sm:text-lg">Overview</h1></div>
            <div className="flex items-center gap-2">
              <button onClick={handleRefresh} disabled={loading || refreshing} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e1e5dc] bg-white px-3.5 text-xs font-semibold text-[#536052] transition hover:border-[#b9c8b5] disabled:opacity-50"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""}/><span className="hidden sm:inline">Refresh data</span></button>
              <div className="lg:hidden"><AdminMenu /></div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-8 sm:py-9 lg:px-10">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#dce5d7] bg-[#edf3e9] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-[#526b4e]"><ShieldCheck size={12}/> Superadmin workspace</div><h2 className="text-[30px] font-semibold leading-tight tracking-[-.045em] sm:text-[38px]">Selamat datang kembali.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#7d877b]">Pantau performa dan aktivitas utama DiTapAja dari satu tempat.</p></div>
            <div className="hidden items-center gap-2 text-xs text-[#899187] md:flex"><span className="h-2 w-2 rounded-full bg-[#83a77a]"/><span>Data diperbarui saat halaman dimuat</span></div>
          </div>

          {error && <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#f0c9c4] bg-[#fff4f1] p-4 text-sm text-[#a3453a]"><AlertCircle size={18} className="mt-0.5 shrink-0"/><div><p className="font-semibold">Data belum berhasil dimuat</p><p className="mt-1">{error}</p></div></div>}

          <section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {primaryStats.map((item) => {
              const Icon = item.icon;
              const tone = item.tone === "blue" ? "bg-[#eaf0f8] text-[#56769e]" : item.tone === "violet" ? "bg-[#efebf6] text-[#796a9c]" : item.tone === "amber" ? "bg-[#f7f0e3] text-[#a17b3e]" : "bg-[#eaf1e7] text-[#63805c]";
              return <article key={item.label} className="rounded-2xl border border-[#e5e8e1] bg-white p-5 sm:p-6">
                <div className="flex items-start justify-between"><p className="text-[12px] font-medium text-[#7e887c]">{item.label}</p><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon size={17}/></span></div>
                <p className="mt-5 text-[32px] font-semibold leading-none tracking-[-.04em] text-[#252d25]">{loading ? "—" : number(item.value)}</p>
                <p className="mt-3 text-[11px] text-[#9aa296]">{item.note}</p>
              </article>;
            })}
          </section>

          <section className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.85fr)]">
            <article className="overflow-hidden rounded-2xl border border-[#e2e7df] bg-white">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#edf0eb] px-5 py-5 sm:px-6">
                <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8b9887]">Commerce performance</p><h3 className="mt-2 text-lg font-semibold tracking-tight">Ringkasan pendapatan</h3><p className="mt-1 text-xs text-[#929b90]">Berdasarkan pembayaran yang telah dikonfirmasi.</p></div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf3e9] text-[#607c59]"><Wallet size={18}/></span>
              </div>
              <div className="grid sm:grid-cols-2">
                <div className="px-5 py-6 sm:px-6"><p className="text-xs text-[#879184]">Total pendapatan terkonfirmasi</p><p className="mt-3 text-[26px] font-semibold tracking-[-.04em]">{loading ? "—" : rupiah(stats.paidRevenue)}</p><p className="mt-2 text-[11px] text-[#a0a89d]">Akumulasi seluruh pesanan lunas</p></div>
                <div className="border-t border-[#edf0eb] bg-[#f8faf6] px-5 py-6 sm:border-l sm:border-t-0 sm:px-6"><p className="text-xs text-[#71836e]">Pendapatan bulan ini</p><p className="mt-3 text-[26px] font-semibold tracking-[-.04em] text-[#45623f]">{loading ? "—" : rupiah(stats.monthlyRevenue)}</p><p className="mt-2 text-[11px] text-[#91a08c]">Pembayaran lunas bulan berjalan</p></div>
              </div>
              <button onClick={() => router.push("/admin/orders")} className="flex w-full items-center justify-between border-t border-[#edf0eb] px-5 py-4 text-xs font-semibold text-[#61775b] transition hover:bg-[#f8faf6] sm:px-6">Buka manajemen pesanan <ArrowUpRight size={15}/></button>
            </article>

            <article className="rounded-2xl border border-[#e2e7df] bg-[#263329] p-5 text-white sm:p-6">
              <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#a7b6a2]">Platform engagement</p><Activity size={18} className="text-[#c3d5b9]"/></div>
              <p className="mt-6 text-[34px] font-semibold tracking-[-.045em]">{loading ? "—" : number(stats.totalTaps)}</p>
              <p className="mt-1 text-xs text-[#b4c0b0]">Total interaksi NFC</p>
              <div className="my-5 h-px bg-white/10"/>
              <div className="flex items-end justify-between gap-3"><div><p className="text-xl font-semibold">{loading ? "—" : number(stats.totalReviewClicks)}</p><p className="mt-1 text-[11px] text-[#a7b6a2]">Klik tombol Google Review</p></div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#d5e3cf]"><MousePointerClick size={18}/></div></div>
            </article>
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,.85fr)]">
            <article className="rounded-2xl border border-[#e2e7df] bg-white">
              <div className="border-b border-[#edf0eb] px-5 py-5 sm:px-6"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8b9887]">Operational snapshot</p><h3 className="mt-2 text-base font-semibold">Status platform</h3></div>
              <div className="grid grid-cols-2 divide-x divide-y divide-[#edf0eb] sm:grid-cols-4 sm:divide-y-0">
                {secondaryStats.map((item) => { const Icon = item.icon; return <div key={item.label} className="p-4 sm:p-5"><Icon size={16} className="text-[#82917d]"/><p className="mt-4 text-[22px] font-semibold tracking-tight">{loading ? "—" : number(item.value)}</p><p className="mt-1 text-[10px] leading-4 text-[#8c9689]">{item.label}</p></div>; })}
              </div>
            </article>

            <article className="rounded-2xl border border-[#e2e7df] bg-white">
              <div className="flex items-center justify-between border-b border-[#edf0eb] px-5 py-5 sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8b9887]">Product insights</p><h3 className="mt-2 text-base font-semibold">Produk terjual</h3></div><CreditCard size={18} className="text-[#82917d]"/></div>
              <div className="px-5 py-2 sm:px-6">
                {loading ? <p className="py-6 text-xs text-[#929b90]">Memuat data...</p> : stats.topProducts.length === 0 ? <p className="py-7 text-xs text-[#929b90]">Belum ada transaksi terkonfirmasi.</p> : stats.topProducts.map((product, index) => <div key={product.name} className="flex items-center gap-3 border-b border-[#f0f2ee] py-3.5 last:border-0"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f0f3ed] text-[10px] font-bold text-[#778572]">{String(index + 1).padStart(2,"0")}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#394338]">{product.name}</p><p className="mt-1 text-[10px] text-[#9aa296]">{number(product.quantity)} unit</p></div><p className="shrink-0 text-[11px] font-semibold text-[#65745f]">{rupiah(product.revenue)}</p></div>)}
              </div>
            </article>
          </section>

          <section className="mt-5 grid gap-3 sm:grid-cols-3">
            {[{ title: "Kelola pengguna", desc: "Akun dan akses pengguna", href: "/admin/users", icon: Users }, { title: "Kelola pesanan", desc: "Pembayaran dan pemenuhan", href: "/admin/orders", icon: CreditCard }, { title: "Activation PINs", desc: "Stok dan aktivasi kartu", href: "/admin/pins", icon: KeyRound }].map((item) => { const Icon = item.icon; return <button key={item.href} onClick={() => router.push(item.href)} className="group flex items-center gap-3 rounded-2xl border border-[#e2e7df] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#c5d2bf] hover:shadow-sm"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0f3ed] text-[#6c8065]"><Icon size={18}/></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-[#394338]">{item.title}</span><span className="mt-1 block text-[10px] text-[#929b90]">{item.desc}</span></span><ChevronRight size={16} className="text-[#a0aa9c] transition group-hover:translate-x-0.5"/></button>; })}
          </section>

          <footer className="mt-10 flex flex-col gap-2 border-t border-[#e2e7df] py-6 text-[10px] text-[#9aa296] sm:flex-row sm:items-center sm:justify-between"><span>DiTapAja · Superadmin Control Center</span><span>Tap. Review. Grow.</span></footer>
        </div>
      </section>
    </main>
  );
}
