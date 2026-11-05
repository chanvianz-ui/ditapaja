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

  const chartData = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: chartPeriod }, (_, index) => {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (chartPeriod - 1 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return {
        key,
        label: chartPeriod === 7
          ? date.toLocaleDateString("id-ID", { weekday: "short" })
          : date.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
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
            .select(
              "id, card_name, public_code, destination_url, active"
            )
            .eq("user_id", data.user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (cardsResult.error) {
          console.error("Card loading error:", cardsResult.error);
          throw cardsResult.error;
        }

        setProfile(profileResult.data);

        const userCards = cardsResult.data ?? [];
        setCards(userCards);

        if (userCards.length > 0) {
          const cardIds = userCards.map((card) => card.id);

          const { data: events, error: eventsError } =
            await supabase
              .from("tap_events")
              .select("card_id, event_type, visitor_hash, created_at")
              .in("card_id", cardIds)
              .in("event_type", ["tap", "review_click"]);

          if (eventsError) {
            console.error(
              "Analytics loading error:",
              eventsError
            );

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
                .filter(
                  (hash): hash is string => Boolean(hash)
                )
            );

            const totalTaps = tapEvents.length;
            const reviewClicks = reviewEvents.length;

            const ctr =
              totalTaps > 0
                ? (reviewClicks / totalTaps) * 100
                : 0;

            setAnalytics({
              totalTaps,
              uniqueVisitors: uniqueHashes.size,
              reviewClicks,
              ctr,
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
        setAnalyticsError(
          "Terjadi kesalahan saat memuat dashboard."
        );
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
              <h1 className="mt-1 text-xl font-bold">
                Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">
                  {displayName}
                </p>
                <p className="text-xs text-slate-400">
                  {email}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-8 p-5 md:p-10">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm text-slate-500">
                  Welcome back,
                </p>

                <h2 className="mt-1 text-2xl font-bold tracking-tight">
                  {displayName} 👋
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Pantau performa kartu NFC kamu dari sini.
                </p>
              </div>

              <button
                onClick={() =>
                  router.push("/dashboard/cards/new")
                }
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
                    <p className="text-sm text-slate-500">
                      {item.label}
                    </p>

                    <item.icon
                      className="text-blue-600"
                      size={20}
                    />
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
                {chartData.map((day) => (
                  <div key={day.key} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                    <div className="flex h-full items-end justify-center gap-0.5 sm:gap-1">
                      <div
                        title={`${day.taps} taps`}
                        className="w-1/2 max-w-5 rounded-t-md bg-blue-600 transition-all"
                        style={{ height: `${(day.taps / chartMax) * 100}%`, minHeight: day.taps > 0 ? "3px" : "0" }}
                      />
                      <div
                        title={`${day.clicks} review clicks`}
                        className="w-1/2 max-w-5 rounded-t-md bg-sky-300 transition-all"
                        style={{ height: `${(day.clicks / chartMax) * 100}%`, minHeight: day.clicks > 0 ? "3px" : "0" }}
                      />
                    </div>
                    {(chartPeriod === 7 || chartData.indexOf(day) % (chartPeriod === 30 ? 5 : 15) === 0) && (
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

            {/* NFC CARDS */}
            <div
              id="cards"
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <div>
                  <h3 className="font-bold">My NFC Cards</h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Kelola semua kartu NFC kamu.
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
                    onClick={() =>
                      router.push("/dashboard/cards/new")
                    }
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
                      className="flex flex-wrap items-center justify-between gap-4 p-6"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {card.card_name || "Untitled Card"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Code: {card.public_code}
                        </p>

                        <p className="mt-1 max-w-md truncate text-sm text-slate-500">
                          {card.destination_url}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          card.active
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {card.active ? "Active" : "Inactive"}
                      </span>
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
    </main>
  );
}
