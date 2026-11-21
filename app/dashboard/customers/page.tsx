"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Loader2,
  Sparkles,
  Users,
  UserRoundCheck,
  MousePointerClick,
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
  const hasAnyActivity = events.length > 0;
  const hasPeriodActivity = totalTaps > 0;

  return (
    <main className="dt-customer-insights min-h-screen text-slate-100">
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-7 sm:px-6 sm:pt-10 xl:px-10">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.24em] text-sky-300">DiTapAja / Analytics</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-.055em] text-white sm:text-4xl">Customer <span className="text-sky-300">Insights.</span></h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Pahami bagaimana pelanggan berinteraksi dengan kartu NFC dan kapan mereka paling aktif.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/70 px-3.5 py-2.5 text-[11px] font-semibold text-slate-300 shadow-lg shadow-black/10">
            <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,.8)]" />
            Data diperbarui saat halaman dibuka
          </div>
        </header>

        <section className="relative isolate overflow-hidden rounded-[26px] border border-sky-300/15 bg-[radial-gradient(ellipse_at_85%_0%,rgba(71,125,255,.3),transparent_42%),linear-gradient(125deg,#172943,#101c30_58%,#0c1728)] p-6 shadow-[0_28px_80px_-48px_rgba(37,99,235,.45)] sm:p-8 lg:p-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-sky-200/10 shadow-[0_0_0_28px_rgba(125,180,255,.025),0_0_0_58px_rgba(125,180,255,.018)]" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/20 bg-sky-200/[.07] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.2em] text-sky-200"><Sparkles size={13}/> Audience intelligence</div>
              <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-[1.08] tracking-[-.05em] text-white sm:text-4xl lg:text-[48px]">Setiap tap punya cerita.</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">Lihat pola kunjungan, kenali pengunjung yang kembali, dan temukan waktu terbaik pelanggan berinteraksi dengan bisnismu.</p>
              <div className="mt-6 flex flex-wrap gap-2 text-[10px] font-semibold text-slate-300">
                <span className="rounded-lg border border-white/10 bg-white/[.05] px-3 py-2">90 hari data</span>
                <span className="rounded-lg border border-white/10 bg-white/[.05] px-3 py-2">Visitor ID anonim</span>
                <span className="rounded-lg border border-white/10 bg-white/[.05] px-3 py-2">{cards.length} kartu terhubung</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0b1729]/65 p-5 backdrop-blur-xl">
              <p className="text-[9px] font-bold uppercase tracking-[.19em] text-sky-200/70">Pengunjung terukur</p>
              <div className="mt-3 flex items-end gap-2"><span className="text-5xl font-semibold tracking-[-.06em] text-white tabular-nums">{insights.uniqueVisitors.toLocaleString("id-ID")}</span><span className="pb-2 text-[10px] text-slate-400">90 hari</span></div>
              <div className="mt-4 h-px bg-white/10"/>
              <p className="mt-3 text-[10px] leading-5 text-slate-400">Berdasarkan visitor ID anonim yang tercatat. Bukan identitas pribadi pengunjung.</p>
            </div>
          </div>
        </section>

        {error && (
          <div role="alert" className="mt-5 flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[.08] p-4 text-sm text-rose-200">
            <span className="font-bold">!</span><p>{error}</p>
            <button onClick={() => window.location.reload()} className="ml-auto shrink-0 text-xs font-bold underline">Coba lagi</button>
          </div>
        )}

        <section className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-[9px] font-bold uppercase tracking-[.2em] text-sky-300">Performance overview</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Performa audiens</h2><p className="mt-1 text-xs text-slate-400">Ringkasan aktivitas berdasarkan periode pilihan.</p></div>
          <div className="inline-flex rounded-xl border border-slate-700 bg-slate-900/80 p-1" role="group" aria-label="Pilih periode aktivitas">
            {([7, 30, 90] as const).map((value) => <button key={value} onClick={() => setPeriod(value)} aria-pressed={period === value} className={`rounded-lg px-4 py-2 text-[11px] font-semibold transition-all ${period === value ? "bg-gradient-to-r from-sky-300 to-blue-400 text-slate-950 shadow-lg shadow-blue-500/15" : "text-slate-400 hover:bg-white/[.06] hover:text-white"}`}>{value} hari</button>)}
          </div>
        </section>

        {loading ? (
          <div className="mt-5 flex min-h-64 items-center justify-center rounded-2xl border border-slate-700/70 bg-slate-900/50"><div className="flex items-center gap-3 text-sm text-slate-400"><Loader2 size={18} className="animate-spin text-sky-300"/> Mengolah aktivitas pelanggan...</div></div>
        ) : (
          <>
            <section className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                {label:"Total interaksi",value:totalTaps.toLocaleString("id-ID"),note:`Tap dalam ${period} hari`,icon:MousePointerClick,accent:"text-sky-300"},
                {label:"Pengunjung unik",value:insights.uniqueVisitors.toLocaleString("id-ID"),note:"Visitor ID anonim · 90 hari",icon:Users,accent:"text-blue-300"},
                {label:"Pengunjung kembali",value:insights.returningVisitors.toLocaleString("id-ID"),note:`${insights.returningRate.toFixed(1)}% dari pengunjung terukur`,icon:UserRoundCheck,accent:"text-indigo-300"},
                {label:"Waktu paling ramai",value:hasAnyActivity?formatHour(insights.peakHour):"—",note:hasAnyActivity?"Jam dengan tap terbanyak":"Belum ada data",icon:Clock3,accent:"text-cyan-300"}
              ].map((item,index)=>(
                <article key={item.label} className="group relative overflow-hidden rounded-2xl border border-slate-700/70 bg-[linear-gradient(145deg,rgba(24,39,62,.92),rgba(12,21,36,.96))] p-4 shadow-[0_16px_40px_-30px_rgba(0,0,0,.7)] transition duration-300 hover:-translate-y-1 hover:border-sky-300/30 sm:p-5">
                  <div className="flex items-center justify-between gap-2"><span className="text-[11px] font-medium text-slate-400">{item.label}</span><span className={`grid h-8 w-8 place-items-center rounded-lg border border-white/[.07] bg-white/[.04] ${item.accent}`}><item.icon size={16}/></span></div>
                  <p className="mt-5 text-2xl font-semibold tracking-[-.04em] text-white tabular-nums sm:text-3xl">{item.value}</p><p className="mt-1 text-[10px] text-slate-500">{item.note}</p>
                  <span className="absolute -bottom-9 -right-5 h-24 w-24 rounded-full border border-sky-300/[.07] transition duration-500 group-hover:scale-125"/>
                </article>
              ))}
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.8fr)]">
              <article className="rounded-2xl border border-slate-700/70 bg-[linear-gradient(145deg,rgba(20,33,53,.94),rgba(12,20,34,.98))] p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-sky-300">Engagement timeline</p><h3 className="mt-1 text-lg font-semibold text-white">Ritme kunjungan</h3><p className="mt-1 text-[11px] text-slate-400">Jumlah tap per hari selama {period} hari terakhir.</p></div><span className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-[10px] font-semibold text-slate-300">{totalTaps.toLocaleString("id-ID")} total tap</span></div>
                {hasPeriodActivity ? (
                  <div className="mt-7 flex h-52 items-end gap-1 sm:h-60 sm:gap-2">
                    {insights.daily.map((day,index)=><div key={day.key} title={`${day.label}: ${day.taps} tap`} className="group/bar flex h-full min-w-0 flex-1 flex-col justify-end">
                      <div className="flex flex-1 items-end justify-center"><div className={`w-full max-w-8 rounded-t-md transition-all duration-500 ${day.taps?"bg-gradient-to-t from-blue-600 to-sky-300 shadow-[0_0_16px_rgba(56,189,248,.13)]":"bg-slate-700/60"} group-hover/bar:brightness-125`} style={{height:day.taps?`${Math.max(3,day.taps/insights.dailyMax*100)}%`:"3px"}}/></div>
                      {(period===7||(period===30&&index%5===0)||(period===90&&index%15===0)||index===insights.daily.length-1)&&<span className="mt-3 truncate text-center text-[8px] text-slate-500 sm:text-[9px]">{day.label}</span>}
                    </div>)}
                  </div>
                ):<div className="mt-6 flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/25 px-5 text-center"><TrendingUp size={23} className="text-sky-300/70"/><p className="mt-3 text-sm font-semibold text-slate-200">Belum ada aktivitas pelanggan</p><p className="mt-1 max-w-sm text-[11px] leading-5 text-slate-500">Grafik akan terisi setelah kartu NFC atau QR mulai digunakan.</p></div>}
                <div className="mt-5 flex items-center gap-4 border-t border-slate-700/70 pt-4 text-[10px] text-slate-400"><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-sm bg-sky-300"/> Tap kartu</span><span className="ml-auto">Periode: {period} hari</span></div>
              </article>

              <article className="rounded-2xl border border-slate-700/70 bg-[linear-gradient(145deg,rgba(20,33,53,.94),rgba(12,20,34,.98))] p-5 sm:p-7">
                <p className="text-[9px] font-bold uppercase tracking-[.18em] text-sky-300">Return behaviour</p><h3 className="mt-1 text-lg font-semibold text-white">Kunjungan berulang</h3><p className="mt-1 text-[11px] leading-5 text-slate-400">Visitor ID yang tercatat melakukan tap lebih dari satu kali.</p>
                <div className="mt-7 flex items-center gap-4">
                  <div className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full" style={{background:`conic-gradient(#60a5fa ${insights.returningRate}%, #26364d 0)`}}><div className="grid h-20 w-20 place-items-center rounded-full border border-slate-700 bg-[#111e31] text-center"><span className="text-2xl font-semibold text-white tabular-nums">{insights.returningRate.toFixed(0)}<small className="text-xs text-sky-300">%</small></span></div></div>
                  <div className="min-w-0"><p className="text-2xl font-semibold text-white tabular-nums">{insights.returningVisitors.toLocaleString("id-ID")}</p><p className="mt-1 text-[11px] text-slate-400">pengunjung terdeteksi kembali</p><p className="mt-2 text-[10px] leading-4 text-slate-500">Dari {insights.uniqueVisitors.toLocaleString("id-ID")} visitor ID terukur.</p></div>
                </div>
                <div className="mt-7 border-t border-slate-700/70 pt-4 text-[10px] leading-5 text-slate-500">Pengunjung tanpa visitor ID tidak masuk perhitungan. Angka ini indikator kunjungan ulang, bukan identifikasi orang.</div>
              </article>
            </section>

            <section className="mt-4 grid gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-slate-700/70 bg-[linear-gradient(145deg,rgba(20,33,53,.94),rgba(12,20,34,.98))] p-5 sm:p-7">
                <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-sky-300">Visit timing</p><h3 className="mt-1 text-lg font-semibold text-white">Jam kunjungan</h3><p className="mt-1 text-[11px] text-slate-400">Distribusi tap berdasarkan jam lokal perangkat.</p></div><Clock3 size={18} className="text-sky-300"/></div>
                <div className="mt-6 grid h-36 grid-cols-12 items-end gap-1 sm:gap-2">{insights.hours.map((count,hour)=><div key={hour} title={`${formatHour(hour)} · ${count} tap`} className="group flex h-full flex-col justify-end"><div className={`min-h-[3px] rounded-t-sm transition-all duration-300 group-hover:brightness-125 ${count?"bg-gradient-to-t from-blue-700 to-sky-300":"bg-slate-700/60"}`} style={{height:count?`${count/maxHour*100}%`:"3px"}}/></div>)}</div>
                <div className="mt-3 flex justify-between text-[9px] text-slate-500"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div>
                <div className="mt-5 rounded-xl border border-sky-300/10 bg-sky-300/[.06] p-4"><p className="text-[9px] font-bold uppercase tracking-[.16em] text-sky-300">Jam terpadat</p><p className="mt-1 text-xl font-semibold text-white">{hasAnyActivity?formatHour(insights.peakHour):"Belum tersedia"}</p></div>
              </article>
              <article className="rounded-2xl border border-slate-700/70 bg-[linear-gradient(145deg,rgba(20,33,53,.94),rgba(12,20,34,.98))] p-5 sm:p-7">
                <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-sky-300">Weekly rhythm</p><h3 className="mt-1 text-lg font-semibold text-white">Hari paling aktif</h3><p className="mt-1 text-[11px] text-slate-400">Perbandingan aktivitas dari Senin sampai Minggu.</p></div><CalendarDays size={18} className="text-sky-300"/></div>
                <div className="mt-7 space-y-4">{[1,2,3,4,5,6,0].map(day=><div key={day} className="grid grid-cols-[45px_minmax(0,1fr)_35px] items-center gap-3"><span className="text-[11px] font-medium text-slate-400">{["Min","Sen","Sel","Rab","Kam","Jum","Sab"][day]}</span><div className="h-2 overflow-hidden rounded-full bg-slate-700/70"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-300 transition-all duration-500" style={{width:`${insights.weekdays[day]/maxWeekday*100}%`}}/></div><span className="text-right text-[10px] tabular-nums text-slate-400">{insights.weekdays[day]}</span></div>)}</div>
                <div className="mt-6 rounded-xl border border-sky-300/10 bg-sky-300/[.06] p-4"><p className="text-[9px] font-bold uppercase tracking-[.16em] text-sky-300">Hari terpadat</p><p className="mt-1 text-xl font-semibold text-white">{hasAnyActivity?insights.peakWeekdayName:"Belum tersedia"}</p></div>
              </article>
            </section>

            <section className="mt-4 overflow-hidden rounded-2xl border border-slate-700/70 bg-[linear-gradient(145deg,rgba(20,33,53,.94),rgba(12,20,34,.98))]">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-700/70 px-5 py-5 sm:px-7"><div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-sky-300">Card performance</p><h3 className="mt-1 text-lg font-semibold text-white">Kartu dengan interaksi tertinggi</h3><p className="mt-1 text-[11px] text-slate-400">Diurutkan berdasarkan jumlah tap selama 90 hari.</p></div><button onClick={()=>router.push("/dashboard#cards")} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/30 px-3 py-2 text-[10px] font-semibold text-sky-300 transition hover:border-sky-300/30 hover:bg-sky-300/[.07]">Kelola kartu <ArrowUpRight size={14}/></button></div>
              {insights.topCards.length?<div className="divide-y divide-slate-700/60">{insights.topCards.slice(0,6).map((card,index)=><div key={card.id} className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 transition hover:bg-white/[.025] sm:px-7"><span className="grid h-8 w-8 place-items-center rounded-lg border border-slate-700 bg-slate-950/40 text-[10px] font-bold text-sky-300">{String(index+1).padStart(2,"0")}</span><div className="min-w-0"><p className="truncate text-[13px] font-semibold text-slate-100">{card.card_name||"Untitled Card"}</p><p className="mt-1 truncate text-[9px] text-slate-500">{card.active?"Aktif":"Nonaktif"} · {card.public_code}</p></div><div className="text-right"><p className="text-lg font-semibold text-white tabular-nums">{card.taps.toLocaleString("id-ID")}</p><p className="text-[9px] text-slate-500">tap</p></div></div>)}</div>:<p className="px-5 py-9 text-center text-xs text-slate-500">Belum ada kartu untuk ditampilkan.</p>}
            </section>
          </>
        )}

        <footer className="mt-8 flex flex-col gap-2 border-t border-slate-700/70 pt-5 text-[9px] leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>Customer Insights · DiTapAja</p><p>Visitor ID bersifat anonim dan tidak mengungkap identitas pribadi.</p></footer>
      </div>
    </main>
  );
}
