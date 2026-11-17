"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Loader2,
  RefreshCw,
  Sparkles,
  Users,
  UserRoundCheck,
  MousePointerClick,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Card = { id: string; card_name: string | null; public_code: string; active: boolean };
type TapEvent = { card_id: string; visitor_hash: string | null; created_at: string };

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export default function CustomerInsightsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [events, setEvents] = useState<TapEvent[]>([]);
  const [period, setPeriod] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError || !auth.user) {
          router.replace("/login");
          return;
        }

        const { data: cardData, error: cardError } = await supabase
          .from("nfc_cards")
          .select("id,card_name,public_code,active")
          .eq("user_id", auth.user.id)
          .is("archived_at", null)
          .order("created_at", { ascending: false });
        if (cardError) throw cardError;
        const currentCards = (cardData || []) as Card[];
        if (cancelled) return;
        setCards(currentCards);

        if (currentCards.length === 0) {
          setEvents([]);
          return;
        }

        const since = new Date();
        since.setDate(since.getDate() - 89);
        const cardIds = currentCards.map((card) => card.id);
        const pageSize = 1000;
        let offset = 0;
        let rows: TapEvent[] = [];

        while (true) {
          const result = await supabase
            .from("tap_events")
            .select("card_id,visitor_hash,created_at")
            .in("card_id", cardIds)
            .eq("event_type", "tap")
            .gte("created_at", since.toISOString())
            .order("created_at", { ascending: true })
            .range(offset, offset + pageSize - 1);
          if (result.error) throw result.error;
          const page = (result.data || []) as TapEvent[];
          rows = rows.concat(page);
          if (page.length < pageSize) break;
          offset += pageSize;
        }

        if (!cancelled) setEvents(rows);
      } catch (cause) {
        console.error("Customer insights loading failed:", cause);
        if (!cancelled) setError("Data pelanggan belum dapat dimuat. Periksa izin akses statistik di database, lalu coba lagi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [router]);

  const insights = useMemo(() => {
    const visitorVisits = new Map<string, number>();
    const cardTotals = new Map<string, number>();
    const hours = Array.from({ length: 24 }, () => 0);
    const weekdays = Array.from({ length: 7 }, () => 0);
    for (const event of events) {
      if (event.visitor_hash) visitorVisits.set(event.visitor_hash, (visitorVisits.get(event.visitor_hash) || 0) + 1);
      cardTotals.set(event.card_id, (cardTotals.get(event.card_id) || 0) + 1);
      const date = new Date(event.created_at);
      hours[date.getHours()] += 1;
      weekdays[date.getDay()] += 1;
    }
    const uniqueVisitors = visitorVisits.size;
    const returningVisitors = [...visitorVisits.values()].filter((visits) => visits > 1).length;
    const peakHour = hours.indexOf(Math.max(0, ...hours));
    const peakWeekday = weekdays.indexOf(Math.max(0, ...weekdays));
    const weekdayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const topCards = cards.map((card) => ({
      ...card,
      taps: cardTotals.get(card.id) || 0,
    })).sort((a, b) => b.taps - a.taps);

    const today = new Date();
    const daily = Array.from({ length: period }, (_, index) => {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (period - 1 - index));
      return {
        key: localDateKey(date),
        label: period === 7
          ? date.toLocaleDateString("id-ID", { weekday: "short" })
          : date.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        taps: 0,
      };
    });
    const byDay = new Map(daily.map((day) => [day.key, day]));
    for (const event of events) {
      const date = new Date(event.created_at);
      const day = byDay.get(localDateKey(date));
      if (day) day.taps += 1;
    }

    return {
      uniqueVisitors,
      returningVisitors,
      returningRate: uniqueVisitors ? returningVisitors / uniqueVisitors * 100 : 0,
      peakHour,
      peakWeekday,
      peakWeekdayName: weekdayNames[peakWeekday],
      hours,
      weekdays,
      topCards,
      daily,
      dailyMax: Math.max(1, ...daily.map((day) => day.taps)),
    };
  }, [events, cards, period]);

  const totalTaps = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (period - 1));
    return events.filter((event) => new Date(event.created_at) >= start).length;
  }, [events, period]);

  const maxHour = Math.max(1, ...insights.hours);
  const maxWeekday = Math.max(1, ...insights.weekdays);
  const hasActivity = events.length > 0;

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-slate-950">
      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-8 xl:px-10">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")} aria-label="Kembali ke dashboard" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-950">
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-slate-400">DiTapAja / Intelligence</p>
              <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Customer Insights</h1>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Data 90 hari terakhir
          </div>
        </header>

        <section className="relative isolate overflow-hidden rounded-[30px] bg-[#172b2a] p-6 text-white shadow-[0_28px_70px_-40px_rgba(15,40,38,.6)] sm:p-9 lg:p-11">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border border-white/10" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-14 h-64 w-64 rounded-full border border-white/10" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-emerald-100">
                <Sparkles size={13} /> Audience intelligence
              </div>
              <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-4xl lg:text-[46px]">
                Kenali pola kunjungan pelangganmu.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/70 sm:text-base">
                Baca kapan kartu paling sering disentuh, seberapa banyak pengunjung kembali, dan titik interaksi yang paling menarik perhatian.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.07] p-5 backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-100/60">Ringkasan audiens</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-semibold tracking-tight tabular-nums">{insights.uniqueVisitors.toLocaleString("id-ID")}</span>
                <span className="pb-1 text-xs text-emerald-100/60">pengunjung terukur</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-emerald-50/60">Dihitung dari visitor ID anonim yang tersedia pada aktivitas tap.</p>
            </div>
          </div>
        </section>

        {error && (
          <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <span className="mt-0.5">!</span><p>{error}</p>
            <button onClick={() => window.location.reload()} className="ml-auto shrink-0 text-xs font-bold underline">Coba lagi</button>
          </div>
        )}

        <section className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Audience overview</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Perilaku pengunjung</h2>
            <p className="mt-1 text-sm text-slate-500">Ringkasan berdasarkan aktivitas tap, bukan data identitas pribadi.</p>
          </div>
          <div className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="Pilih periode aktivitas">
            {([7, 30, 90] as const).map((value) => (
              <button key={value} onClick={() => setPeriod(value)} aria-pressed={period === value} className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${period === value ? "bg-[#172b2a] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}>
                {value} hari
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="mt-6 flex min-h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" /> Mengolah aktivitas pelanggan...</div>
          </div>
        ) : (
          <>
            <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_35px_-30px_rgba(15,23,42,.35)] sm:p-5">
                <div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">Total interaksi</span><MousePointerClick size={17} className="text-slate-400" /></div>
                <p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{totalTaps.toLocaleString("id-ID")}</p>
                <p className="mt-1 text-[11px] text-slate-400">Tap dalam {period} hari</p>
              </article>
              <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_35px_-30px_rgba(15,23,42,.35)] sm:p-5">
                <div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">Pengunjung unik</span><Users size={17} className="text-slate-400" /></div>
                <p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{insights.uniqueVisitors.toLocaleString("id-ID")}</p>
                <p className="mt-1 text-[11px] text-slate-400">Visitor ID anonim · 90 hari</p>
              </article>
              <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_35px_-30px_rgba(15,23,42,.35)] sm:p-5">
                <div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">Pengunjung kembali</span><UserRoundCheck size={17} className="text-slate-400" /></div>
                <p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{insights.returningVisitors.toLocaleString("id-ID")}</p>
                <p className="mt-1 text-[11px] text-slate-400">{insights.returningRate.toFixed(1)}% dari pengunjung terukur</p>
              </article>
              <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_35px_-30px_rgba(15,23,42,.35)] sm:p-5">
                <div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">Waktu paling ramai</span><Clock3 size={17} className="text-slate-400" /></div>
                <p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{hasActivity ? formatHour(insights.peakHour) : "—"}</p>
                <p className="mt-1 text-[11px] text-slate-400">{hasActivity ? "Jam dengan tap terbanyak" : "Belum ada data"}</p>
              </article>
            </section>

            <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.85fr)]">
              <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_16px_45px_-34px_rgba(15,23,42,.3)] sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Engagement timeline</p><h3 className="mt-1 text-lg font-semibold">Ritme kunjungan</h3><p className="mt-1 text-xs text-slate-500">Jumlah tap per hari selama periode terpilih.</p></div>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-500">{period} hari terakhir</span>
                </div>
                {hasActivity ? (
                  <div className="mt-8 flex h-52 items-end gap-1.5 sm:h-60 sm:gap-2">
                    {insights.daily.map((day, index) => (
                      <div key={day.key} title={`${day.label}: ${day.taps} tap`} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                        <div className="flex flex-1 items-end justify-center">
                          <div className={`w-full max-w-8 rounded-t-md transition-all duration-300 ${day.taps ? "bg-[#1c5550]" : "bg-slate-100"}`} style={{ height: day.taps ? `${Math.max(3, day.taps / insights.dailyMax * 100)}%` : "3px" }} />
                        </div>
                        {(period === 7 || (period === 30 && index % 5 === 0) || (period === 90 && index % 15 === 0) || index === insights.daily.length - 1) && <span className="mt-3 truncate text-center text-[9px] text-slate-400 sm:text-[10px]">{day.label}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 text-center">
                    <TrendingUp size={22} className="text-slate-300" />
                    <p className="mt-3 text-sm font-semibold text-slate-700">Belum ada aktivitas pelanggan</p>
                    <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Grafik akan terisi setelah kartu NFC atau QR mulai digunakan.</p>
                  </div>
                )}
              </article>

              <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_16px_45px_-34px_rgba(15,23,42,.3)] sm:p-7">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Return behaviour</p>
                <h3 className="mt-1 text-lg font-semibold">Kunjungan berulang</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">Pengunjung dengan visitor ID yang tercatat melakukan tap lebih dari satu kali.</p>
                <div className="mt-7 flex items-center gap-5">
                  <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#1c5550 ${insights.returningRate}%, #edf1f1 0)` }}>
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-center"><span className="text-xl font-semibold tabular-nums">{insights.returningRate.toFixed(0)}<small className="text-xs">%</small></span></div>
                  </div>
                  <div className="min-w-0"><p className="text-2xl font-semibold tabular-nums">{insights.returningVisitors.toLocaleString("id-ID")}</p><p className="mt-1 text-xs text-slate-500">pengunjung terdeteksi kembali</p><p className="mt-2 text-[10px] leading-4 text-slate-400">Dari {insights.uniqueVisitors.toLocaleString("id-ID")} visitor ID yang terukur.</p></div>
                </div>
                <div className="mt-7 border-t border-slate-100 pt-4 text-[11px] leading-5 text-slate-400">Pengunjung tanpa visitor ID tidak masuk perhitungan ini. Angka ini merupakan indikator kunjungan ulang, bukan identifikasi orang.</div>
              </article>
            </section>

            <section className="mt-5 grid gap-5 lg:grid-cols-2">
              <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_16px_45px_-34px_rgba(15,23,42,.3)] sm:p-7">
                <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Visit timing</p><h3 className="mt-1 text-lg font-semibold">Jam kunjungan</h3><p className="mt-1 text-xs text-slate-500">Distribusi tap berdasarkan jam lokal perangkat.</p></div><Clock3 size={18} className="text-slate-400" /></div>
                <div className="mt-6 grid h-36 grid-cols-12 items-end gap-1 sm:gap-2">
                  {insights.hours.map((count, hour) => <div key={hour} title={`${formatHour(hour)} · ${count} tap`} className="flex h-full flex-col justify-end"><div className={`min-h-[3px] rounded-t-sm ${count ? "bg-[#1c5550]" : "bg-slate-100"}`} style={{ height: count ? `${count / maxHour * 100}%` : "3px" }} /></div>)}
                </div>
                <div className="mt-3 flex justify-between text-[10px] text-slate-400"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div>
                <div className="mt-5 rounded-xl bg-[#f1f6f4] p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-[#47736d]">Jam terpadat</p><p className="mt-1 text-xl font-semibold text-[#173b37]">{hasActivity ? formatHour(insights.peakHour) : "Belum tersedia"}</p></div>
              </article>

              <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_16px_45px_-34px_rgba(15,23,42,.3)] sm:p-7">
                <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Weekly rhythm</p><h3 className="mt-1 text-lg font-semibold">Hari paling aktif</h3><p className="mt-1 text-xs text-slate-500">Perbandingan aktivitas dari Senin sampai Minggu.</p></div><CalendarDays size={18} className="text-slate-400" /></div>
                <div className="mt-6 space-y-3">
                  {[1,2,3,4,5,6,0].map((day) => <div key={day} className="grid grid-cols-[72px_minmax(0,1fr)_36px] items-center gap-3"><span className="text-xs font-medium text-slate-500">{["Min","Sen","Sel","Rab","Kam","Jum","Sab"][day]}</span><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#1c5550]" style={{ width: `${insights.weekdays[day] / maxWeekday * 100}%` }} /></div><span className="text-right text-xs tabular-nums text-slate-500">{insights.weekdays[day]}</span></div>)}
                </div>
                <div className="mt-5 rounded-xl bg-[#f1f6f4] p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-[#47736d]">Hari terpadat</p><p className="mt-1 text-xl font-semibold text-[#173b37]">{hasActivity ? insights.peakWeekdayName : "Belum tersedia"}</p></div>
              </article>
            </section>

            <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_16px_45px_-34px_rgba(15,23,42,.3)]">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
                <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Card performance</p><h3 className="mt-1 text-lg font-semibold">Kartu dengan interaksi tertinggi</h3><p className="mt-1 text-xs text-slate-500">Diurutkan berdasarkan jumlah tap selama 90 hari.</p></div>
                <button onClick={() => router.push("/dashboard#cards")} className="inline-flex items-center gap-1 text-xs font-semibold text-[#1c5550] hover:text-[#123d38]">Kelola kartu <ArrowUpRight size={14} /></button>
              </div>
              {insights.topCards.length ? <div className="divide-y divide-slate-100">{insights.topCards.slice(0, 6).map((card, index) => <div key={card.id} className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 sm:px-7"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{card.card_name || "Untitled Card"}</p><p className="mt-1 text-[10px] text-slate-400">{card.active ? "Aktif" : "Nonaktif"} · {card.public_code}</p></div><div className="text-right"><p className="text-lg font-semibold tabular-nums">{card.taps.toLocaleString("id-ID")}</p><p className="text-[10px] text-slate-400">tap</p></div></div>)}</div> : <p className="px-5 py-8 text-center text-sm text-slate-400">Belum ada kartu untuk ditampilkan.</p>}
            </section>
          </>
        )}

        <footer className="mt-7 flex flex-col gap-2 border-t border-slate-200 pt-5 text-[10px] leading-5 text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Customer Insights · DiTapAja</p>
          <p>Visitor ID bersifat anonim. Data yang tidak memiliki visitor ID tidak dihitung sebagai pengunjung unik atau kunjungan berulang.</p>
        </footer>
      </div>
    </main>
  );
}
