"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, ArrowUpRight, Bell, CreditCard, CircleDollarSign, Clock3,
  RefreshCw, ShoppingBag, TrendingUp, Users, Wallet, MousePointerClick,
} from "lucide-react";
import AdminMenu from "@/app/admin/admin-menu";
import AdminSidebar from "@/app/admin/admin-sidebar";
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

type OverviewResponse =
  | { success: true; stats: AdminStats }
  | { success: false; error?: string };

const initialStats: AdminStats = {
  totalUsers: 0, totalCards: 0, activeCards: 0, totalTaps: 0,
  totalReviewClicks: 0, totalOrders: 0, paidOrders: 0, pendingOrders: 0,
  paidRevenue: 0, monthlyRevenue: 0, topProducts: [],
};

const number = (value: number) => Number(value || 0).toLocaleString("id-ID");
const money = (value: number) => new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", maximumFractionDigits: 0,
}).format(Number.isFinite(value) ? value : 0);

function MetricCard({ label, value, detail, icon: Icon, tone = "blue" }: {
  label: string; value: string; detail: string;
  icon: typeof Users; tone?: "blue" | "mint" | "amber" | "violet";
}) {
  return (
    <article className={`admin-overview-metric tone-${tone}`}>
      <div className="admin-overview-metric-top">
        <span>{label}</span><span className="admin-overview-metric-icon"><Icon size={18}/></span>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadStats = useCallback(async (signal?: AbortSignal) => {
    setError("");
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (signal?.aborted) return;
      if (sessionError || !data.session) {
        router.replace("/login");
        return;
      }

      const response = await fetch("/api/admin/overview", {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        cache: "no-store",
        signal,
      });
      if (signal?.aborted) return;
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      const result = await response.json() as OverviewResponse;
      if (!response.ok || !result.success) {
        throw new Error(result.success === false ? result.error || "Gagal memuat ringkasan." : "Gagal memuat ringkasan.");
      }
      setStats({
        ...initialStats,
        ...result.stats,
        topProducts: Array.isArray(result.stats.topProducts) ? result.stats.topProducts : [],
      });
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Terjadi kesalahan saat memuat data.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    void loadStats(controller.signal);
    return () => controller.abort();
  }, [loadStats]);

  const reviewRate = useMemo(() => (
    stats.totalTaps > 0
      ? Math.min(100, Math.max(0, (stats.totalReviewClicks / stats.totalTaps) * 100))
      : 0
  ), [stats.totalTaps, stats.totalReviewClicks]);

  const metrics = [
    { label: "Pengguna terdaftar", value: stats.totalUsers, detail: "Akun terdaftar", icon: Users, tone: "blue" as const },
    { label: "Kartu NFC", value: stats.totalCards, detail: `${number(stats.activeCards)} kartu aktif`, icon: CreditCard, tone: "mint" as const },
    { label: "Total interaksi", value: stats.totalTaps, detail: "Tap NFC tercatat", icon: MousePointerClick, tone: "violet" as const },
    { label: "Pesanan masuk", value: stats.totalOrders, detail: `${number(stats.paidOrders)} pesanan lunas`, icon: ShoppingBag, tone: "amber" as const },
  ];

  return (
    <main className="dt-admin-shell admin-overview-shell">
      <AdminSidebar active="overview"/>
      <section className="admin-overview-main">
        <header className="admin-overview-header">
          <div className="admin-overview-heading">
            <span className="admin-overview-eyebrow">DITAPAJA / CONTROL CENTER</span>
            <h1>Ringkasan <span>platform</span></h1>
          </div>
          <div className="admin-overview-actions">
            <span className="admin-overview-live"><i/> Sistem berjalan</span>
            <button
              type="button"
              className="admin-overview-refresh"
              onClick={() => {
                setRefreshing(true);
                void loadStats();
              }}
              disabled={loading || refreshing}
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""}/>
              <span>Perbarui</span>
            </button>
            <div className="admin-overview-mobile-menu"><AdminMenu/></div>
          </div>
        </header>

        <div className="admin-overview-content">
          <section className="admin-overview-hero">
            <div className="admin-overview-hero-copy">
              <span className="admin-overview-eyebrow">OVERVIEW / 01</span>
              <h2>Operasional<br/><em>dalam kendali.</em></h2>
              <p>Pantau aktivitas, transaksi, dan performa ekosistem DiTapAja dari satu ruang kerja.</p>
              <div className="admin-overview-hero-links">
                <button type="button" onClick={() => router.push("/admin/orders")}>Lihat pesanan <ArrowUpRight size={15}/></button>
                <button type="button" onClick={() => router.push("/admin/users")}>Kelola pengguna <ArrowUpRight size={15}/></button>
              </div>
            </div>
            <div className="admin-overview-hero-visual" aria-hidden="true">
              <div className="admin-overview-orbit orbit-a"/>
              <div className="admin-overview-orbit orbit-b"/>
              <div className="admin-overview-orbit orbit-c"/>
              <div className="admin-overview-core"><span>D.</span><small>PLATFORM<br/>OPERATIONS</small></div>
              <div className="admin-overview-float float-a"><Activity size={15}/><span>LIVE ACTIVITY</span></div>
              <div className="admin-overview-float float-b"><CircleDollarSign size={15}/><span>PAYMENT FLOW</span></div>
            </div>
            <div className="admin-overview-hero-index">DT / 2026</div>
          </section>

          {error && (
            <div className="admin-overview-error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => { setRefreshing(true); void loadStats(); }}>Coba lagi</button>
            </div>
          )}

          <section className="admin-overview-section">
            <div className="admin-overview-section-head">
              <div><span className="admin-overview-eyebrow">LIVE SNAPSHOT / 02</span><h2>Statistik utama</h2></div>
              <small>Data platform secara keseluruhan</small>
            </div>
            <div className="admin-overview-metrics">
              {metrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} value={loading ? "—" : number(metric.value)}/>
              ))}
            </div>
          </section>

          <section className="admin-overview-panels">
            <article className="admin-overview-panel admin-overview-revenue">
              <div className="admin-overview-panel-head">
                <div><span className="admin-overview-eyebrow">FINANCIAL / 03</span><h2>Performa pendapatan</h2></div>
                <span className="admin-overview-panel-icon"><Wallet size={19}/></span>
              </div>
              <div className="admin-overview-revenue-total">
                <small>Total pendapatan terkonfirmasi</small>
                <strong>{loading ? "—" : money(stats.paidRevenue)}</strong>
                <span><TrendingUp size={14}/> Berdasarkan pesanan lunas</span>
              </div>
              <div className="admin-overview-revenue-split">
                <div><small>Pendapatan bulan ini</small><b>{loading ? "—" : money(stats.monthlyRevenue)}</b></div>
                <div><small>Pesanan lunas</small><b>{loading ? "—" : number(stats.paidOrders)}</b></div>
              </div>
              <button type="button" onClick={() => router.push("/admin/orders")}>Buka manajemen pesanan <ArrowUpRight size={15}/></button>
            </article>

            <article className="admin-overview-panel admin-overview-engagement">
              <div className="admin-overview-panel-head">
                <div><span className="admin-overview-eyebrow">CUSTOMER SIGNAL / 04</span><h2>Interaksi pelanggan</h2></div>
                <span className="admin-overview-panel-icon"><Activity size={19}/></span>
              </div>
              <div className="admin-overview-engagement-main">
                <div><strong>{loading ? "—" : number(stats.totalTaps)}</strong><small>Total tap NFC</small></div>
                <div className="admin-overview-ring" style={{ "--ring-value": `${reviewRate}%` } as React.CSSProperties}>
                  <div><b>{loading ? "—" : `${reviewRate.toFixed(1)}%`}</b><small>REVIEW RATE</small></div>
                </div>
              </div>
              <div className="admin-overview-progress"><i style={{ width: `${reviewRate}%` }}/></div>
              <div className="admin-overview-engagement-foot"><span>Klik Google Review</span><b>{loading ? "—" : number(stats.totalReviewClicks)}</b></div>
              <p>Persentase interaksi NFC yang berlanjut ke halaman ulasan.</p>
            </article>
          </section>

          <section className="admin-overview-bottom">
            <article className="admin-overview-panel admin-overview-ops">
              <div className="admin-overview-panel-head"><div><span className="admin-overview-eyebrow">OPERATIONS / 05</span><h2>Perlu perhatian</h2></div><Clock3 size={18}/></div>
              <div className="admin-overview-ops-row"><span><i className="ops-dot amber"/>Menunggu verifikasi pembayaran</span><b>{loading ? "—" : number(stats.pendingOrders)}</b></div>
              <div className="admin-overview-ops-row"><span><i className="ops-dot mint"/>Kartu NFC aktif</span><b>{loading ? "—" : number(stats.activeCards)}</b></div>
              <div className="admin-overview-ops-row"><span><i className="ops-dot blue"/>Pesanan lunas</span><b>{loading ? "—" : number(stats.paidOrders)}</b></div>
              <button type="button" onClick={() => router.push("/admin/orders")}>Tinjau antrean pesanan <ArrowUpRight size={15}/></button>
            </article>

            <article className="admin-overview-panel admin-overview-products">
              <div className="admin-overview-panel-head"><div><span className="admin-overview-eyebrow">PRODUCT MIX / 06</span><h2>Produk terjual</h2></div><ShoppingBag size={18}/></div>
              {loading ? <p className="admin-overview-empty">Memuat data produk…</p> : stats.topProducts.length === 0 ? (
                <p className="admin-overview-empty">Belum ada transaksi terkonfirmasi.</p>
              ) : stats.topProducts.slice(0, 5).map((product, index) => (
                <div className="admin-overview-product" key={product.name}>
                  <span className="admin-overview-product-index">0{index + 1}</span>
                  <div><b>{product.name}</b><small>{number(product.quantity)} unit terjual</small></div>
                  <strong>{money(product.revenue)}</strong>
                </div>
              ))}
            </article>
          </section>

          <section className="admin-overview-quicklinks">
            <div><span className="admin-overview-eyebrow">WORKSPACE / 07</span><h2>Akses cepat</h2></div>
            <button type="button" onClick={() => router.push("/admin/notifications")}><Bell size={17}/><span>Notifikasi</span><ArrowUpRight size={14}/></button>
            <button type="button" onClick={() => router.push("/admin/pins")}><CreditCard size={17}/><span>Inventaris PIN</span><ArrowUpRight size={14}/></button>
            <button type="button" onClick={() => router.push("/admin/users")}><Users size={17}/><span>Manajemen pengguna</span><ArrowUpRight size={14}/></button>
          </section>
          <footer className="admin-overview-footer"><span>DiTapAja Control Center</span><span>ADMINISTRATOR WORKSPACE · 2026</span></footer>
        </div>
      </section>
    </main>
  );
}
