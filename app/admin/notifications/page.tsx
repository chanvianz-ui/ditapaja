"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Bell, Check, CheckCheck, CircleAlert, Info, Loader2, RefreshCw, ShieldAlert, Smartphone } from "lucide-react";
import AdminMenu from "@/app/admin/admin-menu";
import AdminSidebar from "@/app/admin/admin-sidebar";
import AdminNotificationBell from "@/app/admin/admin-notification-bell";
import { supabase } from "@/lib/supabase";

type Notification = {
  id: string;
  event_type: string;
  severity: "info" | "important" | "critical";
  title: string;
  message: string;
  action_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
  whatsapp_eligible: boolean;
  whatsapp_status: string;
  whatsapp_attempts: number;
  whatsapp_last_error: string | null;
  whatsapp_sent_at: string | null;
  whatsapp_delivered_at: string | null;
};

type Filter = "all" | "unread" | "critical";

const eventLabels: Record<string, string> = {
  account_created: "Akun baru",
  order_created: "Pesanan baru",
  payment_proof_submitted: "Bukti pembayaran",
  payment_approved: "Pembayaran disetujui",
  payment_rejected: "Pembayaran ditolak",
  payment_refunded: "Refund",
  order_cancelled: "Pesanan dibatalkan",
  order_status_changed: "Status pesanan",
  shipping_updated: "Pengiriman",
};

const whatsappLabels: Record<string, string> = {
  skipped: "Tidak dikirim",
  pending: "Menunggu pengiriman",
  processing: "Sedang dikirim",
  sent: "Terkirim ke WhatsApp",
  delivered: "Diterima",
  read: "Dibaca",
  failed: "Gagal dikirim",
};

