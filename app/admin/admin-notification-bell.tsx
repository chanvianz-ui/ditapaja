"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, ChevronRight, CircleAlert, Info, Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Notification = {
  id: string;
  event_type: string;
  severity: "info" | "important" | "critical";
  title: string;
  message: string;
  action_url: string | null;
  created_at: string;
  read_at: string | null;
};

function timeLabel(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function safeHref(value: string | null) {
  return value && /^\/admin(?:\/|$)/.test(value) ? value : "/admin/notifications";
}

export default function AdminNotificationBell() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) return;
      const response = await fetch("/api/admin/notifications?limit=6", {
        headers: { Authorization: "Bearer " + data.session.access_token },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Notifikasi belum dapat dimuat.");
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Notifikasi belum dapat dimuat.");
      setItems(Array.isArray(result.notifications) ? result.notifications : []);
      setUnread(Number(result.unreadCount) || 0);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat notifikasi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const connect = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!active || !session || session.user.app_metadata?.role !== "superadmin") {
        setLoading(false);
        return;
      }
      await load();
      if (!active) return;
      channel = supabase
        .channel("superadmin-notifications-" + session.user.id)
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

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function markRead(id: string) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    const response = await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer " + data.session.access_token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "mark_read", id }),
    });
    if (response.ok) {
      setItems(current => current.map(item => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
      setUnread(current => Math.max(0, current - 1));
    }
  }

  async function openNotification(item: Notification) {
    if (!item.read_at) await markRead(item.id);
    setOpen(false);
    router.push(safeHref(item.action_url));
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => { setOpen(value => !value); if (!open) void load(); }}
        aria-label={unread ? "Notifikasi, " + unread + " belum dibaca" : "Notifikasi"}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#34383a] bg-[#1c2023] text-[#dedbd4] transition hover:border-[#76553e] hover:text-white"
      >
        <Bell size={17}/>
        {unread > 0 && <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#15181b] bg-[#b66f45] px-1 text-[9px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>}
      </button>

      {open && (
        <section role="dialog" aria-label="Notifikasi terbaru" className="absolute right-0 z-50 mt-3 w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#34383a] bg-[#1b1f22] text-[#efede7] shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-[#34383a] px-4 py-4">
            <div><p className="text-sm font-semibold">Notifikasi</p><p className="mt-0.5 text-[10px] text-[#a0a3a2]">{unread} belum dibaca</p></div>
            <button type="button" onClick={() => { setOpen(false); router.push("/admin/notifications"); }} className="text-[10px] font-semibold text-[#d2a17d] hover:text-white">Lihat semua</button>
          </div>
          {error && <p className="px-4 py-3 text-xs text-[#e5a4a4]">{error}</p>}
          {loading ? <div className="flex items-center justify-center gap-2 px-4 py-8 text-xs text-[#a0a3a2]"><Loader2 size={15} className="animate-spin"/> Memuat notifikasi</div>
            : items.length === 0 ? <div className="px-4 py-9 text-center"><Bell size={20} className="mx-auto text-[#a0a3a2]"/><p className="mt-2 text-xs text-[#a0a3a2]">Belum ada notifikasi.</p></div>
            : <div className="max-h-[390px] overflow-y-auto">{items.map(item => {
              const Icon = item.severity === "critical" ? ShieldAlert : item.severity === "important" ? CircleAlert : Info;
              return <button key={item.id} type="button" onClick={() => void openNotification(item)} className={"flex w-full gap-3 border-b border-[#34383a] px-4 py-3.5 text-left transition hover:bg-[#252a2e] " + (!item.read_at ? "bg-[#22272a]" : "")}>
                <span className={"mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg " + (item.severity === "critical" ? "bg-[#40272a] text-[#e5a4a4]" : item.severity === "important" ? "bg-[#3b3024] text-[#d8b67c]" : "bg-[#252a2e] text-[#b8c0c5]")}><Icon size={15}/></span>
                <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><b className="truncate text-xs">{item.title}</b>{!item.read_at && <i className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#d2a17d]"/>}</span><span className="mt-1 line-clamp-2 block text-[11px] leading-relaxed text-[#b9bfbe]">{item.message}</span><span className="mt-2 block text-[9px] text-[#8e9695]">{timeLabel(item.created_at)}</span></span>
                <ChevronRight size={15} className="mt-2 shrink-0 text-[#8e9695]"/>
              </button>;
            })}</div>}
          <button type="button" onClick={() => { setOpen(false); router.push("/admin/notifications"); }} className="flex w-full items-center justify-center gap-2 px-4 py-3 text-[10px] font-semibold text-[#d2a17d] hover:bg-[#252a2e]"><Check size={13}/> Pusat notifikasi <ChevronRight size={13}/></button>
        </section>
      )}
    </div>
  );
}
