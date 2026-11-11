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
  Copy,
  Eye,
  FileSpreadsheet,
  Building2,
  Bell,
  Package,
  Printer,
} from "lucide-react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
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
  const [qrLinkCopied, setQrLinkCopied] = useState(false);
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);
  const [cardSearch, setCardSearch] = useState("");
  const [cardStatusFilter, setCardStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const visibleCards = useMemo(() => {
    const query = cardSearch.trim().toLowerCase();
    return cards.filter((card) => {
      const matchesQuery = !query || [card.card_name || "", card.public_code, card.destination_url]
        .some((value) => value.toLowerCase().includes(query));
      const matchesStatus = cardStatusFilter === "all"
        || (cardStatusFilter === "active" ? card.active : !card.active);
      return matchesQuery && matchesStatus;
    });
  }, [cards, cardSearch, cardStatusFilter]);

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
  const [editLocationId, setEditLocationId] = useState("");
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
  const [showBulkQrSheet, setShowBulkQrSheet] = useState(false);
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

  const periodTapTotal = chartData.reduce((sum, day) => sum + day.taps, 0);
  const periodClickTotal = chartData.reduce((sum, day) => sum + day.clicks, 0);
  const hasPeriodActivity = periodTapTotal > 0 || periodClickTotal > 0;

  // Aggregate analytics once per card instead of repeatedly scanning the full event list.
  const cardEventStats = useMemo(() => {
    const stats = new Map<string, { taps: number; clicks: number; visitors: Set<string> }>();
    for (const event of selectedEventRows) {
      let item = stats.get(event.card_id);
      if (!item) {
        item = { taps: 0, clicks: 0, visitors: new Set<string>() };
        stats.set(event.card_id, item);
      }
      if (event.event_type === "tap") {
        item.taps += 1;
        if (event.visitor_hash) item.visitors.add(event.visitor_hash);
      } else if (event.event_type === "review_click") {
        item.clicks += 1;
      }
    }
    return stats;
  }, [selectedEventRows]);

  const latestTapByCard = useMemo(() => {
    const latest = new Map<string, string>();
    for (const event of eventRows) {
      if (event.event_type !== "tap") continue;
      const previous = latest.get(event.card_id);
      if (!previous || event.created_at > previous) latest.set(event.card_id, event.created_at);
    }
    return latest;
  }, [eventRows]);

  const analyticsInsights = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const currentStart = new Date();
    currentStart.setHours(0, 0, 0, 0);
    currentStart.setDate(currentStart.getDate() - (chartPeriod - 1));
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - chartPeriod);
    const previousEnd = new Date(currentStart.getTime() - 1);

    const current = { taps: 0, clicks: 0 };
    const previous = { taps: 0, clicks: 0 };
    for (const event of selectedEventRows) {
      const time = new Date(event.created_at).getTime();
      const target = time >= currentStart.getTime() && time <= end.getTime()
        ? current
        : time >= previousStart.getTime() && time <= previousEnd.getTime()
          ? previous
          : null;
      if (!target) continue;
      if (event.event_type === "tap") target.taps += 1;
      else if (event.event_type === "review_click") target.clicks += 1;
    }

    const change = (now: number, before: number) => before === 0
      ? (now === 0 ? 0 : null)
      : ((now - before) / before) * 100;
    const bestDay = [...chartData].sort((a, b) => b.taps - a.taps)[0];
    const cardTotals = cards
      .filter((card) => selectedCardId === "all" || card.id === selectedCardId)
      .filter((card) => selectedLocationId === "all" || (selectedLocationId === "unassigned" ? !card.location_id : card.location_id === selectedLocationId))
      .map((card) => ({ name: card.card_name || "Untitled Card", taps: cardEventStats.get(card.id)?.taps ?? 0 }))
      .sort((a, b) => b.taps - a.taps);

    return {
      current,
      previous,
      tapChange: change(current.taps, previous.taps),
      clickChange: change(current.clicks, previous.clicks),
      bestDay: bestDay && bestDay.taps > 0 ? bestDay : null,
      topCard: cardTotals[0] && cardTotals[0].taps > 0 ? cardTotals[0] : null,
    };
  }, [selectedEventRows, chartData, chartPeriod, cards, selectedCardId, selectedLocationId, cardEventStats]);

  const cardPerformance = useMemo(() => cards
    .filter((card) => selectedCardId === "all" || card.id === selectedCardId)
    .filter((card) => selectedLocationId === "all" || (selectedLocationId === "unassigned" ? !card.location_id : card.location_id === selectedLocationId))
    .map((card) => {
      const stats = cardEventStats.get(card.id);
      const taps = stats?.taps ?? 0;
      const clicks = stats?.clicks ?? 0;
      return { card, taps, clicks, visitors: stats?.visitors.size ?? 0, ctr: taps ? clicks / taps * 100 : 0 };
    })
    .sort((a, b) => b.taps - a.taps), [cards, cardEventStats, selectedCardId, selectedLocationId]);

  const locationPerformance = useMemo(() => {
    const rows = businessLocations.map((location) => {
      const locationCards = cards.filter((card) => card.location_id === location.id);
      const cardIds = new Set(locationCards.map((card) => card.id));
      const events = eventRows.filter((event) => cardIds.has(event.card_id));
      const taps = events.filter((event) => event.event_type === "tap").length;
      const clicks = events.filter((event) => event.event_type === "review_click").length;
      return { ...location, cardCount: locationCards.length, taps, clicks, ctr: taps ? clicks / taps * 100 : 0 };
    });
    return rows.sort((a, b) => b.taps - a.taps);
  }, [businessLocations, cards, eventRows]);

  function exportAnalyticsCsv() {
    const rows = selectedEventRows.map((event) => {
      const card = cards.find((item) => item.id === event.card_id);
      return [card?.card_name || "Untitled Card", event.event_type === "tap" ? "Tap" : "Review Click", new Date(event.created_at).toLocaleString("id-ID")];
    });

    // Prevent spreadsheet formula injection from user-controlled card names.
    const escapeCsvCell = (value: unknown) => {
      let safeValue = String(value ?? "");
      if (/^[\s\u0000-\u001f]*[=+\-@]/.test(safeValue)) {
        safeValue = "'" + safeValue;
      }
      return '"' + safeValue.replace(/"/g, '""') + '"';
    };

    const csv = [["Nama Kartu", "Aktivitas", "Waktu"], ...rows]
      .map((row) => row.map(escapeCsvCell).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ditapaja-analytics-" + new Date().toISOString().slice(0, 10) + ".csv";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadQrPng(card: NfcCard) {
    const qrCanvas = document.getElementById("ditapaja-qr-" + card.public_code) as HTMLCanvasElement | null;
    if (!qrCanvas) return;
    const output = document.createElement("canvas");
    output.width = 900;
    output.height = 1080;
    const ctx = output.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = qrBackground;
    ctx.fillRect(0, 0, output.width, output.height);
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 3;
    ctx.strokeRect(28, 28, output.width - 56, output.height - 56);
    ctx.textAlign = "center";
    ctx.fillStyle = qrForeground;
    ctx.font = "700 38px Arial, sans-serif";
    ctx.fillText("DiTapAja.", 450, 112);
    ctx.fillStyle = "#64748b";
    ctx.font = "500 22px Arial, sans-serif";
    ctx.fillText("YOUR REVIEW STARTS HERE", 450, 158);
    ctx.fillStyle = qrForeground;
    ctx.font = "700 34px Arial, sans-serif";
    ctx.fillText((card.card_name || "Review bisnis").slice(0, 32), 450, 225);
    const qrSize = 520;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect((900 - qrSize) / 2 - 18, 270, qrSize + 36, qrSize + 36);
    ctx.drawImage(qrCanvas, (900 - qrSize) / 2, 288, qrSize, qrSize);
    ctx.fillStyle = qrForeground;
    ctx.font = "700 30px Arial, sans-serif";
    ctx.fillText("SCAN TO LEAVE A REVIEW", 450, 875);
    ctx.fillStyle = "#64748b";
    ctx.font = "500 20px Arial, sans-serif";
    ctx.fillText("Arahkan kamera ke QR Code", 450, 920);
    ctx.font = "500 17px Arial, sans-serif";
    ctx.fillText("ditapaja.web.id/c/" + card.public_code, 450, 975);
    const anchor = document.createElement("a");
    anchor.href = output.toDataURL("image/png");
    anchor.download = "ditapaja-qr-print-" + card.public_code + ".png";
    anchor.click();
  }

  async function copyPublicCardLink(card: NfcCard) {
    const publicUrl = window.location.origin + "/c/" + card.public_code;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedCardId(card.id);
      setCardError("");
      window.setTimeout(() => {
        setCopiedCardId((current) => current === card.id ? null : current);
      }, 1800);
    } catch {
      setCardError("Browser tidak mengizinkan penyalinan otomatis. Buka Preview untuk menyalin link kartu.");
    }
  }

  async function copyQrLink(card: NfcCard) {
    try {
      await navigator.clipboard.writeText(window.location.origin + "/c/" + card.public_code);
      setQrLinkCopied(true);
      window.setTimeout(() => setQrLinkCopied(false), 1800);
    } catch {
      setCardError("Browser tidak mengizinkan penyalinan otomatis. Salin tautan yang tampil di bawah QR.");
    }
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

        const [profileResult, initialCardsResult, locationsResult] = await Promise.all([
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

        // Older databases may not have the optional multi-location column yet.
        // Retry without it so existing cards remain visible and manageable.
        let cardsResult: any = initialCardsResult;
        if (
          cardsResult.error &&
          (cardsResult.error.code === "PGRST204" ||
            cardsResult.error.message?.includes("location_id"))
        ) {
          console.warn("Card location column is not available yet; loading cards without location_id.");
          cardsResult = await supabase
            .from("nfc_cards")
            .select("id, card_name, public_code, destination_url, active")
            .eq("user_id", data.user.id)
            .order("created_at", { ascending: false });
        }

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

        const userCards = ((cardsResult.data ?? []).map((card: any) => ({ ...card, location_id: card.location_id ?? null }))) as NfcCard[];
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

          // Supabase/PostgREST commonly returns at most 1,000 rows per request.
          // Fetch analytics in pages so larger accounts do not silently lose older events.
          const pageSize = 1000;
          let offset = 0;
          let allEvents: AnalyticsEvent[] = [];
          let eventsError: { message: string } | null = null;

          while (true) {
            const pageResult = await supabase
              .from("tap_events")
              .select("card_id, event_type, visitor_hash, created_at")
              .in("card_id", cardIds)
              .in("event_type", ["tap", "review_click"])
              .order("created_at", { ascending: true })
              .range(offset, offset + pageSize - 1);

            if (pageResult.error) {
              eventsError = pageResult.error;
              break;
            }

            const page = (pageResult.data ?? []) as AnalyticsEvent[];
            allEvents = allEvents.concat(page);
            if (page.length < pageSize) break;
            offset += pageSize;
          }

          if (eventsError) {
            console.error("Analytics loading error:", eventsError);
            setAnalyticsError(
              "Statistik belum dapat dimuat. Periksa izin akses database."
            );
          } else {
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
    setEditLocationId(card.location_id || "");
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

      const cardUpdate = {
        card_name: trimmedName,
        destination_url: trimmedUrl,
      };
      let updateError: any = null;
      const result = await supabase
        .from("nfc_cards")
        .update({ ...cardUpdate, location_id: editLocationId || null })
        .eq("id", editingCard.id)
        .eq("user_id", authData.user.id);
      updateError = result.error;

      if (
        updateError &&
        (updateError.code === "PGRST204" ||
          updateError.message?.includes("location_id"))
      ) {
        console.warn("Card location column is unavailable; saving card details without location.");
        const fallback = await supabase
          .from("nfc_cards")
          .update(cardUpdate)
          .eq("id", editingCard.id)
          .eq("user_id", authData.user.id);
        updateError = fallback.error;
      }
      if (updateError) throw updateError;

      setCards((current) =>
        current.map((card) =>
          card.id === editingCard.id
            ? {
                ...card,
                card_name: trimmedName,
                destination_url: trimmedUrl,
                location_id: editLocationId || null,
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
      description: "Akumulasi aktivitas sepanjang waktu.",
    },
    {
      label: "Unique Visitors",
      value: displayedAnalytics.uniqueVisitors.toLocaleString("id-ID"),
      icon: Users,
      description: "Pengunjung unik sepanjang waktu.",
    },
    {
      label: "Review Clicks",
      value: displayedAnalytics.reviewClicks.toLocaleString("id-ID"),
      icon: ExternalLink,
      description: "Akumulasi klik review sepanjang waktu.",
    },
    {
      label: "CTR",
      value: `${displayedAnalytics.ctr.toFixed(1)}%`,
      icon: BarChart3,
      description: "Rasio klik review dari seluruh tap.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200/80 bg-white p-5 lg:flex lg:flex-col">
          <a href="/" className="text-2xl font-bold tracking-tight">
            DiTap<span className="text-blue-600">Aja.</span>
          </a>

          <p className="mt-12 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Workspace
          </p>

          <nav className="mt-4 space-y-1.5">
            <a className="flex items-center gap-3 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-blue-50/40 px-4 py-3 text-sm font-semibold text-blue-700 shadow-sm">
              <LayoutDashboard size={19} /> Overview
            </a>

            <a
              href="#cards"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
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
              href="/dashboard/landing-page"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
            >
              <Eye size={19} /> Page Studio
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
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3.5 backdrop-blur-xl sm:px-5 md:px-10 md:py-4">
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

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 font-bold text-blue-700 ring-2 ring-white shadow-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          {/* Mobile workspace navigation: the desktop sidebar is hidden below lg. */}
          <nav aria-label="Navigasi workspace" className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            <a href="/dashboard" className="shrink-0 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">Overview</a>
            <a href="#cards" className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">My Cards</a>
            <a href="#analytics" className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Analytics</a>
            <a href="/dashboard/business" className="shrink-0 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs font-semibold text-blue-700">Business Profile</a>
            <a href="/dashboard/orders" className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Orders</a>
            <a href="/dashboard/settings" className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Settings</a>
          </nav>

          <div className="mx-auto max-w-7xl space-y-6 px-4 py-5 sm:space-y-7 sm:px-6 sm:py-7 xl:px-10 xl:py-9">
            <section className="relative isolate overflow-hidden rounded-2xl border border-blue-100/90 bg-gradient-to-br from-white via-white to-blue-50/90 p-5 shadow-sm sm:p-6 lg:p-7">
              <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-64 w-64 rounded-full bg-blue-100/70 blur-3xl" />
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-600">DITAPAJA WORKSPACE</p>
                  <p className="mt-3 text-sm font-medium text-slate-500">Welcome back,</p>
                  <h2 className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                    {displayName} <span aria-hidden="true">👋</span>
                  </h2>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
                    Pantau performa kartu NFC, kelola pengalaman pelanggan, dan lihat perkembangan interaksi bisnismu.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                      <CreditCard size={13} className="text-blue-600" />
                      {cards.length} {cards.length === 1 ? "kartu" : "kartu"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                      <span className={`h-1.5 w-1.5 rounded-full ${cards.some((card) => card.active) ? "bg-emerald-500" : "bg-slate-300"}`} />
                      {cards.filter((card) => card.active).length} aktif
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:min-w-[176px]">
                  <button
                    onClick={() => router.push("/dashboard/cards/new")}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Plus size={18} /> Add New Card
                  </button>
                  <button
                    onClick={() => router.push("/dashboard/landing-page")}
                    className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white/90 px-4 py-2.5 text-xs font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    <Eye size={15} /> Customize Landing Page
                  </button>
                </div>
              </div>
            </section>

            {cards.length === 0 && (
              <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-5 shadow-sm sm:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">MULAI DI SINI</p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">Siapkan kartu pertamamu</h3>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">Ikuti tiga langkah singkat untuk mulai menerima tap dan memantau aktivitas pelanggan.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-blue-100 bg-white p-3"><b className="text-xs text-blue-600">01 · Tambahkan</b><p className="mt-1 text-xs text-slate-500">Buat kartu dan masukkan link Google Review.</p></div><div className="rounded-xl border border-blue-100 bg-white p-3"><b className="text-xs text-blue-600">02 · Pasang</b><p className="mt-1 text-xs text-slate-500">Tulis NFC atau gunakan QR Code pada kartu.</p></div><div className="rounded-xl border border-blue-100 bg-white p-3"><b className="text-xs text-blue-600">03 · Pantau</b><p className="mt-1 text-xs text-slate-500">Lihat tap dan klik review di analytics.</p></div></div>
                <a href="/panduan" className="mt-4 inline-flex text-xs font-bold text-blue-700 hover:text-blue-800">Buka panduan lengkap →</a>
              </section>
            )}

            {cards.length > 0 && !eventRows.some((event) => event.event_type === "tap") && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">SETUP CHECKLIST</p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">Satu langkah lagi menuju pelanggan pertamamu</h3>
                    <p className="mt-1 text-sm text-slate-500">Pastikan kartu aktif dan coba lakukan tap pertama untuk mulai melihat data.</p>
                  </div>
                  <a href="#my-nfc-cards" className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">Kelola kartu</a>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="text-xs font-semibold text-emerald-700">✓ 01 · Buat kartu</p>
                    <p className="mt-1 text-xs text-emerald-700/80">Kartu pertamamu sudah tersimpan.</p>
                  </div>
                  <div className={`rounded-xl p-3 ${cards.some((card) => card.active) ? "bg-emerald-50" : "bg-amber-50"}`}>
                    <p className={`text-xs font-semibold ${cards.some((card) => card.active) ? "text-emerald-700" : "text-amber-800"}`}>{cards.some((card) => card.active) ? "✓" : "02"} · Aktifkan kartu</p>
                    <p className={`mt-1 text-xs ${cards.some((card) => card.active) ? "text-emerald-700/80" : "text-amber-800/80"}`}>{cards.some((card) => card.active) ? "Minimal satu kartu sudah aktif." : "Aktifkan kartu saat siap digunakan."}</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-3">
                    <p className="text-xs font-semibold text-blue-700">03 · Tap pertama</p>
                    <p className="mt-1 text-xs text-blue-700/80">Tempelkan ponsel ke NFC atau pindai QR untuk mulai mencatat aktivitas.</p>
                  </div>
                </div>
              </section>
            )}

            {/* ANALYTICS */}
            <div
              id="analytics"
              className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
            >
              {analyticsItems.map((item) => (
                <div
                  key={item.label}
                  className="group min-w-0 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-blue-50/50 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6"
                >
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-slate-500 sm:text-sm">{item.label}</p>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white sm:h-9 sm:w-9">
                      <item.icon size={18} />
                    </span>
                  </div>
                  <p className="mt-4 break-words text-2xl font-bold tracking-tight text-slate-900 tabular-nums sm:mt-5 sm:text-3xl">
                    {item.value}
                  </p>
                  <p className="mt-1.5 text-[10px] leading-4 text-slate-400 sm:mt-2 sm:text-xs">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            {/* DAILY ANALYTICS CHART */}
            <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-col justify-between gap-4 rounded-xl bg-slate-50/80 p-4 sm:flex-row sm:items-start sm:p-5">
                <div>
                  <h3 className="font-bold">Performance Overview</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedCardId === "all"
                      ? "Perbandingan aktivitas seluruh kartu."
                      : `Performa kartu ${cards.find((card) => card.id === selectedCardId)?.card_name || "terpilih"}.`}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="-mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Pilih kartu untuk melihat analytics">
                    <button
                      type="button"
                      onClick={() => setSelectedCardId("all")}
                      aria-pressed={selectedCardId === "all"}
                      className={`shrink-0 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
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
                      <select id="location-filter" value={selectedLocationId} onChange={(event) => setSelectedLocationId(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-auto">
                        <option value="all">Semua lokasi</option>
                        {businessLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                        <option value="unassigned">Tanpa lokasi</option>
                      </select>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3">
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

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex flex-wrap items-center gap-5 text-xs text-slate-500">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
                  Total Taps
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-sky-300" />
                  Review Clicks
                </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-semibold text-slate-700">{periodTapTotal.toLocaleString("id-ID")} <span className="font-normal text-slate-400">taps</span></span>
                  <span className="font-semibold text-slate-700">{periodClickTotal.toLocaleString("id-ID")} <span className="font-normal text-slate-400">clicks</span></span>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto overscroll-x-contain rounded-xl bg-slate-50/60 px-2 pt-3" role="img" aria-label={`Grafik aktivitas ${chartPeriod} hari. Total ${periodTapTotal} tap dan ${periodClickTotal} klik ulasan.`}>
                <div className={`flex h-52 items-end gap-1 border-b border-slate-200 pb-2 sm:h-60 sm:gap-2 ${chartPeriod === 7 ? "min-w-0" : "min-w-[600px] md:min-w-0"}`}>
                  {chartData.map((day, index) => (
                    <div
                      key={day.key}
                      title={`${new Date(day.key + "T00:00:00").toLocaleDateString("id-ID", { dateStyle: "full" })}: ${day.taps} taps, ${day.clicks} review clicks`}
                      className="flex h-full min-w-0 flex-1 flex-col justify-end"
                    >
                      <div className="flex h-full items-end justify-center gap-0.5 sm:gap-1">
                        <div
                          className="w-1/2 max-w-5 rounded-t-md bg-blue-600 transition-all"
                          style={{
                            height: `${(day.taps / chartMax) * 100}%`,
                            minHeight: day.taps > 0 ? "3px" : "0",
                          }}
                        />
                        <div
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
              </div>

              {!hasPeriodActivity && (
                <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-6 text-center">
                  <BarChart3 className="mx-auto mb-2 text-slate-300" size={22} />
                  <p className="text-sm font-semibold text-slate-700">Belum ada aktivitas pada periode ini</p>
                  <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
                    Coba tempelkan ponsel pada kartu NFC aktif atau buka QR kartu. Pilih rentang waktu yang lebih panjang atau tunggu aktivitas pelanggan berikutnya. Data sepanjang waktu tetap tersimpan pada ringkasan di atas.
                  </p>
                  <button type="button" onClick={() => document.getElementById("cards")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="mt-3 text-xs font-semibold text-blue-700 hover:text-blue-800">
                    Lihat kartu NFC
                  </button>
                </div>
              )}
            </section>

            {/* LOCAL ANALYTICS INSIGHTS - DERIVED FROM ALREADY LOADED EVENTS */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-blue-600">INSIGHT PERFORMA</p>
                  <h3 className="mt-1 font-bold text-slate-900">Apa yang terjadi?</h3>
                  <p className="mt-1 text-xs text-slate-500">Perbandingan dengan {chartPeriod} hari sebelumnya, berdasarkan data yang sudah dimuat.</p>
                </div>
                <span className="text-[10px] text-slate-400">Periode: {chartPeriod} hari terakhir</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4">
                  <p className="text-xs text-slate-500">Perubahan tap</p>
                  <p className="mt-2 text-xl font-bold tabular-nums text-slate-900">{analyticsInsights.tapChange === null ? "—" : `${analyticsInsights.tapChange > 0 ? "+" : ""}${analyticsInsights.tapChange.toFixed(1)}%`}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{analyticsInsights.current.taps.toLocaleString("id-ID")} sekarang · {analyticsInsights.previous.taps.toLocaleString("id-ID")} sebelumnya</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Perubahan review click</p>
                  <p className="mt-2 text-xl font-bold tabular-nums text-slate-900">{analyticsInsights.clickChange === null ? "—" : `${analyticsInsights.clickChange > 0 ? "+" : ""}${analyticsInsights.clickChange.toFixed(1)}%`}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{analyticsInsights.current.clicks.toLocaleString("id-ID")} sekarang · {analyticsInsights.previous.clicks.toLocaleString("id-ID")} sebelumnya</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Hari paling aktif</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{analyticsInsights.bestDay ? analyticsInsights.bestDay.label : "Belum ada data"}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{analyticsInsights.bestDay ? `${analyticsInsights.bestDay.taps} tap tercatat` : "Belum ada tap pada periode ini"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Kartu teratas</p>
                  <p className="mt-2 truncate text-lg font-bold text-slate-900">{analyticsInsights.topCard?.name || "Belum ada data"}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{analyticsInsights.topCard ? `${analyticsInsights.topCard.taps} tap tercatat` : "Tidak ada tap pada filter ini"}</p>
                </div>
              </div>
              <p className="mt-4 text-[10px] leading-5 text-slate-400">Persentase perubahan tidak ditampilkan jika periode pembanding belum memiliki aktivitas. Insight ini merupakan ringkasan aktivitas, bukan jumlah ulasan Google yang dipublikasikan.</p>
            </section>

            {businessLocations.length > 0 && (
              <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-blue-600">BUSINESS ANALYTICS</p>
                  <h3 className="mt-1 font-bold text-slate-900">Perbandingan Per Cabang</h3>
                  <p className="mt-1 text-sm text-slate-500">Ringkasan aktivitas kartu pada setiap lokasi, tanpa terpengaruh filter lokasi di atas.</p>
                </div>
                {locationPerformance.length === 0 ? (
                  <p className="px-6 py-6 text-sm text-slate-400">Belum ada lokasi bisnis yang dapat dibandingkan.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {locationPerformance.map((location) => {
                      const maxTaps = Math.max(1, ...locationPerformance.map((item) => item.taps));
                      return (
                        <button key={location.id} type="button" onClick={() => { setSelectedLocationId(location.id); setSelectedCardId("all"); }} className="block w-full px-6 py-4 text-left transition hover:bg-slate-50">
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">{location.name}</p>
                              <p className="mt-1 text-xs text-slate-400">{location.cardCount} kartu · {location.clicks.toLocaleString("id-ID")} review clicks · CTR {location.ctr.toFixed(1)}%</p>
                            </div>
                            <p className="shrink-0 text-lg font-bold tabular-nums text-slate-900">{location.taps.toLocaleString("id-ID")} <span className="text-[10px] font-medium text-slate-400">TAPS</span></p>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${(location.taps / maxTaps) * 100}%` }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="border-t border-slate-100 px-6 py-3 text-[10px] leading-5 text-slate-400">Ketuk salah satu cabang untuk menerapkan filter statistik. Data hanya menghitung aktivitas yang tercatat pada kartu di cabang tersebut.</p>
              </section>
            )}

            {cards.length > 1 && (
              <section id="my-nfc-cards" className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5"><h3 className="font-bold">Perbandingan Kartu</h3><p className="mt-1 text-sm text-slate-500">Urutan kartu berdasarkan total tap yang tercatat.</p></div>
                <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3 font-semibold">Kartu</th><th className="px-4 py-3 font-semibold">Taps</th><th className="px-4 py-3 font-semibold">Visitors</th><th className="px-4 py-3 font-semibold">Clicks</th><th className="px-4 py-3 font-semibold">CTR</th><th className="px-5 py-3 font-semibold">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{cardPerformance.map((item) => <tr key={item.card.id}><td className="px-5 py-3 font-semibold text-slate-700">{item.card.card_name || "Untitled Card"}</td><td className="px-4 py-3 tabular-nums">{item.taps.toLocaleString("id-ID")}</td><td className="px-4 py-3 tabular-nums">{item.visitors.toLocaleString("id-ID")}</td><td className="px-4 py-3 tabular-nums">{item.clicks.toLocaleString("id-ID")}</td><td className="px-4 py-3 tabular-nums">{item.ctr.toFixed(1)}%</td><td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.card.active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>{item.card.active ? "Active" : "Inactive"}</span></td></tr>)}</tbody></table></div>
              </section>
            )}

            {cards.length > 0 && (
              <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
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
              className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm"
            >
              <div className="flex flex-col items-start gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <h3 className="font-bold">My NFC Cards</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Kelola nama, tujuan, dan status kartu NFC kamu.
                  </p>
                  <button type="button" onClick={() => setShowBulkQrSheet(true)} disabled={!cards.some((card) => card.active)} className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"><QrCode size={15}/> Cetak Semua QR</button>
                  <div className="relative mt-3 w-full sm:max-w-xs">
                    <input
                      type="search"
                      value={cardSearch}
                      onChange={(event) => setCardSearch(event.target.value)}
                      placeholder="Cari nama, kode, atau link kartu..."
                      aria-label="Cari kartu NFC"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter status kartu">
                    {([
                      { value: "all", label: "Semua", count: cards.length },
                      { value: "active", label: "Aktif", count: cards.filter((card) => card.active).length },
                      { value: "inactive", label: "Nonaktif", count: cards.filter((card) => !card.active).length },
                    ] as const).map((filter) => (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() => setCardStatusFilter(filter.value)}
                        aria-pressed={cardStatusFilter === filter.value}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${cardStatusFilter === filter.value ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"}`}
                      >
                        {filter.label}
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${cardStatusFilter === filter.value ? "bg-white text-blue-700" : "bg-slate-100 text-slate-500"}`}>{filter.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {cards.length} Cards
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {cards.filter((card) => card.active).length} Aktif
                  </span>
                  {cards.some((card) => !card.active) && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {cards.filter((card) => !card.active).length} Nonaktif
                    </span>
                  )}
                </div>
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
                  {visibleCards.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <p className="text-sm font-semibold text-slate-700">Tidak ada kartu yang cocok</p>
                      <p className="mt-1 text-xs text-slate-500">Coba status lain atau ubah kata kunci pencarian.</p>
                      <button type="button" onClick={() => { setCardSearch(""); setCardStatusFilter("all"); }} className="mt-3 text-xs font-semibold text-blue-700 hover:text-blue-800">Reset filter</button>
                    </div>
                  ) : visibleCards.map((card) => (
                    <div
                      key={card.id}
                      className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:p-5"
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
                            const latestTap = latestTapByCard.get(card.id);
                            const health = !card.active ? "Nonaktif" : !latestTap ? "Belum pernah digunakan" : "Pernah digunakan · " + new Date(latestTap).toLocaleDateString("id-ID");
                            return <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${!card.active ? "bg-slate-100 text-slate-500" : !latestTap ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{health}</span>;
                          })()}
                        </div>
                        <p className="mt-1 max-w-md truncate text-sm text-slate-500">
                          {card.destination_url}
                        </p>
                        {!card.active && <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/70 p-3"><p className="text-xs font-semibold text-amber-900">Kartu belum siap digunakan</p><p className="mt-1 text-xs leading-5 text-amber-800">1. Uji link Google Review · 2. Aktifkan kartu · 3. Tulis NFC atau gunakan QR Code.</p><p className="mt-1 text-[11px] text-amber-700">Setelah aktif, halaman kartu dapat diakses oleh pelanggan.</p></div>}
                      </div>

                      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0 sm:flex-wrap sm:items-center">
                        <button onClick={() => copyPublicCardLink(card)} disabled={!card.active} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40" title="Salin link publik kartu">
                          {copiedCardId === card.id ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                          {copiedCardId === card.id ? "Tersalin" : "Salin Link"}
                        </button>
                        <button onClick={() => setQrCard(card)} disabled={!card.active} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600" title={card.active ? "Tampilkan QR Code kartu" : "Aktifkan kartu untuk menggunakan QR Code"}><QrCode size={16}/> QR Code</button>
                        <button onClick={() => window.open(card.destination_url, "_blank", "noopener,noreferrer")} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700" title="Uji tujuan Google Review"><ExternalLink size={16}/> Uji Link</button>
                        <button onClick={() => window.open("/c/" + card.public_code + "?preview=1", "_blank", "noopener,noreferrer")} disabled={!card.active} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40" title="Preview halaman publik kartu"><Eye size={16}/> Preview</button>
                        <button
                          onClick={() => handleWriteNfc(card)}
                          disabled={writingCardId !== null || !card.active}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>

                        <button
                          onClick={() => handleToggleCard(card)}
                          disabled={updatingCardId === card.id}
                          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
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
                          {card.active ? "Deactivate" : "Activate Card"}
                        </button>

                        <button
                          onClick={() => {
                            setDeleteTarget(card);
                            setCardError("");
                          }}
                          disabled={updatingCardId === card.id || deletingCard}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
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

      {/* BULK QR PRINT SHEET */}
      {showBulkQrSheet && (
        <div className="fixed inset-0 z-[80] overflow-y-auto overscroll-contain bg-slate-950/55 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:p-6">
          <div className="mx-auto max-w-5xl rounded-2xl bg-white p-4 shadow-2xl sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">DITAPAJA · QR PRINT SHEET</p><h3 className="mt-1 text-lg font-bold text-slate-900">Cetak semua QR Code aktif</h3><p className="mt-1 text-xs text-slate-500">{cards.filter((card) => card.active).length} kartu aktif · Gunakan kertas A4 dan skala 100%.</p></div>
              <div className="flex gap-2"><button type="button" onClick={() => window.print()} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"><Printer size={14} className="mr-1 inline"/> Cetak / Simpan PDF</button><button type="button" onClick={() => setShowBulkQrSheet(false)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Tutup</button></div>
            </div>
            <div id="ditapaja-bulk-qr-sheet" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
              {cards.filter((card) => card.active).map((card) => (
                <div key={card.id} className="flex break-inside-avoid flex-col items-center rounded-xl border border-slate-200 p-3 text-center sm:p-4">
                  <p className="w-full truncate text-sm font-bold text-slate-900">{card.card_name || "Untitled Card"}</p>
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">SCAN TO REVIEW</p>
                  <div className="my-3 rounded-lg bg-white p-2"><QRCodeSVG value={typeof window !== "undefined" ? window.location.origin + "/c/" + card.public_code : "https://ditapaja.web.id/c/" + card.public_code} size={150} level="H" includeMargin fgColor="#111827" bgColor="#ffffff"/></div>
                  <p className="break-all text-[9px] text-slate-500">{typeof window !== "undefined" ? window.location.origin : "https://ditapaja.netlify.app"}/c/{card.public_code}</p>
                  <p className="mt-2 text-[9px] font-semibold tracking-wide text-slate-400">DiTapAja · YOUR REVIEW STARTS HERE</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-[10px] text-slate-400 print:hidden">Hanya kartu aktif yang disertakan. Setiap QR mengarah ke URL publik kartu masing-masing.</p>
          </div>
          <style jsx global>{`@media print { @page { size: A4; margin: 10mm; } body * { visibility: hidden !important; } #ditapaja-bulk-qr-sheet, #ditapaja-bulk-qr-sheet * { visibility: visible !important; } #ditapaja-bulk-qr-sheet { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; border: 0 !important; } #ditapaja-bulk-qr-sheet > div { break-inside: avoid; } }`}</style>
        </div>
      )}

      {/* QR CODE MODAL */}
      {qrCard && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto overscroll-contain bg-slate-950/55 p-3 py-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:p-4" onClick={() => setQrCard(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="qr-card-title" className="my-auto w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-2xl sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between text-left"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">DITAPAJA · QR ACCESS</p><h3 id="qr-card-title" className="mt-1 text-lg font-bold text-slate-900">{qrCard.card_name || "Untitled Card"}</h3></div><button type="button" onClick={() => setQrCard(null)} aria-label="Tutup QR Code" className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><X size={19}/></button></div>
            <div className="mx-auto my-4 inline-flex max-w-full rounded-2xl border border-slate-100 bg-white p-3 sm:my-6 sm:p-4"><QRCodeCanvas id={"ditapaja-qr-" + qrCard.public_code} className="h-auto w-[min(64vw,220px)]" value={typeof window !== "undefined" ? window.location.origin + "/c/" + qrCard.public_code : "https://ditapaja.netlify.app/c/" + qrCard.public_code} size={220} level="H" includeMargin fgColor={qrForeground} bgColor={qrBackground} /></div>
            <p className="break-all px-1 text-[11px] text-slate-400">{typeof window !== "undefined" ? window.location.origin : "https://ditapaja.netlify.app"}/c/{qrCard.public_code}</p>
            <button type="button" onClick={() => copyQrLink(qrCard)} className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700">{qrLinkCopied ? "Tautan berhasil disalin" : "Salin tautan kartu"}</button>
            <p className="mt-2 text-xs leading-5 text-slate-500">Scan QR ini untuk membuka halaman review kartu.</p>
            <div className="grid grid-cols-2 gap-3 text-left">
              <label className="rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-600">Warna QR<input type="color" value={qrForeground} onChange={(event) => setQrForeground(event.target.value)} className="mt-2 h-9 w-full cursor-pointer rounded"/></label>
              <label className="rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-600">Warna latar<input type="color" value={qrBackground} onChange={(event) => setQrBackground(event.target.value)} className="mt-2 h-9 w-full cursor-pointer rounded"/></label>
            </div>
            <button type="button" onClick={() => downloadQrPng(qrCard)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><Download size={17}/> Download QR Siap Cetak PNG</button>
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
                <label htmlFor="edit-card-location" className="mb-2 block text-sm font-semibold text-slate-700">Lokasi bisnis</label>
                <select id="edit-card-location" value={editLocationId} onChange={(event) => setEditLocationId(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500">
                  <option value="">Tanpa lokasi / bisnis utama</option>
                  {businessLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                </select>
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-50"
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