function dateLabel(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function safeHref(value: string | null) {
  return value && /^\/admin(?:\/|$)/.test(value) ? value : "/admin/orders";
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [whatsappConfigured, setWhatsappConfigured] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingPaymentReviewCount, setPendingPaymentReviewCount] = useState(0);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) {
        router.replace("/login");
        return;
      }
      const response = await fetch("/api/admin/notifications?limit=50", {
        headers: { Authorization: "Bearer " + data.session.access_token },
        cache: "no-store",
      });
      if (response.status === 401) { router.replace("/login"); return; }
      if (response.status === 403) throw new Error("Akun ini tidak memiliki akses Superadmin.");
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal memuat notifikasi.");
      setNotifications(Array.isArray(result.notifications) ? result.notifications : []);
      setUnreadCount(Number(result.unreadCount) || 0);
      setPendingPaymentReviewCount(Number(result.pendingPaymentReviewCount) || 0);
      setWhatsappConfigured(Boolean(result.whatsappConfigured));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat notifikasi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const connect = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!active || !session || session.user.app_metadata?.role !== "superadmin") return;
      channel = supabase.channel("superadmin-notification-center-" + session.user.id)
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "superadmin_notifications",
          filter: "recipient_id=eq." + session.user.id,
        }, () => { void load(); })
        .subscribe();
    };
    void connect();
    return () => {
      active = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [load]);

  const visible = useMemo(() => notifications.filter(item => {
    if (filter === "unread") return !item.read_at;
    if (filter === "critical") return item.severity === "critical";
    return true;
  }), [notifications, filter]);

  async function openNotification(item: Notification) {
    if (!item.read_at) await mutate("mark_read", item.id);
    router.push(safeHref(item.action_url));
  }

  async function mutate(action: string, id?: string) {
    setBusyId(id || action);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.replace("/login"); return; }
      const response = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + data.session.access_token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, ...(id ? { id } : {}) }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Aksi gagal diproses.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aksi gagal diproses.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#15181b] text-[#efede7]">
      <AdminSidebar active="notifications"/>
      <section className="min-h-screen lg:ml-[264px]">
        <header className="sticky top-0 z-20 border-b border-[#34383a] bg-[#15181b]/90 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-4 sm:px-8 lg:px-10">
            <div><p className="text-[11px] text-[#a0a3a2]">DiTapAja / Workspace</p><h1 className="mt-1 text-base font-semibold sm:text-lg">Pusat notifikasi</h1></div>
            <div className="flex items-center gap-2"><AdminNotificationBell/><button type="button" onClick={() => { setRefreshing(true); void load(); }} disabled={loading || refreshing} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#34383a] px-3 text-xs font-semibold text-[#dedbd4] hover:bg-[#22272a] disabled:opacity-50"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""}/><span className="hidden sm:inline">Perbarui</span></button><div className="lg:hidden"><AdminMenu/></div></div>
          </div>
        </header>

        <div className="mx-auto max-w-[1280px] px-4 py-7 sm:px-8 sm:py-9 lg:px-10">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#b88b6b]">Superadmin only</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Aktivitas yang perlu perhatian.</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#a0a3a2]">Satu tempat untuk akun baru, pesanan, pembayaran, dan perubahan operasional DiTapAja.</p></div>
            <button type="button" onClick={() => void mutate("mark_all_read")} disabled={unreadCount === 0 || !!busyId} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#34383a] px-4 text-xs font-semibold text-[#dedbd4] hover:bg-[#22272a] disabled:opacity-40"><CheckCheck size={15}/> Tandai semua dibaca</button>
          </div>

          {error && <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#63383e] bg-[#2b1b1d] p-4 text-sm text-[#e5a4a4]"><AlertCircle size={17} className="mt-0.5 shrink-0"/>{error}</div>}

          <section className="mb-6 grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-[#34383a] bg-[#1b1f22] p-5"><p className="text-xs text-[#a0a3a2]">Belum dibaca</p><strong className="mt-3 block text-3xl font-semibold">{unreadCount}</strong><span className="mt-1 block text-[10px] text-[#8e9695]">Notifikasi baru dan belum ditinjau</span></article>
            <article className="rounded-2xl border border-[#34383a] bg-[#1b1f22] p-5"><p className="text-xs text-[#a0a3a2]">Bukti pembayaran menunggu</p><strong className="mt-3 block text-3xl font-semibold">{pendingPaymentReviewCount}</strong><span className="mt-1 block text-[10px] text-[#8e9695]">Perlu pemeriksaan manual</span></article>
            <article className="rounded-2xl border border-[#34383a] bg-[#1b1f22] p-5"><div className="flex items-center gap-2 text-xs text-[#a0a3a2]"><Smartphone size={14}/> WhatsApp admin</div><strong className="mt-3 block text-lg font-semibold">{whatsappConfigured ? "Terhubung" : "Belum dikonfigurasi"}</strong><span className="mt-1 block text-[10px] text-[#8e9695]">{whatsappConfigured ? "Notifikasi penting siap diproses." : "Notifikasi tetap tersimpan di dashboard."}</span></article>
          </section>

          {!whatsappConfigured && <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#51412e] bg-[#211d18] p-4 sm:flex-row sm:items-center"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3b3024] text-[#d8b67c]"><Smartphone size={17}/></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">Aktifkan WhatsApp setelah Meta siap</p><p className="mt-1 text-xs leading-relaxed text-[#b9bfbe]">Tambahkan kredensial Cloud API dan nomor pribadi admin ke Environment Variables Vercel. Jangan masukkan token ke kode atau chat.</p></div><a href="https://developers.facebook.com/documentation/business-messaging/whatsapp/overview" target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#d2a17d] hover:text-white">Panduan Meta ↗</a></div>}

          <section className="overflow-hidden rounded-2xl border border-[#34383a] bg-[#1b1f22]">
            <div className="flex flex-col justify-between gap-3 border-b border-[#34383a] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
              <div><h3 className="text-sm font-semibold">Riwayat aktivitas</h3><p className="mt-1 text-[10px] text-[#8e9695]">Notifikasi terbaru, maksimal 50 item per tampilan.</p></div>
              <div className="flex flex-wrap gap-1.5">{([{id:"all",label:"Semua"},{id:"unread",label:"Belum dibaca"},{id:"critical",label:"Prioritas tinggi"}] as const).map(item=><button key={item.id} type="button" onClick={() => setFilter(item.id)} className={"rounded-lg px-3 py-2 text-[10px] font-semibold transition " + (filter===item.id ? "bg-[#493326] text-white" : "bg-[#252a2e] text-[#a0a3a2] hover:text-white")}>{item.label}</button>)}</div>
            </div>

            {loading ? <div className="flex items-center justify-center gap-2 px-5 py-16 text-xs text-[#a0a3a2]"><Loader2 size={16} className="animate-spin"/> Memuat riwayat notifikasi</div>
              : visible.length === 0 ? <div className="px-5 py-16 text-center"><Bell size={25} className="mx-auto text-[#8e9695]"/><p className="mt-3 text-sm font-semibold">Tidak ada notifikasi di filter ini</p><p className="mt-1 text-xs text-[#8e9695]">Aktivitas baru akan muncul otomatis di sini.</p></div>
              : <div className="divide-y divide-[#34383a]">{visible.map(item => {
                const Icon = item.severity === "critical" ? ShieldAlert : item.severity === "important" ? CircleAlert : Info;
                const isBusy = busyId === item.id;
                return <article key={item.id} className={"flex flex-col gap-4 px-5 py-5 transition sm:flex-row sm:items-start sm:px-6 " + (!item.read_at ? "bg-[#202529]" : "")}>
                  <span className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " + (item.severity==="critical" ? "bg-[#40272a] text-[#e5a4a4]" : item.severity==="important" ? "bg-[#3b3024] text-[#d8b67c]" : "bg-[#252a2e] text-[#b8c0c5]")}><Icon size={18}/></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold">{item.title}</span>{!item.read_at && <span className="rounded-full bg-[#493326] px-2 py-1 text-[9px] font-bold text-[#f0d5c2]">BARU</span>}<span className="rounded-full bg-[#252a2e] px-2 py-1 text-[9px] text-[#a0a3a2]">{eventLabels[item.event_type] || "Aktivitas"}</span></div>
                    <p className="mt-2 text-xs leading-relaxed text-[#b9bfbe]">{item.message}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] text-[#8e9695]"><span>{dateLabel(item.created_at)}</span><span>·</span><span>WhatsApp: {whatsappLabels[item.whatsapp_status] || item.whatsapp_status}</span>{item.whatsapp_last_error && <span className="max-w-full truncate text-[#e5a4a4]">{item.whatsapp_last_error}</span>}</div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                    <button type="button" onClick={() => void openNotification(item)} className="inline-flex h-9 items-center justify-center rounded-lg bg-[#493326] px-3 text-[10px] font-semibold text-white hover:bg-[#5a4030]">Buka detail</button>
                    {!item.read_at && <button type="button" onClick={() => void mutate("mark_read", item.id)} disabled={!!busyId} aria-label="Tandai sudah dibaca" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#34383a] text-[#a0a3a2] hover:text-white disabled:opacity-40"><Check size={14}/></button>}
                    {item.whatsapp_status==="failed" && item.whatsapp_eligible && <button type="button" onClick={() => void mutate("retry_whatsapp", item.id)} disabled={!whatsappConfigured || !!busyId} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#51412e] px-3 text-[10px] font-semibold text-[#d8b67c] disabled:opacity-40">{isBusy ? <Loader2 size={12} className="animate-spin"/> : <RefreshCw size={12}/>} Coba lagi</button>}
                  </div>
                </article>;
              })}</div>}
          </section>
          <footer className="mt-8 border-t border-[#34383a] py-5 text-[10px] text-[#8e9695]">DiTapAja · Notifikasi operasional khusus Superadmin</footer>
        </div>
      </section>
    </main>
  );
}
