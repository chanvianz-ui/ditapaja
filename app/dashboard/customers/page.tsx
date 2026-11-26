"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, CreditCard, Loader2, MapPin, MousePointerClick, RefreshCw, Users } from "lucide-react";
import "./customer-insights.css";
import { supabase } from "@/lib/supabase";

type Card = { id: string; card_name: string | null; public_code: string; active: boolean };
type DailyMetric = { day: string; taps: number; clicks: number };
type CardMetric = { card_id: string; card_name: string; location_id: string | null; taps: number; clicks: number; unique_visitors: number; ctr: number };
type LocationMetric = { location_id: string | null; card_count: number; taps: number; clicks: number; ctr: number };
type InsightsData = {
  period_days: number;
  summary: { total_taps: number; unique_visitors: number; review_clicks: number; ctr: number };
  previous: { total_taps: number; review_clicks: number };
  daily: DailyMetric[];
  cards: CardMetric[];
  locations: LocationMetric[];
  insight_comparison: { tap_change_pct: number | null; click_change_pct: number | null };
};

const number = (value: number) => Number(value || 0).toLocaleString("id-ID");
const percent = (value: number | null) => value === null ? "—" : (value > 0 ? "+" : "") + value.toLocaleString("id-ID", { maximumFractionDigits: 1 }) + "%";

function formatDay(value: string, period: number) {
  const date = new Date(value + "T12:00:00+07:00");
  return period === 7
    ? date.toLocaleDateString("id-ID", { weekday: "short", timeZone: "Asia/Jakarta" })
    : date.toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" });
}

