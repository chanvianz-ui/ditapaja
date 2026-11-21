"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CalendarDays, Clock3, Loader2, Sparkles, Users, UserRoundCheck, MousePointerClick, TrendingUp } from "lucide-react";
import "./customer-insights.css";
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
    return (
    <main className="ditapaja-insights-page">
      <div className="ditapaja-insights-wrap">
        <header className="ditapaja-insights-heading">
          <div>
            <div className="ditapaja-insights-kicker"><span /> ANALYTICS / CUSTOMER INTELLIGENCE</div>
            <h1>Customer <em>Insights</em></h1>
            <p>Kenali pola interaksi pelanggan dari setiap kartu NFC yang digunakan.</p>
          </div>
          <div className="ditapaja-insights-live"><i /> Data diperbarui saat halaman dibuka</div>
        </header>

        <section className="ditapaja-insights-hero">
          <div className="ditapaja-insights-hero-copy">
            <span className="ditapaja-insights-overline"><Sparkles size={13}/> AUDIENCE OVERVIEW</span>
            <h2>Setiap interaksi<br/><strong>punya arti.</strong></h2>
            <p>Pahami kapan pelanggan datang, seberapa sering mereka kembali, dan kartu mana yang paling banyak menarik perhatian.</p>
            <div className="ditapaja-insights-tags"><span>90 hari data</span><span>Visitor ID anonim</span><span>{cards.length} kartu terhubung</span></div>
          </div>
          <div className="ditapaja-insights-hero-stat">
            <span>PENGUNJUNG TERUKUR</span>
            <strong>{insights.uniqueVisitors.toLocaleString("id-ID")}</strong>
            <small>visitor ID anonim · 90 hari</small>
            <div className="ditapaja-insights-stat-rule"/>
            <p>Angka agregat, bukan identitas pribadi pengunjung.</p>
          </div>
          <div className="ditapaja-insights-hero-orb" aria-hidden="true"/>
        </section>

        {error && <div role="alert" className="ditapaja-insights-error"><b>!</b><span>{error}</span><button onClick={() => window.location.reload()}>Coba lagi</button></div>}

        <section className="ditapaja-insights-section-head">
          <div><span className="ditapaja-insights-kicker">THE NUMBERS</span><h2>Performa audiens</h2><p>Ringkasan aktivitas dalam periode yang dipilih.</p></div>
          <div className="ditapaja-insights-period" role="group" aria-label="Pilih periode aktivitas">
            {([7, 30, 90] as const).map(value => <button key={value} aria-pressed={period === value} onClick={() => setPeriod(value)}>{value} hari</button>)}
          </div>
        </section>

        {loading ? (
          <div className="ditapaja-insights-loading"><Loader2 size={20} className="ditapaja-insights-spin"/> Mengolah aktivitas pelanggan...</div>
        ) : (
          <>
            <section className="ditapaja-insights-metrics">
              {[
                {label:"Total interaksi",value:totalTaps.toLocaleString("id-ID"),note:\`Tap dalam \${period} hari\`,icon:MousePointerClick,tag:"01"},
                {label:"Pengunjung unik",value:insights.uniqueVisitors.toLocaleString("id-ID"),note:"Visitor ID anonim · 90 hari",icon:Users,tag:"02"},
                {label:"Pengunjung kembali",value:insights.returningVisitors.toLocaleString("id-ID"),note:\`\${insights.returningRate.toFixed(1)}% dari pengunjung\`,icon:UserRoundCheck,tag:"03"},
                {label:"Waktu paling ramai",value:hasAnyActivity?formatHour(insights.peakHour):"—",note:hasAnyActivity?"Jam dengan tap terbanyak":"Belum ada data",icon:Clock3,tag:"04"}
              ].map(item => <article className="ditapaja-insights-metric" key={item.label}>
                <div className="ditapaja-insights-metric-top"><span>{item.label}</span><i><item.icon size={17}/></i></div>
                <strong>{item.value}</strong><small>{item.note}</small><b className="ditapaja-insights-metric-index">{item.tag}</b>
              </article>)}
            </section>

            <section className="ditapaja-insights-grid ditapaja-insights-grid-main">
              <article className="ditapaja-insights-panel ditapaja-insights-timeline">
                <div className="ditapaja-insights-panel-head"><div><span className="ditapaja-insights-kicker">ENGAGEMENT TIMELINE</span><h3>Ritme kunjungan</h3><p>Jumlah tap per hari selama {period} hari terakhir.</p></div><b className="ditapaja-insights-total">{totalTaps.toLocaleString("id-ID")} <small>TOTAL TAP</small></b></div>
                {hasPeriodActivity ? <div className="ditapaja-insights-chart" data-period={period}>
                  {insights.daily.map((day,index) => <div className="ditapaja-insights-chart-col" key={day.key} title={\`\${day.label}: \${day.taps} tap\`}>
                    <div className="ditapaja-insights-chart-track"><i className={day.taps ? "has-value" : ""} style={{height:day.taps ? \`\${Math.max(3,day.taps/insights.dailyMax*100)}%\` : "3px"}}/></div>
                    {(period===7||(period===30&&index%5===0)||(period===90&&index%15===0)||index===insights.daily.length-1) && <span>{day.label}</span>}
                  </div>)}
                </div> : <div className="ditapaja-insights-empty"><TrendingUp size={24}/><b>Belum ada aktivitas pelanggan</b><span>Grafik akan terisi setelah kartu NFC atau QR mulai digunakan.</span></div>}
                <div className="ditapaja-insights-panel-foot"><span><i/> Aktivitas tap</span><span>Periode {period} hari</span></div>
              </article>

              <article className="ditapaja-insights-panel ditapaja-insights-return">
                <div className="ditapaja-insights-panel-head"><div><span className="ditapaja-insights-kicker">VISITOR LOYALTY</span><h3>Kunjungan berulang</h3><p>Visitor ID yang melakukan tap lebih dari sekali.</p></div></div>
                <div className="ditapaja-insights-return-body">
                  <div className="ditapaja-insights-ring" style={{"--ring-value":\`\${insights.returningRate}%\`} as React.CSSProperties}><div><strong>{insights.returningRate.toFixed(0)}<small>%</small></strong><span>RETURN RATE</span></div></div>
                  <div className="ditapaja-insights-return-copy"><strong>{insights.returningVisitors.toLocaleString("id-ID")}</strong><span>pengunjung terdeteksi kembali</span><small>Dari {insights.uniqueVisitors.toLocaleString("id-ID")} visitor ID terukur.</small></div>
                </div>
                <div className="ditapaja-insights-note">Indikator kunjungan ulang, bukan identifikasi orang.</div>
              </article>
            </section>

            <section className="ditapaja-insights-grid ditapaja-insights-grid-secondary">
              <article className="ditapaja-insights-panel">
                <div className="ditapaja-insights-panel-head"><div><span className="ditapaja-insights-kicker">VISIT TIMING</span><h3>Jam kunjungan</h3><p>Distribusi tap berdasarkan jam lokal perangkat.</p></div><Clock3 size={19}/></div>
                <div className="ditapaja-insights-hour-chart">{insights.hours.map((count,hour) => <div key={hour} title={\`\${formatHour(hour)} · \${count} tap\`}><i className={count ? "has-value" : ""} style={{height:count ? \`\${count/maxHour*100}%\` : "3px"}}/></div>)}</div>
                <div className="ditapaja-insights-axis"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div>
                <div className="ditapaja-insights-highlight"><span>JAM TERPADAT</span><strong>{hasAnyActivity?formatHour(insights.peakHour):"Belum tersedia"}</strong></div>
              </article>
              <article className="ditapaja-insights-panel">
                <div className="ditapaja-insights-panel-head"><div><span className="ditapaja-insights-kicker">WEEKLY RHYTHM</span><h3>Hari paling aktif</h3><p>Perbandingan aktivitas dari Senin sampai Minggu.</p></div><CalendarDays size={19}/></div>
                <div className="ditapaja-insights-weekdays">{[1,2,3,4,5,6,0].map(day => <div key={day}><span>{["Min","Sen","Sel","Rab","Kam","Jum","Sab"][day]}</span><div><i style={{width:\`\${insights.weekdays[day]/maxWeekday*100}%\`}}/></div><b>{insights.weekdays[day]}</b></div>)}</div>
                <div className="ditapaja-insights-highlight"><span>HARI TERPADAT</span><strong>{hasAnyActivity?insights.peakWeekdayName:"Belum tersedia"}</strong></div>
              </article>
            </section>

            <section className="ditapaja-insights-panel ditapaja-insights-cards">
              <div className="ditapaja-insights-panel-head"><div><span className="ditapaja-insights-kicker">CARD PERFORMANCE</span><h3>Kartu dengan interaksi tertinggi</h3><p>Diurutkan berdasarkan jumlah tap selama 90 hari.</p></div><button onClick={()=>router.push("/dashboard#cards")}>Kelola kartu <ArrowUpRight size={15}/></button></div>
              {insights.topCards.length ? <div className="ditapaja-insights-card-list">{insights.topCards.slice(0,6).map((card,index)=><div key={card.id}>
                <span className="ditapaja-insights-rank">{String(index+1).padStart(2,"0")}</span><div className="ditapaja-insights-card-name"><b>{card.card_name||"Untitled Card"}</b><small>{card.active?"Aktif":"Nonaktif"} · {card.public_code}</small></div><strong>{card.taps.toLocaleString("id-ID")}<small> TAP</small></strong>
              </div>)}</div> : <div className="ditapaja-insights-no-cards">Belum ada kartu untuk ditampilkan.</div>}
            </section>
          </>
        )}
        <footer className="ditapaja-insights-footer"><span>DITAPAJA / CUSTOMER INTELLIGENCE</span><span>Visitor ID bersifat anonim dan tidak mengungkap identitas pribadi.</span></footer>
      </div>
    </main>
  );
}
