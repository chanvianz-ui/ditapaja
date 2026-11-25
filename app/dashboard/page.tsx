"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  RefreshCw,
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
  Package,
  Printer,
  Home,
  ShoppingBag,
  Menu,
} from "lucide-react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { supabase } from "../../lib/supabase";
import "./dashboard-experience.css";

type Profile = {
  full_name: string | null;
  business_name: string | null;
};

type NfcCard = {
  id: string;
  card_name: string | null;
  public_code: string;
  destination_url: string;
  active: boolean;
  location_id?: string | null;
  archived_at?: string | null;
  archived_by?: string | null;
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
  const [activeView, setActiveView] = useState<"overview" | "cards">("overview");

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("view") === "cards") setActiveView("cards");
  }, []);

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
  const [showArchivedCards, setShowArchivedCards] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [bulkActionBusy, setBulkActionBusy] = useState(false);
  const [bulkLocationId, setBulkLocationId] = useState("__choose__");
  const [bulkQrTheme, setBulkQrTheme] = useState<"light" | "dark">("light");

  const visibleCards = useMemo(() => {
    const query = cardSearch.trim().toLowerCase();
    return cards.filter((card) => {
      if (Boolean(card.archived_at) !== showArchivedCards) return false;
      const matchesQuery = !query || [card.card_name || "", card.public_code, card.destination_url]
        .some((value) => value.toLowerCase().includes(query));
      const matchesStatus = cardStatusFilter === "all"
        || (cardStatusFilter === "active" ? card.active : !card.active);
      return matchesQuery && matchesStatus;
    });
  }, [cards, cardSearch, cardStatusFilter, showArchivedCards]);

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
  const [duplicatingCardId, setDuplicatingCardId] = useState<string | null>(null);
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

  const periodEventRows = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (chartPeriod - 1));
    return selectedEventRows.filter((event) => new Date(event.created_at).getTime() >= start.getTime());
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
    const rows = periodEventRows.map((event) => {
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
    ctx.fillStyle = qrBackground;
    ctx.fillRect((900 - qrSize) / 2 - 18, 270, qrSize + 36, qrSize + 36);
    ctx.drawImage(qrCanvas, (900 - qrSize) / 2, 288, qrSize, qrSize);
    ctx.fillStyle = qrForeground;
    ctx.font = "700 30px Arial, sans-serif";
    ctx.fillText("SCAN TO LEAVE A REVIEW", 450, 875);
    ctx.fillStyle = "#64748b";
    ctx.font = "500 20px Arial, sans-serif";
    ctx.fillText("Arahkan kamera ke QR Code", 450, 920);
    ctx.font = "500 17px Arial, sans-serif";
    ctx.fillText(window.location.host + "/c/" + card.public_code, 450, 975);
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
            .select("full_name,business_name")
            .eq("id", data.user.id)
            .maybeSingle(),

          supabase
            .from("nfc_cards")
            .select("id, card_name, public_code, destination_url, active, location_id, archived_at, archived_by")
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
            .select("id, card_name, public_code, destination_url, active, archived_at, archived_by")
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
              .select("full_name,business_name")
              .single();

            if (profileSyncError) {
              console.error("Profile sync error:", profileSyncError);
            } else {
              currentProfile = repairedProfile;
            }
          }
        }

        setProfile(currentProfile);

        const userCards = ((cardsResult.data ?? []).map((card: any) => ({ ...card, location_id: card.location_id ?? null, archived_at: card.archived_at ?? null, archived_by: card.archived_by ?? null }))) as NfcCard[];
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

    if (typeof window === "undefined" || !window.isSecureContext) {
      setNfcError("Penulisan NFC membutuhkan koneksi HTTPS. Buka dashboard melalui alamat aman (https://).");
      return;
    }

    if (!("NDEFReader" in window)) {
      setNfcError("Browser ini belum mendukung Web NFC. Gunakan Chrome terbaru di Android dan pastikan fitur NFC HP aktif.");
      return;
    }

    const nfcUrl = window.location.origin + "/c/" + card.public_code;
    setWritingCardId(card.id);

    try {
      // Keep this call directly inside the button interaction: Web NFC requires a user gesture.
      const NDEFReaderClass = (window as any).NDEFReader;
      const reader = new NDEFReaderClass();
      await reader.write({ records: [{ recordType: "url", data: nfcUrl }] });
      setNfcMessage("Berhasil! Link kartu " + (card.card_name || "NFC") + " sudah tersimpan ke chip. Coba tap kartu untuk mengujinya.");
    } catch (error: any) {
      console.error("NFC write error:", error);
      if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
        setNfcError("Izin NFC belum diberikan. Izinkan akses NFC untuk situs ini, lalu coba lagi.");
      } else if (error?.name === "NotSupportedError") {
        setNfcError("NFC tidak didukung perangkat atau chip kartu tidak kompatibel. Pastikan HP Android memiliki NFC.");
      } else if (error?.name === "AbortError") {
        setNfcError("Proses dibatalkan. Dekatkan kartu ke bagian belakang HP dan tahan sampai proses selesai.");
      } else if (error?.name === "InvalidStateError") {
        setNfcError("Sesi NFC sedang digunakan. Tutup pemindaian NFC lain, lalu coba kembali.");
      } else {
        setNfcError("Belum berhasil menulis kartu. Aktifkan NFC, buka kunci layar HP, lalu tempelkan kartu kembali.");
      }
    } finally {
      setWritingCardId(null);
    }
  }
  async function handleDuplicateCard(card: NfcCard) {
    if (card.archived_at) return;
    setDuplicatingCardId(card.id);
    setCardError("");
    setCardMessage("");

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        router.replace("/login");
        return;
      }

      const { data: source, error: sourceError } = await supabase
        .from("nfc_cards")
        .select("id,user_id,card_name,public_code,destination_url,active,location_id,archived_at")
        .eq("id", card.id)
        .eq("user_id", authData.user.id)
        .is("archived_at", null)
        .maybeSingle();
      if (sourceError) throw sourceError;
      if (!source) throw new Error("Kartu sumber tidak ditemukan atau sudah diarsipkan.");

      const newCode = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
      const newName = ((source.card_name || "Untitled Card") + " (Copy)").slice(0, 80);
      const { data: newCard, error: insertError } = await supabase
        .from("nfc_cards")
        .insert({
          user_id: authData.user.id,
          card_name: newName,
          public_code: newCode,
          destination_url: source.destination_url,
          active: false,
          location_id: source.location_id || null,
        })
        .select("id,card_name,public_code,destination_url,active,location_id,archived_at,archived_by")
        .single();
      if (insertError) throw insertError;

      let pageCopyWarning = false;
      const { data: sourcePage, error: pageReadError } = await supabase
        .from("nfc_card_pages")
        .select("is_published,headline,description,theme,accent_color,button_style,whatsapp_url,instagram_url,website_url,logo_url,logo_size,logo_position")
        .eq("card_id", source.id)
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (pageReadError) {
        pageCopyWarning = true;
      } else if (sourcePage) {
        const { error: pageInsertError } = await supabase
          .from("nfc_card_pages")
          .insert({ ...sourcePage, user_id: authData.user.id, card_id: newCard.id });
        if (pageInsertError) pageCopyWarning = true;
      }

      setCards((current) => [newCard as NfcCard, ...current]);
      setCardMessage(pageCopyWarning
        ? "Kartu berhasil diduplikasi dalam status Inactive, tetapi pengaturan halaman kustom tidak berhasil disalin."
        : "Kartu berhasil diduplikasi dalam status Inactive. Public code dan statistik dibuat terpisah.");
    } catch (error) {
      console.error("Card duplication error:", error);
      setCardError(error instanceof Error ? error.message : "Gagal menduplikasi kartu. Coba lagi.");
    } finally {
      setDuplicatingCardId(null);
    }
  }

  async function handleArchiveCard() {
    if (!deleteTarget) return;

    setDeletingCard(true);
    setCardError("");
    setCardMessage("");

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        router.replace("/login");
        return;
      }

      const archivedAt = new Date().toISOString();
      const { error } = await supabase
        .from("nfc_cards")
        .update({ archived_at: archivedAt, archived_by: authData.user.id, active: false })
        .eq("id", deleteTarget.id)
        .eq("user_id", authData.user.id)
        .is("archived_at", null);

      if (error) throw error;

      setCards((current) => current.map((card) => card.id === deleteTarget.id
        ? { ...card, archived_at: archivedAt, archived_by: authData.user.id, active: false }
        : card));
      setSelectedCardId((current) => current === deleteTarget.id ? "all" : current);
      setDeleteTarget(null);
      setCardMessage("Kartu berhasil diarsipkan. Riwayat dan pengaturannya tetap tersimpan.");
    } catch (error) {
      console.error("Card archive error:", error);
      setCardError("Gagal mengarsipkan kartu. Coba lagi.");
    } finally {
      setDeletingCard(false);
    }
  }

  async function handleBulkCardAction(action: "activate" | "deactivate" | "archive" | "move") {
    const targetCards = visibleCards.filter((card) => !card.archived_at && selectedCardIds.includes(card.id));
    if (!targetCards.length || bulkActionBusy) return;
    if (action === "move" && bulkLocationId === "__choose__") {
      setCardError("Pilih lokasi tujuan terlebih dahulu.");
      return;
    }
    if (action === "archive") {
      const confirmed = window.confirm(`Arsipkan ${targetCards.length} kartu terpilih? Semua kartu akan dinonaktifkan. Riwayat dan pengaturan tetap tersimpan dan dapat dipulihkan.`);
      if (!confirmed) return;
    }
    setBulkActionBusy(true);
    setCardError("");
    setCardMessage("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) { router.replace("/login"); return; }
      const ids = targetCards.map((card) => card.id);
      const archivedAt = new Date().toISOString();
      const patch: Record<string, unknown> = action === "activate" ? { active: true }
        : action === "deactivate" ? { active: false }
        : action === "archive" ? { active: false, archived_at: archivedAt, archived_by: authData.user.id }
        : { location_id: bulkLocationId || null };
      const { data: updatedRows, error } = await supabase.from("nfc_cards")
        .update(patch).eq("user_id", authData.user.id).in("id", ids).is("archived_at", null).select("id");
      if (error) throw error;
      const updatedIds = new Set((updatedRows ?? []).map((row: { id: string }) => row.id));
      if (!updatedIds.size) throw new Error("Tidak ada kartu yang berhasil diperbarui. Muat ulang halaman dan coba lagi.");
      setCards((current) => current.map((card) => {
        if (!updatedIds.has(card.id)) return card;
        if (action === "activate") return { ...card, active: true };
        if (action === "deactivate") return { ...card, active: false };
        if (action === "archive") return { ...card, active: false, archived_at: archivedAt, archived_by: authData.user.id };
        return { ...card, location_id: bulkLocationId || null };
      }));
      setSelectedCardIds([]);
      const label = action === "activate" ? "diaktifkan" : action === "deactivate" ? "dinonaktifkan" : action === "archive" ? "diarsipkan" : "dipindahkan lokasinya";
      setCardMessage(`${updatedIds.size} kartu berhasil ${label}${updatedIds.size < ids.length ? ` (${ids.length - updatedIds.size} kartu tidak berubah)` : ""}.`);
    } catch (error) {
      console.error("Bulk card action error:", error);
      setCardError(error instanceof Error ? error.message : "Aksi massal gagal. Coba lagi.");
    } finally { setBulkActionBusy(false); }
  }

  async function handleRestoreCard(card: NfcCard) {
    setUpdatingCardId(card.id);
    setCardError("");
    setCardMessage("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        router.replace("/login");
        return;
      }
      const { error } = await supabase
        .from("nfc_cards")
        .update({ archived_at: null, archived_by: null, active: false })
        .eq("id", card.id)
        .eq("user_id", authData.user.id)
        .not("archived_at", "is", null);
      if (error) throw error;
      setCards((current) => current.map((item) => item.id === card.id
        ? { ...item, archived_at: null, archived_by: null, active: false }
        : item));
      setCardMessage("Kartu berhasil dipulihkan dalam status Inactive. Aktifkan setelah siap digunakan.");
    } catch (error) {
      console.error("Card restore error:", error);
      setCardError("Gagal memulihkan kartu. Coba lagi.");
    } finally {
      setUpdatingCardId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090a0c]">
        <Loader2 className="h-8 w-8 animate-spin text-[#bd8057]" />
      </div>
    );
  }

  const displayName =
    profile?.full_name || email.split("@")[0] || "User";
  const workspaceName = profile?.business_name?.trim() || displayName;

  const analyticsItems = [
    {
      label: "Total Taps",
      value: displayedAnalytics.totalTaps.toLocaleString("id-ID"),
      icon: MousePointerClick,
    },
    {
      label: "Unique Visitors",
      value: displayedAnalytics.uniqueVisitors.toLocaleString("id-ID"),
      icon: Users,
    },
    {
      label: "Review Clicks",
      value: displayedAnalytics.reviewClicks.toLocaleString("id-ID"),
      icon: ExternalLink,
    },
    {
      label: "CTR",
      value: `${displayedAnalytics.ctr.toFixed(1)}%`,
      icon: BarChart3,
    },
  ];

  return (
    <main className="dt-reset-dashboard">
      <div className="dt-page">
          {(cardError || cardMessage || analyticsError || nfcError || nfcMessage) && <div className={cardError || analyticsError || nfcError ? "dt-alert is-error" : "dt-alert"}>{cardError || analyticsError || nfcError || cardMessage || nfcMessage}</div>}

          {activeView === "overview" ? (
            <>
              <section className="dt-page-heading">
                <div><h1>Overview</h1></div>
                <button className="dt-primary" type="button" onClick={() => router.push("/dashboard/cards/new")}><Plus size={16}/>Buat kartu</button>
              </section>

              <section className="dt-kpi-grid" aria-label="Metrik utama">
                {analyticsItems.map((item) => { const Icon = item.icon; return <article className="dt-kpi" key={item.label}><div className="dt-kpi-head"><span>{item.label}</span><Icon size={17}/></div><strong>{item.value}</strong></article>; })}
              </section>

              <section className="dt-overview-grid" id="analytics">
                <div className="dt-panel dt-performance">
                  <div className="dt-panel-heading"><div><h2>Aktivitas pelanggan</h2></div><div className="dt-panel-filters"><select aria-label="Filter kartu" value={selectedCardId} onChange={e => setSelectedCardId(e.target.value)}><option value="all">Semua kartu</option>{cards.filter(c => !c.archived_at).map(c => <option key={c.id} value={c.id}>{c.card_name || "Untitled Card"}</option>)}</select><select aria-label="Filter lokasi" value={selectedLocationId} onChange={e => setSelectedLocationId(e.target.value)}><option value="all">Semua lokasi</option><option value="unassigned">Tanpa lokasi</option>{businessLocations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select></div></div>
                  <div className="dt-chart-toolbar"><div className="dt-legend"><span><i className="dt-dot-taps"/>Tap NFC</span><span><i className="dt-dot-clicks"/>Klik review</span></div><div className="dt-period">{([7,30,90] as const).map(period => <button type="button" key={period} className={chartPeriod===period?"is-active":""} onClick={()=>setChartPeriod(period)}>{period}H</button>)}</div></div>
                  {hasPeriodActivity ? <div className="dt-chart">{chartData.map(day => <div className="dt-chart-day" key={day.key}><div className="dt-chart-bars"><i className="dt-bar-taps" style={{height: Math.max(day.taps ? 4 : 0, day.taps/chartMax*100)+"%"}}/><i className="dt-bar-clicks" style={{height: Math.max(day.clicks ? 4 : 0, day.clicks/chartMax*100)+"%"}}/></div><span>{day.label}</span></div>)}</div> : <div className="dt-chart-empty"><BarChart3 size={25}/><b>Belum ada aktivitas di periode ini</b><span>Grafik akan terisi otomatis saat pelanggan mulai menggunakan kartu NFC.</span></div>}
                  <div className="dt-chart-foot"><span>{chartPeriod} hari terakhir</span><b>{periodTapTotal.toLocaleString("id-ID")} tap <i>·</i> {periodClickTotal.toLocaleString("id-ID")} klik review</b><button type="button" onClick={exportAnalyticsCsv}><Download size={14}/>Export CSV</button></div>
                </div>

                <aside className="dt-panel dt-insights">
                  <h2>Insight</h2>
                  <div className="dt-insight-stat"><span>Perubahan tap</span><b>{analyticsInsights.tapChange===null?"—":(analyticsInsights.tapChange>0?"+":"")+analyticsInsights.tapChange.toFixed(1)+"%"}</b></div>
                  <div className="dt-insight-stat"><span>Klik review</span><b>{analyticsInsights.clickChange===null?"—":(analyticsInsights.clickChange>0?"+":"")+analyticsInsights.clickChange.toFixed(1)+"%"}</b></div>
                  <div className="dt-insight-stat"><span>Hari teraktif</span><b>{analyticsInsights.bestDay?.label || "—"}</b></div>
                  <div className="dt-top-card"><small>Kartu teratas</small><strong>{analyticsInsights.topCard?.name || "Belum ada data"}</strong><span>{analyticsInsights.topCard ? analyticsInsights.topCard.taps.toLocaleString("id-ID")+" total tap" : "Data kartu akan muncul di sini."}</span></div>
                </aside>
              </section>

              <section className="dt-recent-section">
                <div className="dt-section-heading"><div><h2>Kartu NFC</h2></div><button className="dt-text-button" type="button" onClick={() => window.location.assign("/dashboard?view=cards")}>Kelola semua kartu <ExternalLink size={14}/></button></div>
                <div className="dt-recent-list">
                  {cards.filter(card => !card.archived_at).slice(0,4).length ? cards.filter(card => !card.archived_at).slice(0,4).map(card => <article className="dt-recent-card" key={card.id}><span className="dt-card-icon"><CreditCard size={18}/></span><div className="dt-recent-info"><b>{card.card_name || "Untitled Card"}</b><small>{card.public_code}</small></div><span className={card.active?"dt-status is-on":"dt-status"}>{card.active?"Aktif":"Nonaktif"}</span><span className="dt-recent-taps">{(cardEventStats.get(card.id)?.taps || 0).toLocaleString("id-ID")} <small>taps</small></span></article>) : <div className="dt-no-cards"><CreditCard size={22}/><b>Belum ada kartu NFC</b><span>Buat kartu pertama untuk mulai mengumpulkan ulasan.</span></div>}
                </div>
              </section>
            </>
          ) : (
            <>
              <section className="dt-page-heading dt-cards-heading">
                <div><span className="dt-eyebrow">WORKSPACE / 02</span><h1>Kartu NFC<span>.</span></h1><p>Kelola status, tautan tujuan, QR Code, dan penulisan NFC.</p></div>
                <button className="dt-primary" type="button" onClick={()=>router.push("/dashboard/cards/new")}><Plus size={16}/>Tambah kartu</button>
              </section>
              <section className="dt-card-counts">
                <div><small>Total kartu</small><b>{cards.filter(c=>!c.archived_at).length}</b></div><div><small>Aktif</small><b>{cards.filter(c=>c.active&&!c.archived_at).length}</b></div><div><small>Nonaktif</small><b>{cards.filter(c=>!c.active&&!c.archived_at).length}</b></div><div><small>Diarsipkan</small><b>{cards.filter(c=>c.archived_at).length}</b></div>
              </section>
              <section className="dt-card-manager">
                <div className="dt-card-toolbar"><input value={cardSearch} onChange={e=>setCardSearch(e.target.value)} placeholder="Cari nama kartu, kode, atau URL..." aria-label="Cari kartu"/><select value={cardStatusFilter} onChange={e=>setCardStatusFilter(e.target.value as "all"|"active"|"inactive")} aria-label="Filter status"><option value="all">Semua status</option><option value="active">Aktif</option><option value="inactive">Nonaktif</option></select><button className={showArchivedCards?"is-active":""} type="button" onClick={()=>setShowArchivedCards(v=>!v)}><Archive size={14}/>{showArchivedCards?"Lihat kartu aktif":"Lihat arsip"}</button></div>
                {selectedCardIds.length>0 && !showArchivedCards && <div className="dt-bulkbar"><b>{selectedCardIds.length} kartu dipilih</b><button type="button" onClick={()=>handleBulkCardAction("activate")} disabled={bulkActionBusy}>Aktifkan</button><button type="button" onClick={()=>handleBulkCardAction("deactivate")} disabled={bulkActionBusy}>Nonaktifkan</button><button type="button" onClick={()=>setShowBulkQrSheet(true)}>Cetak QR</button><button type="button" onClick={()=>handleBulkCardAction("archive")} disabled={bulkActionBusy}>Arsipkan</button><button type="button" onClick={()=>setSelectedCardIds([])}>Batal</button></div>}
                {visibleCards.length===0 ? <div className="dt-no-cards"><CreditCard size={25}/><b>{showArchivedCards?"Belum ada kartu di arsip":"Belum ada kartu yang cocok"}</b><span>{showArchivedCards?"Kartu yang diarsipkan akan muncul di sini.":"Buat kartu NFC pertamamu untuk mulai mengumpulkan review."}</span>{!showArchivedCards&&<button className="dt-primary" type="button" onClick={()=>router.push("/dashboard/cards/new")}><Plus size={15}/>Buat kartu pertama</button>}</div> : <div className="dt-managed-list">{visibleCards.map(card=>{const stats=cardEventStats.get(card.id);const archived=Boolean(card.archived_at);return <article className="dt-managed-card" key={card.id}><label className="dt-check"><input type="checkbox" checked={selectedCardIds.includes(card.id)} onChange={e=>setSelectedCardIds(current=>e.target.checked?[...current,card.id]:current.filter(id=>id!==card.id))} disabled={archived}/></label><span className="dt-card-icon"><CreditCard size={19}/></span><div className="dt-managed-info"><div className="dt-managed-title"><b>{card.card_name||"Untitled Card"}</b><span className={archived?"is-archived":card.active?"is-on":"is-off"}>{archived?"Diarsipkan":card.active?"Aktif":"Nonaktif"}</span></div><p>Kode: {card.public_code}</p><small>{card.destination_url}</small><div className="dt-managed-stats"><span>{(stats?.taps||0).toLocaleString("id-ID")} tap</span><span>{(stats?.clicks||0).toLocaleString("id-ID")} klik review</span><span>CTR {stats?.taps?((stats.clicks/stats.taps)*100).toFixed(1):"0.0"}%</span></div></div><div className="dt-managed-actions">{archived?<button type="button" onClick={()=>handleRestoreCard(card)} disabled={updatingCardId===card.id}><RefreshCw size={14}/>Pulihkan</button>:<><button type="button" onClick={()=>setQrCard(card)}><QrCode size={14}/>QR</button><button type="button" onClick={()=>copyPublicCardLink(card)}><Copy size={14}/>{copiedCardId===card.id?"Tersalin":"Salin link"}</button><button type="button" onClick={()=>handleWriteNfc(card)} disabled={writingCardId===card.id||!card.active}>{writingCardId===card.id?<Loader2 size={14} className="animate-spin"/>:<Nfc size={14}/>}Tulis NFC</button><button type="button" onClick={()=>handleDuplicateCard(card)} disabled={duplicatingCardId===card.id}><Copy size={14}/>Duplikat</button><button type="button" onClick={()=>openEditCard(card)}><Pencil size={14}/>Edit</button><button type="button" onClick={()=>handleToggleCard(card)} disabled={updatingCardId===card.id}><Power size={14}/>{card.active?"Nonaktifkan":"Aktifkan"}</button><button type="button" className="is-danger" onClick={()=>{setDeleteTarget(card);setCardError("");}}><Archive size={14}/>Arsipkan</button></>}</div></article>;})}</div>}
                <div className="dt-list-foot">Menampilkan {visibleCards.length} dari {cards.length} kartu <span>Data tersimpan otomatis di akunmu</span></div>
              </section>
            </>
          )}
          <footer className="dt-footer">DiTapAja <span>·</span> NFC Review Workspace <small>Tanpa biaya langganan bulanan</small></footer>
      </div>

      {/* BULK QR PRINT SHEET */}
      {showBulkQrSheet && (
        <div className="dt-bulk-qr-overlay fixed inset-0 z-[80] overflow-y-auto overscroll-contain bg-slate-950/55 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:p-6">
          <div className="dt-bulk-qr-panel mx-auto max-w-5xl rounded-2xl bg-white p-4 shadow-2xl sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">DITAPAJA · QR PRINT SHEET</p><h3 className="mt-1 text-lg font-bold text-slate-900">Cetak semua QR Code aktif</h3><p className="mt-1 text-xs text-slate-500">{cards.filter((card) => selectedCardIds.includes(card.id) && card.active && !card.archived_at).length} kartu terpilih · Gunakan kertas A4 dan skala 100%.</p></div>
              <div className="flex flex-wrap items-center gap-2"><div className="flex rounded-xl border border-slate-200 p-1"><button type="button" onClick={() => setBulkQrTheme("light")} className={`rounded-lg px-3 py-2 text-xs font-semibold ${bulkQrTheme === "light" ? "bg-slate-900 text-white" : "text-slate-500"}`}>Hitam / Putih</button><button type="button" onClick={() => setBulkQrTheme("dark")} className={`rounded-lg px-3 py-2 text-xs font-semibold ${bulkQrTheme === "dark" ? "bg-slate-900 text-white" : "text-slate-500"}`}>Putih / Hitam</button></div><button type="button" onClick={() => window.print()} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"><Printer size={14} className="mr-1 inline"/> Cetak / Simpan PDF</button><button type="button" onClick={() => setShowBulkQrSheet(false)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Tutup</button></div>
            </div>
            <div id="ditapaja-bulk-qr-sheet" className="dt-bulk-qr-grid grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
              {cards.filter((card) => selectedCardIds.includes(card.id) && card.active && !card.archived_at).map((card) => (
                <div key={card.id} className={`dt-bulk-qr-card flex break-inside-avoid flex-col items-center rounded-xl border p-3 text-center sm:p-4 ${bulkQrTheme === "dark" ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-white"}`}>
                  <p className={`w-full truncate text-sm font-bold ${bulkQrTheme === "dark" ? "text-white" : "text-slate-900"}`}>{card.card_name || "Untitled Card"}</p>
                  <p className={`mt-1 text-[10px] font-medium uppercase tracking-wider ${bulkQrTheme === "dark" ? "text-slate-400" : "text-slate-400"}`}>SCAN TO REVIEW</p>
                  <div className={`my-3 rounded-lg p-2 ${bulkQrTheme === "dark" ? "bg-slate-950" : "bg-white"}`}><QRCodeSVG value={typeof window !== "undefined" ? window.location.origin + "/c/" + card.public_code : "https://ditapaja.ditapaja.workers.dev/c/" + card.public_code} size={150} level="H" includeMargin fgColor={bulkQrTheme === "dark" ? "#ffffff" : "#111827"} bgColor={bulkQrTheme === "dark" ? "#000000" : "#ffffff"}/></div>
                  <p className={`break-all text-[9px] ${bulkQrTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{typeof window !== "undefined" ? window.location.origin : "https://ditapaja.ditapaja.workers.dev"}/c/{card.public_code}</p>
                  <p className={`mt-2 text-[9px] font-semibold tracking-wide ${bulkQrTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>DiTapAja · YOUR REVIEW STARTS HERE</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-[10px] text-slate-400 print:hidden">Hanya kartu terpilih yang aktif yang disertakan. Setiap QR mengarah ke URL publik kartu masing-masing.</p>
          </div>
          <style jsx global>{`@media print { @page { size: A4; margin: 10mm; } body * { visibility: hidden !important; } #ditapaja-bulk-qr-sheet, #ditapaja-bulk-qr-sheet * { visibility: visible !important; } #ditapaja-bulk-qr-sheet { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; border: 0 !important; } #ditapaja-bulk-qr-sheet > div { break-inside: avoid; } }`}</style>
        </div>
      )}

      {/* QR CODE MODAL */}
      {qrCard && (
        <div className="dt-qr-modal-overlay fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto overscroll-contain bg-slate-950/55 p-3 py-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:p-4" onClick={() => setQrCard(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="qr-card-title" className="dt-qr-modal-panel my-auto w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-2xl sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between text-left"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">DITAPAJA · QR ACCESS</p><h3 id="qr-card-title" className="mt-1 text-lg font-bold text-slate-900">{qrCard.card_name || "Untitled Card"}</h3></div><button type="button" onClick={() => setQrCard(null)} aria-label="Tutup QR Code" className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><X size={19}/></button></div>
            <div className="dt-qr-preview mx-auto my-4 inline-flex max-w-full rounded-2xl border border-slate-100 bg-white p-3 sm:my-6 sm:p-4"><QRCodeCanvas id={"ditapaja-qr-" + qrCard.public_code} className="h-auto w-[min(64vw,220px)]" value={typeof window !== "undefined" ? window.location.origin + "/c/" + qrCard.public_code : "https://ditapaja.ditapaja.workers.dev/c/" + qrCard.public_code} size={220} level="H" includeMargin fgColor={qrForeground} bgColor={qrBackground} /></div>
            <p className="break-all px-1 text-[11px] text-slate-400">{typeof window !== "undefined" ? window.location.origin : "https://ditapaja.ditapaja.workers.dev"}/c/{qrCard.public_code}</p>
            <button type="button" onClick={() => copyQrLink(qrCard)} className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700">{qrLinkCopied ? "Tautan berhasil disalin" : "Salin tautan kartu"}</button>
            <p className="mt-2 text-xs leading-5 text-slate-500">Scan QR ini untuk membuka halaman review kartu.</p>
            <div className="dt-qr-color-controls grid grid-cols-2 gap-3 text-left">
              <label className="rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-600">Warna QR<input type="color" value={qrForeground} onChange={(event) => setQrForeground(event.target.value)} className="mt-2 h-9 w-full cursor-pointer rounded"/></label>
              <label className="rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-600">Warna latar<input type="color" value={qrBackground} onChange={(event) => setQrBackground(event.target.value)} className="mt-2 h-9 w-full cursor-pointer rounded"/></label>
            </div>
            <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => { setQrForeground("#111827"); setQrBackground("#ffffff"); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700">Hitam di atas putih</button><button type="button" onClick={() => { setQrForeground("#ffffff"); setQrBackground("#000000"); }} className="rounded-xl border border-slate-800 bg-black px-3 py-2.5 text-xs font-semibold text-white">Putih di atas hitam</button></div>
            <button type="button" onClick={() => downloadQrPng(qrCard)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><Download size={17}/> Download QR Siap Cetak PNG</button>
          </div>
        </div>
      )}

      {/* ARCHIVE CARD CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-card-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Archive size={24} />
            </div>
            <h3 id="delete-card-title" className="mt-5 text-lg font-bold text-slate-900">
              Arsipkan kartu ini?
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Kartu <strong>{deleteTarget.card_name || "Untitled Card"}</strong> akan dipindahkan ke arsip dan dinonaktifkan. Riwayat aktivitas, URL publik, serta pengaturan halaman tetap tersimpan dan kartu dapat dipulihkan kapan saja.
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
                onClick={handleArchiveCard}
                disabled={deletingCard}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingCard ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Archive size={17} />
                )}
                {deletingCard ? "Mengarsipkan..." : "Arsipkan Kartu"}
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