export default function CustomerInsightsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [cards, setCards] = useState<Card[]>([]);
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError || !auth.user) {
          router.replace("/login");
          return;
        }

        const [cardResult, insightsResult] = await Promise.all([
          supabase.from("nfc_cards")
            .select("id,card_name,public_code,active")
            .eq("user_id", auth.user.id)
            .is("archived_at", null)
            .order("created_at", { ascending: false }),
          supabase.rpc("get_customer_insights", { p_days: period }),
        ]);

        if (cardResult.error) throw cardResult.error;
        if (insightsResult.error) throw insightsResult.error;
        if (cancelled) return;

        setCards((cardResult.data || []) as Card[]);
        setData(insightsResult.data as InsightsData);
      } catch (cause) {
        console.error("Customer insights loading failed:", cause);
        if (!cancelled) setError("Analitik belum dapat dimuat. Coba muat ulang halaman.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [period, router]);

  const cardMap = useMemo(() => new Map(cards.map(card => [card.id, card])), [cards]);
  const chartMax = Math.max(1, ...(data?.daily || []).flatMap(day => [day.taps, day.clicks]));
  const topCards = (data?.cards || []).filter(item => cardMap.has(item.card_id)).slice(0, 6);
  const locations = data?.locations || [];

  return (
    <main className="ci-page">
      <div className="ci-wrap">
        <header className="ci-header">
          <div>
            <span className="ci-eyebrow"><Activity size={13}/> ANALITIK / CUSTOMER INTELLIGENCE</span>
            <h1>Analitik <em>pelanggan</em></h1>
            <p>Pahami interaksi pelanggan dari setiap kartu NFC dan lihat seberapa efektif kartu mengarahkan mereka ke Google Review.</p>
          </div>
          <div className="ci-period" role="group" aria-label="Pilih periode analitik">
            {([7, 30, 90] as const).map(value => (
              <button key={value} type="button" aria-pressed={period === value} onClick={() => setPeriod(value)} disabled={loading}>
                {value} hari
              </button>
            ))}
          </div>
        </header>

        {error && (
          <div className="ci-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setPeriod(value => value)}>Coba lagi</button>
          </div>
        )}

        {loading ? (
          <div className="ci-loading" role="status"><Loader2 size={20} className="ci-spin"/> Mengambil ringkasan analitik…</div>
        ) : !data ? (
          <div className="ci-empty"><BarChart3 size={28}/><strong>Data analitik belum tersedia</strong><span>Coba muat ulang halaman beberapa saat lagi.</span></div>
        ) : (
          <>
            <section className="ci-kpis" aria-label="Ringkasan performa">
              <article className="ci-kpi ci-kpi-primary">
                <span><MousePointerClick size={15}/> TOTAL TAP</span>
                <strong>{number(data.summary.total_taps)}</strong>
                <small>Interaksi dalam {period} hari</small>
                <b className={data.insight_comparison.tap_change_pct !== null && data.insight_comparison.tap_change_pct < 0 ? "ci-down" : "ci-up"}>
                  {data.insight_comparison.tap_change_pct === null ? "Belum ada pembanding" : percent(data.insight_comparison.tap_change_pct) + " vs periode sebelumnya"}
                </b>
              </article>
              <article className="ci-kpi">
                <span><Users size={15}/> PENGUNJUNG UNIK</span>
                <strong>{number(data.summary.unique_visitors)}</strong>
                <small>Visitor ID anonim</small>
              </article>
              <article className="ci-kpi">
                <span><ArrowUpRight size={15}/> KLIK GOOGLE REVIEW</span>
                <strong>{number(data.summary.review_clicks)}</strong>
                <small>Interaksi menuju halaman ulasan</small>
                <b className={data.insight_comparison.click_change_pct !== null && data.insight_comparison.click_change_pct < 0 ? "ci-down" : "ci-up"}>
                  {data.insight_comparison.click_change_pct === null ? "Belum ada pembanding" : percent(data.insight_comparison.click_change_pct) + " vs periode sebelumnya"}
                </b>
              </article>
              <article className="ci-kpi">
                <span><BarChart3 size={15}/> TAP KE REVIEW</span>
                <strong>{Number(data.summary.ctr || 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })}<i>%</i></strong>
                <small>Rasio klik review dibanding tap</small>
              </article>
            </section>

            <section className="ci-panel ci-timeline">
              <div className="ci-panel-head">
                <div><span className="ci-eyebrow">ENGAGEMENT TIMELINE</span><h2>Ritme interaksi</h2><p>Perbandingan tap dan klik Google Review per hari.</p></div>
                <div className="ci-legend"><span><i className="ci-legend-tap"/> Tap</span><span><i className="ci-legend-click"/> Klik review</span></div>
              </div>
              {data.daily.length ? (
                <div className="ci-chart" data-period={period}>
                  {data.daily.map((day, index) => (
                    <div className="ci-chart-day" key={day.day} title={formatDay(day.day, period) + ": " + number(day.taps) + " tap, " + number(day.clicks) + " klik"}>
                      <div className="ci-bars">
                        <i className="ci-bar-tap" style={{ height: (day.taps ? Math.max(3, day.taps / chartMax * 100) : 1) + "%" }}/>
                        <i className="ci-bar-click" style={{ height: (day.clicks ? Math.max(3, day.clicks / chartMax * 100) : 1) + "%" }}/>
                      </div>
                      {(period === 7 || (period === 30 && index % 5 === 0) || (period === 90 && index % 15 === 0) || index === data.daily.length - 1) && <span>{formatDay(day.day, period)}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ci-empty"><BarChart3 size={26}/><strong>Belum ada aktivitas</strong><span>Grafik akan terisi setelah kartu NFC atau QR digunakan.</span></div>
              )}
              <div className="ci-chart-foot"><span>{period} hari terakhir</span><span>Zona waktu Asia/Jakarta</span></div>
            </section>

            <section className="ci-lower-grid">
              <article className="ci-panel">
                <div className="ci-panel-head">
                  <div><span className="ci-eyebrow">CARD PERFORMANCE</span><h2>Kartu paling aktif</h2><p>Urutan berdasarkan jumlah tap dalam periode terpilih.</p></div>
                  <CreditCard size={19}/>
                </div>
                {topCards.length ? (
                  <div className="ci-card-list">
                    {topCards.map((item, index) => {
                      const card = cardMap.get(item.card_id);
                      return (
                        <div className="ci-card-row" key={item.card_id}>
                          <span className="ci-rank">{String(index + 1).padStart(2, "0")}</span>
                          <div className="ci-card-name"><strong>{card?.card_name || item.card_name || "Kartu tanpa nama"}</strong><small>{card?.active ? "Aktif" : "Nonaktif"} · {card?.public_code || "—"}</small></div>
                          <div className="ci-card-stats"><strong>{number(item.taps)} <small>TAP</small></strong><span>{number(item.clicks)} klik · {Number(item.ctr || 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%</span></div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="ci-empty ci-empty-compact"><CreditCard size={23}/><strong>Belum ada data kartu</strong><span>Statistik akan muncul setelah kartu menerima interaksi.</span></div>
                )}
              </article>

              <article className="ci-panel">
                <div className="ci-panel-head">
                  <div><span className="ci-eyebrow">LOCATION PERFORMANCE</span><h2>Performa lokasi</h2><p>Ringkasan aktivitas kartu berdasarkan lokasi bisnis.</p></div>
                  <MapPin size={19}/>
                </div>
                {locations.length ? (
                  <div className="ci-location-list">
                    {locations.map((item, index) => (
                      <div className="ci-location-row" key={item.location_id || "no-location"}>
                        <span className="ci-rank">{String(index + 1).padStart(2, "0")}</span>
                        <div><strong>{item.location_id ? "Lokasi bisnis " + (index + 1) : "Tanpa lokasi"}</strong><small>{number(item.card_count)} kartu terhubung</small></div>
                        <b>{number(item.taps)} <small>TAP</small></b>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ci-empty ci-empty-compact"><MapPin size={23}/><strong>Belum ada data lokasi</strong><span>Aktivitas lokasi akan ditampilkan di sini.</span></div>
                )}
              </article>
            </section>
          </>
        )}

        <footer className="ci-footer"><span>DITAPAJA / CUSTOMER INTELLIGENCE</span><span>Visitor ID bersifat anonim dan tidak mengungkap identitas pribadi.</span></footer>
      </div>
    </main>
  );
}
