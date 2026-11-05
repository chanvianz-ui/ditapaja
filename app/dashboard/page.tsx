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
  X,
  Save,
} from "lucide-react";
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

  const [analytics, setAnalytics] = useState<Analytics>({
    totalTaps: 0,
    uniqueVisitors: 0,
    reviewClicks: 0,
    ctr: 0,
  });

  const [analyticsError, setAnalyticsError] = useState("");
  const [chartPeriod, setChartPeriod] = useState<7 | 30 | 90>(7);
  const [eventRows, setEventRows] = useState<AnalyticsEvent[]>([]);

  const [editingCard, setEditingCard] = useState<NfcCard | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [savingCard, setSavingCard] = useState(false);
  const [updatingCardId, setUpdatingCardId] = useState<string | null>(null);
  const [cardMessage, setCardMessage] = useState("");
  const [cardError, setCardError] = useState("");

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

    eventRows.forEach((event) => {
      const date = new Date(event.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const day = dayMap.get(key);
      if (!day) return;

      if (event.event_type === "tap") day.taps += 1;
      if (event.event_type === "review_click") day.clicks += 1;
    });

    return days;
  }, [eventRows, chartPeriod]);

  const chartMax = Math.max(
    1,
    ...chartData.map((day) => Math.max(day.taps, day.clicks))
  );

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          router.replace("/login");
          return;
        }

        setEmail(data.user.email ?? "");

        const [profileResult, cardsResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("full_name")
            .eq("id", data.user.id)
            .maybeSingle(),

          supabase
            .from("nfc_cards")
            .select("id, card_name, public_code, destination_url, active")
            .eq("user_id", data.user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (cardsResult.error) {
          console.error("Card loading error:", cardsResult.error);
          throw cardsResult.error;
        }

        setProfile(profileResult.data);

        const userCards = (cardsResult.data ?? []) as NfcCard[];
        setCards(userCards);

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
      value: analytics.totalTaps.toLocaleString("id-ID"),
      icon: MousePointerClick,
      description: "Total aktivitas tap seluruh kartu.",
    },
    {
      label: "Unique Visitors",
      value: analytics.uniqueVisitors.toLocaleString("id-ID"),
      icon: Users,
      description: "Pengunjung dengan identitas hash berbeda.",
    },
    {
      label: "Review Clicks",
      value: analytics.reviewClicks.toLocaleString("id-ID"),
      icon: ExternalLink,
      description: "Jumlah klik menuju Google Maps.",
    },
    {
      label: "CTR",
      value: `${analytics.ctr.toFixed(1)}%`,
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
                    Perbandingan aktivitas tap dan klik review.
                  </p>
                </div>

                <div className="flex w-fit rounded-xl bg-slate-100 p-1">
                  {([7, 30, 90] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setChartPeriod(period)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        chartPeriod === period
                          ? "bg-white text-blue-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {period} Hari
                    </button>
                  ))}
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

              {eventRows.length === 0 && (
                <p className="mt-4 text-center text-xs text-slate-400">
                  Belum ada aktivitas untuk ditampilkan.
                </p>
              )}
            </section>

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
                        <p className="mt-1 max-w-md truncate text-sm text-slate-500">
                          {card.destination_url}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
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
