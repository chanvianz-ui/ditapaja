"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  BarChart3,
  LogOut,
  Plus,
  MousePointerClick,
  Users,
  ExternalLink,
  Loader2,
  Pencil,
  Power,
  Trash2,
  AlertTriangle,
  X,
  Save,
  Settings,
  Nfc,
  CheckCircle2,
  QrCode,
  Download,
  Eye,
  FileSpreadsheet,
  Building2,
  Bell,
  Package,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "../../lib/supabase";

type Profile = {
  full_name: string | null;
};

type NfcCard = {
  id: string;
  card_name: string | null;
  public_code: string;
  destination_url: string;
  active: boolean;
  location_id?: string | null;
};

type AnalyticsEvent = {
  card_id: string;
  event_type: string;
  visitor_hash: string | null;
  created_at: string;
};

type Analytics = {
  totalTaps: number;
  uniqueVisitors: number;
  reviewClicks: number;
  ctr: number;
};

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cards, setCards] = useState<NfcCard[]>([]);
  const [email, setEmail] = useState("");

  const [, setAnalytics] = useState<Analytics>({
    totalTaps: 0,
    uniqueVisitors: 0,
    reviewClicks: 0,
    ctr: 0,
  });

  const [analyticsError, setAnalyticsError] = useState("");
  const [chartPeriod, setChartPeriod] = useState<7 | 30 | 90>(7);
  const [eventRows, setEventRows] = useState<AnalyticsEvent[]>([]);
  const [selectedCardId, setSelectedCardId] = useState("all");
  const [selectedLocationId, setSelectedLocationId] = useState("all");
  const [businessLocations, setBusinessLocations] = useState<{id:string;name:string}[]>([]);
  const [qrForeground, setQrForeground] = useState("#111827");
  const [qrBackground, setQrBackground] = useState("#ffffff");

  const selectedEventRows = useMemo(() => {
    let rows = eventRows;
    if (selectedCardId !== "all") rows = rows.filter((event) => event.card_id === selectedCardId);
    if (selectedLocationId !== "all") {
      const locationCardIds = new Set(cards.filter((card) => selectedLocationId === "unassigned" ? !card.location_id : card.location_id === selectedLocationId).map((card) => card.id));
      rows = rows.filter((event) => locationCardIds.has(event.card_id));
    }
    return rows;
  }, [eventRows, selectedCardId, selectedLocationId, cards]);

  const displayedAnalytics = useMemo<Analytics>(() => {
    const tapEvents = selectedEventRows.filter((event) => event.event_type === "tap");
    const reviewEvents = selectedEventRows.filter((event) => event.event_type === "review_click");
    const uniqueHashes = new Set(
      tapEvents
        .map((event) => event.visitor_hash)
        .filter((hash): hash is string => Boolean(hash))
    );
    const totalTaps = tapEvents.length;
    const reviewClicks = reviewEvents.length;

    return {
      totalTaps,
      uniqueVisitors: uniqueHashes.size,
      reviewClicks,
      ctr: totalTaps > 0 ? (reviewClicks / totalTaps) * 100 : 0,
    };
  }, [selectedEventRows]);

  const [editingCard, setEditingCard] = useState<NfcCard | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [savingCard, setSavingCard] = useState(false);
  const [updatingCardId, setUpdatingCardId] = useState<string | null>(null);
  const [cardMessage, setCardMessage] = useState("");
  const [cardError, setCardError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<NfcCard | null>(null);
  const [deletingCard, setDeletingCard] = useState(false);
  const [writingCardId, setWritingCardId] = useState<string | null>(null);
  const [nfcMessage, setNfcMessage] = useState("");
  const [nfcError, setNfcError] = useState("");
  const [qrCard, setQrCard] = useState<NfcCard | null>(null);
  const [changeLogs, setChangeLogs] = useState<any[]>([]);
  const [changeLogUnavailable, setChangeLogUnavailable] = useState(false);

  const chartData = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: chartPeriod }, (_, index) => {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (chartPeriod - 1 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      return {
        key,
        label:
          chartPeriod === 7
            ? date.toLocaleDateString("id-ID", { weekday: "short" })
            : date.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              }),
        taps: 0,
        clicks: 0,
      };
    });

    const dayMap = new Map(days.map((day) => [day.key, day]));

    selectedEventRows.forEach((event) => {
      const date = new Date(event.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const day = dayMap.get(key);
      if (!day) return;

      if (event.event_type === "tap") day.taps += 1;
      if (event.event_type === "review_click") day.clicks += 1;
    });

    return days;
  }, [selectedEventRows, chartPeriod]);

  const chartMax = Math.max(
    1,
    ...chartData.map((day) => Math.max(day.taps, day.clicks))
  );

  const cardPerformance = useMemo(() => cards.map((card) => {
    const rows = eventRows.filter((event) => event.card_id === card.id);
    const taps = rows.filter((event) => event.event_type === "tap");
    const clicks = rows.filter((event) => event.event_type === "review_click").length;
    const visitors = new Set(taps.map((event) => event.visitor_hash).filter(Boolean));
    return { card, taps: taps.length, clicks, visitors: visitors.size, ctr: taps.length ? clicks / taps.length * 100 : 0 };
  }).sort((a, b) => b.taps - a.taps), [cards, eventRows]);

  function exportAnalyticsCsv() {
    const rows = selectedEventRows.map((event) => {
      const card = cards.find((item) => item.id === event.card_id);
      return [card?.card_name || "Untitled Card", event.event_type === "tap" ? "Tap" : "Review Click", new Date(event.created_at).toLocaleString("id-ID")];
    });
    const csv = [["Nama Kartu", "Aktivitas", "Waktu"], ...rows]
      .map((row) => row.map((value) => '"' + String(value).replace(/"/g, '""') + '"').join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ditapaja-analytics-" + new Date().toISOString().slice(0, 10) + ".csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function downloadQrPng(card: NfcCard) {
    const canvas = document.getElementById("ditapaja-qr-" + card.public_code) as HTMLCanvasElement | null;
    if (!canvas) return;
    const anchor = document.createElement("a");
    anchor.href = canvas.toDataURL("image/png");
    anchor.download = "ditapaja-qr-" + card.public_code + ".png";
    anchor.click();
  }

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          router.replace("/login");
          return;
        }

        setEmail(data.user.email ?? "");

        const [profileResult, cardsResult, locationsResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("full_name")
            .eq("id", data.user.id)
            .maybeSingle(),

          supabase
            .from("nfc_cards")
            .select("id, card_name, public_code, destination_url, active, location_id")
            .eq("user_id", data.user.id)
            .order("created_at", { ascending: false }),

          supabase
            .from("business_locations")
            .select("id,name")
            .eq("user_id", data.user.id)
            .order("name"),
        ]);

        if (cardsResult.error) {
          console.error("Card loading error:", cardsResult.error);
          throw cardsResult.error;
        }

        let currentProfile = profileResult.data;

        // Repair profiles that were not created when email confirmation was required.
        if (!currentProfile && typeof data.user.user_metadata?.full_name === "string") {
          const fullName = data.user.user_metadata.full_name.trim();
          if (fullName) {
            const { data: repairedProfile, error: profileSyncError } = await supabase
              .from("profiles")
              .upsert({ id: data.user.id, full_name: fullName })
              .select("full_name")
              .single();

            if (profileSyncError) {
              console.error("Profile sync error:", profileSyncError);
            } else {
              currentProfile = repairedProfile;
            }
          }
        }

        setProfile(currentProfile);

        const userCards = (cardsResult.data ?? []) as NfcCard[];
        setCards(userCards);
        setBusinessLocations(locationsResult.data ?? []);

        const { data: logs, error: logsError } = await supabase
          .from("nfc_card_change_logs")
          .select("id, card_id, change_type, old_values, new_values, created_at")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false })
          .limit(30);
        if (logsError) {
          console.warn("Card history is not available yet:", logsError.message);
          setChangeLogUnavailable(true);
        } else {
          setChangeLogs(logs ?? []);
        }

        if (userCards.length > 0) {
          const cardIds = userCards.map((card) => card.id);

          const { data: events, error: eventsError } = await supabase
            .from("tap_events")
            .select("card_id, event_type, visitor_hash, created_at")
            .in("card_id", cardIds)
            .in("event_type", ["tap", "review_click"]);

          if (eventsError) {
            console.error("Analytics loading error:", eventsError);
            setAnalyticsError(
              "Statistik belum dapat dimuat. Periksa izin akses database."
            );
          } else {
            const allEvents = (events ?? []) as AnalyticsEvent[];
            setEventRows(allEvents);

            const tapEvents = allEvents.filter(
              (event) => event.event_type === "tap"
            );
            const reviewEvents = allEvents.filter(
              (event) => event.event_type === "review_click"
            );

            const uniqueHashes = new Set(
              tapEvents
                .map((event) => event.visitor_hash)
                .filter((hash): hash is string => Boolean(hash))
            );

            const totalTaps = tapEvents.length;
            const reviewClicks = reviewEvents.length;

            setAnalytics({
              totalTaps,
              uniqueVisitors: uniqueHashes.size,
              reviewClicks,
              ctr: totalTaps > 0 ? (reviewClicks / totalTaps) * 100 : 0,
            });
          }
        } else {
          setEventRows([]);
          setAnalytics({
            totalTaps: 0,
            uniqueVisitors: 0,
            reviewClicks: 0,
            ctr: 0,
          });
        }
      } catch (error) {
        console.error("Dashboard loading error:", error);
        setAnalyticsError("Terjadi kesalahan saat memuat dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function openEditCard(card: NfcCard) {
    setEditingCard(card);
    setEditName(card.card_name ?? "");
    setEditUrl(card.destination_url);
    setCardMessage("");
    setCardError("");
  }

  function isGoogleMapsUrl(value: string) {
    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase();

      const isDirectReviewLink =
        host === "search.google.com" &&
        url.pathname === "/local/writereview" &&
        url.searchParams.has("placeid");

      const isMapsLink =
        host === "maps.google.com" ||
        host === "www.google.com" ||
        host === "google.com" ||
        host === "goo.gl" ||
        host === "maps.app.goo.gl";

      return (
        url.protocol === "https:" &&
        (isDirectReviewLink || isMapsLink)
      );
    } catch {
      return false;
    }
  }

  async function handleSaveCard() {
    if (!editingCard) return;

    const trimmedName = editName.trim();
    const trimmedUrl = editUrl.trim();

    if (!trimmedName) {
      setCardError("Nama kartu tidak boleh kosong.");
      return;
    }

    if (!isGoogleMapsUrl(trimmedUrl)) {
      setCardError("Masukkan URL Google Maps yang valid (HTTPS).");
      return;
    }

    setSavingCard(true);
    setCardError("");
    setCardMessage("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        router.replace("/login");
        return;
      }

      const { error } = await supabase
        .from("nfc_cards")
        .update({
          card_name: trimmedName,
          destination_url: trimmedUrl,
        })
        .eq("id", editingCard.id)
        .eq("user_id", authData.user.id);

      if (error) throw error;

      setCards((current) =>
        current.map((card) =>
          card.id === editingCard.id
            ? {
                ...card,
                card_name: trimmedName,
                destination_url: trimmedUrl,
              }
            : card
        )
      );

      setEditingCard(null);
      setCardMessage("Perubahan kartu berhasil disimpan.");
    } catch (error) {
      console.error("Card update error:", error);
      setCardError("Gagal menyimpan perubahan. Coba lagi.");
    } finally {
      setSavingCard(false);
    }
  }

  async function handleToggleCard(card: NfcCard) {
    setUpdatingCardId(card.id);
    setCardError("");
    setCardMessage("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        router.replace("/login");
        return;
      }

      const nextActive = !card.active;

      const { error } = await supabase
        .from("nfc_cards")
        .update({ active: nextActive })
        .eq("id", card.id)
        .eq("user_id", authData.user.id);

      if (error) throw error;

      setCards((current) =>
        current.map((item) =>
          item.id === card.id ? { ...item, active: nextActive } : item
        )
      );

      setCardMessage(
        nextActive
          ? "Kartu berhasil diaktifkan."
          : "Kartu berhasil dinonaktifkan."
      );
    } catch (error) {
      console.error("Card status update error:", error);
      setCardError("Gagal mengubah status kartu. Coba lagi.");
    } finally {
      setUpdatingCardId(null);
    }
  }

  async function handleWriteNfc(card: NfcCard) {
    setNfcMessage("");
    setNfcError("");

    if (!card.active) {
      setNfcError("Aktifkan kartu terlebih dahulu sebelum menulis NFC.");
      return;
    }

    if (typeof window === "undefined" || !("NDEFReader" in window)) {
      setNfcError(
        "Browser ini belum mendukung penulisan NFC. Gunakan Chrome di Android dengan NFC aktif."
      );
      return;
    }

    const nfcUrl = `${window.location.origin}/c/${card.public_code}`;
    setWritingCardId(card.id);

    try {
      const NDEFReaderClass = (window as any).NDEFReader;
      const reader = new NDEFReaderClass();
      await reader.write({
        records: [{ recordType: "url", data: nfcUrl }],
      });
      setNfcMessage(`Berhasil menulis URL ke kartu ${card.card_name || "NFC"}.`);
    } catch (error: any) {
      console.error("NFC write error:", error);
      if (error?.name === "NotAllowedError") {
        setNfcError("Izin NFC ditolak. Izinkan akses NFC pada browser.");
      } else if (error?.name === "NotSupportedError") {
        setNfcError("Kartu NFC tidak kompatibel atau tidak dapat ditulis.");
      } else if (error?.name === "AbortError") {
        setNfcError("Penulisan NFC dibatalkan. Coba tempelkan kartu lagi.");
      } else {
        setNfcError("Gagal menulis kartu. Pastikan NFC aktif dan dekatkan kartu ke HP.");
      }
    } finally {
      setWritingCardId(null);
    }
  }

  async function handleDeleteCard() {
    if (!deleteTarget) return;

    setDeletingCard(true);
    setCardError("");
    setCardMessage("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        router.replace("/login");
        return;
      }

      const { error } = await supabase
        .from("nfc_cards")
        .delete()
        .eq("id", deleteTarget.id)
        .eq("user_id", authData.user.id);

      if (error) throw error;

      const deletedId = deleteTarget.id;
      setCards((current) => current.filter((card) => card.id !== deletedId));
      setEventRows((current) => current.filter((event) => event.card_id !== deletedId));
      setSelectedCardId((current) => current === deletedId ? "all" : current);
      setDeleteTarget(null);
      setCardMessage("Kartu dan riwayat aktivitasnya berhasil dihapus.");
    } catch (error) {
      console.error("Card deletion error:", error);
      setCardError("Gagal menghapus kartu. Periksa izin DELETE di Supabase, lalu coba lagi.");
    } finally {
      setDeletingCard(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const displayName =
    profile?.full_name || email.split("@")[0] || "User";

  const analyticsItems = [
    {
      label: "Total Taps",
      value: displayedAnalytics.totalTaps.toLocaleString("id-ID"),
      icon: MousePointerClick,
      description: "Total aktivitas tap seluruh kartu.",
    },
    {
      label: "Unique Visitors",
      value: displayedAnalytics.uniqueVisitors.toLocaleString("id-ID"),
      icon: Users,
      description: "Pengunjung dengan identitas hash berbeda.",
    },
    {
      label: "Review Clicks",
      value: displayedAnalytics.reviewClicks.toLocaleString("id-ID"),
      icon: ExternalLink,
      description: "Jumlah klik menuju Google Maps.",
    },
    {
      label: "CTR",
      value: `${displayedAnalytics.ctr.toFixed(1)}%`,
      icon: BarChart3,
      description: "Persentase tap yang berlanjut ke review.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-6 lg:flex lg:flex-col">
          <a href="/" className="text-2xl font-bold tracking-tight">
            DiTap<span className="text-blue-600">Aja.</span>
          </a>

          <p className="mt-12 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Workspace
          </p>

          <nav className="mt-4 space-y-2">
            <a className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              <LayoutDashboard size={19} /> Overview
            </a>

            <a
              href="#cards"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
            >
              <CreditCard size={19} /> My Cards
            </a>

            <a
              href="#analytics"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
            >
              <BarChart3 size={19} /> Analytics
            </a>

            <a
              href="/dashboard/business"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
            >
              <Building2 size={19} /> Business Profile
            </a>

            <a
              href="/dashboard/notifications"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
            >
              <Bell size={19} /> Notifications
            </a>

            <a
              href="/dashboard/orders"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
            >
              <Package size={19} /> Orders
            </a>
          </nav>

          <div className="mt-auto border-t border-slate-100 pt-5">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={19} /> Sign Out
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-5 md:px-10">
            <div>
              <p className="text-xs text-slate-400">
                Workspace / Overview
              </p>
              <h1 className="mt-1 text-xl font-bold">Dashboard</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard/settings")}
                aria-label="Account Settings"
                title="Account Settings"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <Settings size={18} />
              </button>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">{displayName}</p>
                <p className="text-xs text-slate-400">{email}</p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-8 p-5 md:p-10">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm text-slate-500">Welcome back,</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight">
                  {displayName} 👋
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Pantau performa kartu NFC kamu dari sini.
                </p>
              </div>

              <button
                onClick={() => router.push("/dashboard/cards/new")}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
              >
                <Plus size={18} /> Add New Card
              </button>
            </div>

            {cards.length === 0 && (
              <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-5 shadow-sm sm:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">MULAI DI SINI</p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">Siapkan kartu pertamamu</h3>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">Ikuti tiga langkah singkat untuk mulai menerima tap dan memantau aktivitas pelanggan.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-blue-100 bg-white p-3"><b className="text-xs text-blue-600">01 · Tambahkan</b><p className="mt-1 text-xs text-slate-500">Buat kartu dan masukkan link Google Review.</p></div><div className="rounded-xl border border-blue-100 bg-white p-3"><b className="text-xs text-blue-600">02 · Pasang</b><p className="mt-1 text-xs text-slate-500">Tulis NFC atau gunakan QR Code pada kartu.</p></div><div className="rounded-xl border border-blue-100 bg-white p-3"><b className="text-xs text-blue-600">03 · Pantau</b><p className="mt-1 text-xs text-slate-500">Lihat tap dan klik review di analytics.</p></div></div>
                <a href="/panduan" className="mt-4 inline-flex text-xs font-bold text-blue-700 hover:text-blue-800">Buka panduan lengkap →</a>
              </section>
            )}

            {/* ANALYTICS */}
            <div
              id="analytics"
              className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
            >
              {analyticsItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <item.icon className="text-blue-600" size={20} />
                  </div>
                  <p className="mt-5 text-3xl font-bold tabular-nums">
                    {item.value}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            {/* DAILY ANALYTICS CHART */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-bold">Performance Overview</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedCardId === "all"
                      ? "Perbandingan aktivitas seluruh kartu."
                      : `Performa kartu ${cards.find((card) => card.id === selectedCardId)?.card_name || "terpilih"}.`}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex max-w-full flex-wrap gap-2" role="group" aria-label="Pilih kartu untuk melihat analytics">
                    <button
                      type="button"
                      onClick={() => setSelectedCardId("all")}
                      aria-pressed={selectedCardId === "all"}
                      className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                        selectedCardId === "all"
                          ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      Semua Kartu
                    </button>
                    {cards.map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setSelectedCardId(card.id)}
                        aria-pressed={selectedCardId === card.id}
                        className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                          selectedCardId === card.id
                            ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20"
                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                        }`}
                      >
                        {card.card_name || "Untitled Card"}
                      </button>
                    ))}
                  </div>

                  {businessLocations.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <label htmlFor="location-filter" className="text-xs font-semibold text-slate-500">Lokasi</label>
                      <select id="location-filter" value={selectedLocationId} onChange={(event) => setSelectedLocationId(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 outline-none focus:border-blue-400">
                        <option value="all">Semua lokasi</option>
                        {businessLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                        <option value="unassigned">Tanpa lokasi</option>
                      </select>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex w-fit rounded-xl bg-slate-100 p-1">
                      {([7, 30, 90] as const).map((period) => (
                      <button key={period} onClick={() => setChartPeriod(period)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${chartPeriod === period ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                        {period} Hari
                      </button>
                      ))}
                    </div>
                    <button type="button" onClick={exportAnalyticsCsv} disabled={selectedEventRows.length === 0} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"><FileSpreadsheet size={15}/> Export CSV</button>
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-5 text-xs text-slate-500">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
                  Total Taps
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-sky-300" />
                  Review Clicks
                </span>
              </div>

              <div className="mt-5 flex h-56 items-end gap-1 border-b border-slate-100 pb-2 sm:gap-2">
                {chartData.map((day, index) => (
                  <div
                    key={day.key}
                    className="flex h-full min-w-0 flex-1 flex-col justify-end"
                  >
                    <div className="flex h-full items-end justify-center gap-0.5 sm:gap-1">
                      <div
                        title={`${day.taps} taps`}
                        className="w-1/2 max-w-5 rounded-t-md bg-blue-600 transition-all"
                        style={{
                          height: `${(day.taps / chartMax) * 100}%`,
                          minHeight: day.taps > 0 ? "3px" : "0",
                        }}
                      />
                      <div
                        title={`${day.clicks} review clicks`}
                        className="w-1/2 max-w-5 rounded-t-md bg-sky-300 transition-all"
                        style={{
                          height: `${(day.clicks / chartMax) * 100}%`,
                          minHeight: day.clicks > 0 ? "3px" : "0",
                        }}
                      />
                    </div>
                    {(chartPeriod === 7 ||
                      index % (chartPeriod === 30 ? 5 : 15) === 0) && (
                      <span className="mt-2 truncate text-center text-[10px] text-slate-400">
                        {day.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {selectedEventRows.length === 0 && (
                <p className="mt-4 text-center text-xs text-slate-400">
                  Belum ada aktivitas untuk ditampilkan.
                </p>
              )}
            </section>

            {cards.length > 1 && (
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5"><h3 className="font-bold">Perbandingan Kartu</h3><p className="mt-1 text-sm text-slate-500">Urutan kartu berdasarkan total tap yang tercatat.</p></div>
                <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3 font-semibold">Kartu</th><th className="px-4 py-3 font-semibold">Taps</th><th className="px-4 py-3 font-semibold">Clicks</th><th className="px-4 py-3 font-semibold">CTR</th><th className="px-5 py-3 font-semibold">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{cardPerformance.map((item) => <tr key={item.card.id}><td className="px-5 py-3 font-semibold text-slate-700">{item.card.card_name || "Untitled Card"}</td><td className="px-4 py-3 tabular-nums">{item.taps.toLocaleString("id-ID")}</td><td className="px-4 py-3 tabular-nums">{item.clicks.toLocaleString("id-ID")}</td><td className="px-4 py-3 tabular-nums">{item.ctr.toFixed(1)}%</td><td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.card.active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>{item.card.active ? "Active" : "Inactive"}</span></td></tr>)}</tbody></table></div>
              </section>
            )}

            {cards.length > 0 && (
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5"><h3 className="font-bold">Riwayat Perubahan</h3><p className="mt-1 text-sm text-slate-500">Perubahan nama, link tujuan, dan status kartu.</p></div>
                {changeLogUnavailable ? <p className="px-6 py-5 text-xs leading-5 text-slate-400">Riwayat belum diaktifkan. Jalankan migration Supabase yang disertakan pada repository untuk mengaktifkannya.</p> : changeLogs.length === 0 ? <p className="px-6 py-5 text-xs text-slate-400">Belum ada perubahan kartu yang tercatat.</p> : <div className="divide-y divide-slate-100">{changeLogs.map((log) => { const card = cards.find((item) => item.id === log.card_id); const label = log.change_type === "destination_url" ? "Link tujuan diperbarui" : log.change_type === "active" ? "Status kartu diubah" : "Nama kartu diperbarui"; return <div key={log.id} className="flex items-center justify-between gap-3 px-6 py-3"><div className="min-w-0"><p className="text-xs font-semibold text-slate-700">{label}</p><p className="mt-1 truncate text-[11px] text-slate-400">{card?.card_name || "Kartu"}</p></div><time className="shrink-0 text-[10px] text-slate-400">{new Date(log.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</time></div>; })}</div>}
              </section>
            )}

            {analyticsError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                {analyticsError}
              </div>
            )}

            {cardMessage && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {cardMessage}
              </div>
            )}

            {cardError && !editingCard && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {cardError}
              </div>
            )}

            {nfcMessage && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                <CheckCircle2 className="mr-2 inline" size={17} />{nfcMessage}
              </div>
            )}
            {nfcError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                {nfcError}
              </div>
            )}

            {/* NFC CARDS */}
            <div
              id="cards"
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <div>
                  <h3 className="font-bold">My NFC Cards</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Kelola nama, tujuan, dan status kartu NFC kamu.
                  </p>
                </div>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {cards.length} Cards
                </span>
              </div>

              {cards.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <CreditCard size={26} />
                  </div>
                  <h4 className="mt-5 font-semibold">
                    Belum ada kartu NFC
                  </h4>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                    Tambahkan kartu NFC pertama kamu untuk mulai
                    mengumpulkan data tap.
                  </p>
                  <button
                    onClick={() => router.push("/dashboard/cards/new")}
                    className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Tambahkan Kartu
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">
                            {card.card_name || "Untitled Card"}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              card.active
                                ? "bg-green-50 text-green-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {card.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          Code: {card.public_code}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {card.location_id ? (
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">{businessLocations.find((location) => location.id === card.location_id)?.name || "Cabang bisnis"}</span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">Belum ditautkan ke cabang</span>
                          )}
                          {(() => {
                            const cardTaps = eventRows.filter((event) => event.card_id === card.id && event.event_type === "tap");
                            const latestTap = cardTaps.reduce<string | null>((latest, event) => !latest || event.created_at > latest ? event.created_at : latest, null);
                            const health = !card.active ? "Nonaktif" : cardTaps.length === 0 ? "Belum pernah digunakan" : "Berfungsi · " + new Date(latestTap as string).toLocaleDateString("id-ID");
                            return <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${!card.active ? "bg-slate-100 text-slate-500" : cardTaps.length === 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{health}</span>;
                          })()}
                        </div>
                        <p className="mt-1 max-w-md truncate text-sm text-slate-500">
                          {card.destination_url}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <button onClick={() => setQrCard(card)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700" title="Tampilkan QR Code kartu"><QrCode size={16}/> QR Code</button>
                        <button onClick={() => window.open("/c/" + card.public_code, "_blank", "noopener,noreferrer")} disabled={!card.active} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40" title="Preview halaman publik kartu"><Eye size={16}/> Preview</button>
                        <button
                          onClick={() => handleWriteNfc(card)}
                          disabled={writingCardId !== null || !card.active}
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Tulis URL DiTapAja ke kartu NFC"
                        >
                          {writingCardId === card.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Nfc size={16} />
                          )}
                          {writingCardId === card.id ? "Tempelkan Kartu..." : "Tulis NFC"}
                        </button>

                        <button
                          onClick={() => openEditCard(card)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>

                        <button
                          onClick={() => handleToggleCard(card)}
                          disabled={updatingCardId === card.id}
                          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                            card.active
                              ? "border border-red-100 text-red-600 hover:bg-red-50"
                              : "border border-green-100 text-green-700 hover:bg-green-50"
                          }`}
                        >
                          {updatingCardId === card.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Power size={16} />
                          )}
                          {card.active ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          onClick={() => {
                            setDeleteTarget(card);
                            setCardError("");
                          }}
                          disabled={updatingCardId === card.id || deletingCard}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-100 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-center text-xs text-slate-400">
              DiTapAja · Free Dashboard · No Monthly Subscription
            </p>
          </div>
        </section>
      </div>

      {/* QR CODE MODAL */}
      {qrCard && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={() => setQrCard(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="qr-card-title" className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between text-left"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">DITAPAJA · QR ACCESS</p><h3 id="qr-card-title" className="mt-1 text-lg font-bold text-slate-900">{qrCard.card_name || "Untitled Card"}</h3></div><button type="button" onClick={() => setQrCard(null)} aria-label="Tutup QR Code" className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><X size={19}/></button></div>
            <div className="mx-auto my-6 inline-flex rounded-2xl border border-slate-100 bg-white p-4"><QRCodeCanvas id={"ditapaja-qr-" + qrCard.public_code} value={typeof window !== "undefined" ? window.location.origin + "/c/" + qrCard.public_code : "https://ditapaja.web.id/c/" + qrCard.public_code} size={220} level="H" includeMargin fgColor={qrForeground} bgColor={qrBackground} /></div>
            <p className="break-all text-xs text-slate-400">ditapaja.web.id/c/{qrCard.public_code}</p><p className="mt-2 text-xs leading-5 text-slate-500">Scan QR ini untuk membuka halaman review kartu.</p>
            <div className="grid grid-cols-2 gap-3 text-left">
              <label className="rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-600">Warna QR<input type="color" value={qrForeground} onChange={(event) => setQrForeground(event.target.value)} className="mt-2 h-9 w-full cursor-pointer rounded"/></label>
              <label className="rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-600">Warna latar<input type="color" value={qrBackground} onChange={(event) => setQrBackground(event.target.value)} className="mt-2 h-9 w-full cursor-pointer rounded"/></label>
            </div>
            <button type="button" onClick={() => downloadQrPng(qrCard)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><Download size={17}/> Download QR PNG</button>
          </div>
        </div>
      )}

      {/* DELETE CARD CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-card-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertTriangle size={24} />
            </div>
            <h3 id="delete-card-title" className="mt-5 text-lg font-bold text-slate-900">
              Hapus kartu ini?
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Kamu akan menghapus <strong>{deleteTarget.card_name || "Untitled Card"}</strong> secara permanen.
              Seluruh riwayat tap dan review click kartu ini juga akan ikut terhapus. Tindakan ini tidak bisa dibatalkan.
            </p>

            {cardError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {cardError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!deletingCard) {
                    setDeleteTarget(null);
                    setCardError("");
                  }
                }}
                disabled={deletingCard}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteCard}
                disabled={deletingCard}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingCard ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Trash2 size={17} />
                )}
                {deletingCard ? "Menghapus..." : "Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CARD MODAL */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">Edit NFC Card</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Perbarui informasi kartu NFC kamu.
                </p>
              </div>
              <button
                onClick={() => {
                  if (!savingCard) {
                    setEditingCard(null);
                    setCardError("");
                  }
                }}
                disabled={savingCard}
                aria-label="Close edit form"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="card-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Nama Kartu
                </label>
                <input
                  id="card-name"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  maxLength={60}
                  placeholder="Contoh: Kartu Staff"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="card-url"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Google Maps Review URL
                </label>
                <input
                  id="card-url"
                  type="url"
                  value={editUrl}
                  onChange={(event) => setEditUrl(event.target.value)}
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
                <p className="mt-2 text-xs text-slate-400">
                  Gunakan link Google Maps yang mengarah ke halaman ulasan bisnis.
                </p>
              </div>

              {cardError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {cardError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  onClick={() => {
                    setEditingCard(null);
                    setCardError("");
                  }}
                  disabled={savingCard}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCard}
                  disabled={savingCard}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingCard ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}
                  {savingCard ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}