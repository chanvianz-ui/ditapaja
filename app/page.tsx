"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ArrowDownRight, ArrowUpRight, BarChart3, Check, Link2, MapPin, Nfc, QrCode, Smartphone, Star, RotateCcw, Wifi } from "lucide-react";
import SiteHeader from "./components/site-header";
import ProductCarousel from "./components/product-carousel";

const products = [
  { name: "Noir", label: "Noir", description: "Karakter tegas untuk bisnis yang ingin tampil standout.", tone: "noir", price: "Rp50.000", order: "READY TO ORDER", action: "Beli Noir", mode: "buy" },
  { name: "Blanc", label: "Blanc", description: "Minimal, bersih, dan mudah menyatu dengan identitas brand.", tone: "blanc", price: "Rp50.000", order: "READY TO ORDER", action: "Beli Blanc", mode: "buy" },
  { name: "Signature", label: "Signature", description: "Kartu dengan identitas visual bisnismu sendiri.", tone: "signature", price: "Rp60.000", order: "PRE-ORDER · MIN. 10 KARTU", action: "Pre-order", mode: "preorder" }
];

function BrandMark() {
  return <span className="dt-v2-brand-mark" aria-hidden="true"><i/><i/><i/></span>;
}

function HeroTapDemo() {
  const [tapped, setTapped] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [clock, setClock] = useState("--:--");
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const updateClock = () => setClock(new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()));
    updateClock();
    const timer = window.setInterval(updateClock, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const resetDemo = () => {
    setTapped(false);
    setShowReview(false);
    setRating(0);
    setReview("");
    setSubmitted(false);
    setDragOffset(0);
    dragStart.current = null;
  };

  const startDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    dragStart.current = { x: event.clientX, y: event.clientY };
    setDragOffset(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragStart.current) return;
    const dx = event.clientX - dragStart.current.x;
    setDragOffset(Math.max(0, Math.min(dx, 170)));
  };

  const finishDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragStart.current) return;
    const dx = event.clientX - dragStart.current.x;
    dragStart.current = null;
    setDragOffset(0);
    if (dx > 48) {
      setTapped(true);
      setShowReview(false);
      setSubmitted(false);
    }
  };

  return <div className={`home-hero-visual home-tap-demo ${tapped ? "is-tapped" : ""} ${submitted ? "is-submitted" : ""}`} aria-label="Simulasi pengalaman pelanggan menggunakan kartu NFC">
    <div className="home-demo-heading">
      <div><span className="home-section-index"><i/> LIVE INTERACTION</span><b>Coba sendiri pengalaman tap NFC</b></div>
      <span className="home-demo-disclaimer">DEMO · TANPA DATA TERKIRIM</span>
    </div>
    <div className="home-demo-stage">
      <div className="home-demo-card-wrap">
        <span className="home-demo-instruction">{tapped ? "KARTU TERBACA" : "GESER KARTU KE KANAN"}</span>
        <button type="button" className="home-demo-card" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={() => { dragStart.current = null; setDragOffset(0); }} style={dragOffset ? { transform: "translateX(" + dragOffset + "px) rotate(2deg) scale(.98)" } : undefined} onClick={(event) => { if (event.detail === 0 && !tapped) setTapped(true); }} aria-label="Geser kartu NFC ke kanan untuk memulai simulasi">
          <div className="home-demo-card-top"><BrandMark/><span>DITAPAJA</span><Nfc size={22}/></div>
          <div className="home-demo-card-title">YOUR<br/><em>review</em><br/>STARTS HERE.</div>
          <div className="home-demo-card-bottom"><span>ONE TAP TO REVIEW</span><span>NFC · QR</span></div>
          <span className="home-demo-card-glint"/>
        </button>
        <span className="home-demo-card-caption">NFC REVIEW CARD · NOIR</span>
      </div>
      <div className="home-demo-transfer" aria-hidden="true"><span/><ArrowUpRight size={23}/><small>NFC</small></div>
      <div className="home-demo-phone-wrap">
        <span className="home-demo-instruction">{!tapped ? "SMARTPHONE" : showReview ? "CONTOH FORM REVIEW" : "TUJUAN TERBUKA"}</span>
        <div className="home-demo-phone">
          <div className="home-phone-island"/>
          <div className="home-phone-status"><span>{clock}</span><span>●●● ▰</span></div>
          {!tapped ? <div className="home-phone-idle">
            <div className="home-phone-nfc"><Nfc size={29}/></div>
            <b>Ready to tap</b>
            <p>Dekatkan kartu ke ponsel untuk membuka halaman tujuan.</p>
            <span><i/> NFC CONNECTION READY</span>
          </div> : showReview ? <div className="home-demo-review-screen">
            <div className="home-demo-review-top"><button type="button" onClick={() => setShowReview(false)} aria-label="Kembali ke peta">‹</button><b>Review experience</b><span>•••</span></div>
            <div className="home-demo-review-brand"><div className="home-demo-review-avatar">D</div><div><b>DiTapAja</b><small>Contoh tampilan halaman ulasan</small></div></div>
            <div className="home-demo-review-prompt"><strong>Bagaimana pengalamanmu?</strong><p>Pilih rating untuk melihat alur review yang lebih praktis.</p></div>
            <div className="home-google-rating-picker" role="group" aria-label="Pilih rating">
              {[1,2,3,4,5].map((value) => <button key={value} type="button" className={rating >= value ? "selected" : ""} onClick={() => setRating(value)} aria-label={value + " bintang"} aria-pressed={rating === value}>★</button>)}
            </div>
            <span className="home-google-rating-label">{rating ? ["", "Kurang baik", "Cukup", "Baik", "Sangat baik", "Luar biasa"][rating] : "Ketuk bintang untuk memberi rating"}</span>
            <label className="home-demo-review-label" htmlFor="home-demo-review">Ceritakan pengalamanmu <span>OPSIONAL</span></label>
            <textarea id="home-demo-review" className="home-google-review-input" value={review} onChange={(event) => setReview(event.target.value)} placeholder="Tulis ulasan singkat..." maxLength={180}/>
            {submitted ? <div className="home-google-submitted" role="status"><Check size={15}/> Simulasi selesai. Tidak ada ulasan yang dikirim.</div> : <button type="button" className="home-google-submit" disabled={!rating} onClick={() => setSubmitted(true)}>Kirim simulasi <ArrowUpRight size={12}/></button>}
            <small className="home-google-note">Pratinjau interaktif · bukan pengiriman review sungguhan</small>
          </div> : <div className="home-google-screen">
            <div className="home-maps-appbar"><span className="home-maps-menu">☰</span><div className="home-maps-search"><span>⌕</span><b>DiTapAja</b><span>×</span></div><span className="home-maps-account">D</span></div>
            <div className="home-maps-map" aria-label="Ilustrasi tampilan peta">
              <div className="home-maps-map-grid"/><div className="home-maps-map-road road-a"/><div className="home-maps-map-road road-b"/><div className="home-maps-map-road road-c"/><div className="home-maps-map-park"/><div className="home-maps-map-water"/>
              <span className="home-maps-map-label label-a">Jalan utama</span><span className="home-maps-map-label label-b">Area sekitar</span><span className="home-maps-pin"><i/></span><span className="home-maps-map-fab">＋</span>
            </div>
            <div className="home-maps-place-sheet">
              <div className="home-maps-sheet-handle"/>
              <div className="home-maps-place-title"><div><small>DESTINATION PREVIEW</small><strong>DiTapAja</strong><span>Tujuan dari tautan Google Maps</span></div><span className="home-maps-place-icon"><MapPin size={18}/></span></div>
              <div className="home-maps-place-actions">
                <a href="https://maps.app.goo.gl/kQR7hMfPdd7EKAhY6" target="_blank" rel="noopener noreferrer"><span>➤</span> Rute</a>
                <a href="https://maps.app.goo.gl/kQR7hMfPdd7EKAhY6" target="_blank" rel="noopener noreferrer"><span>↗</span> Bagikan</a>
                <a href="https://maps.app.goo.gl/kQR7hMfPdd7EKAhY6" target="_blank" rel="noopener noreferrer"><span>⌑</span> Buka</a>
              </div>
              <button className="home-maps-open" type="button" onClick={() => { setShowReview(true); setSubmitted(false); }}>Lihat alur review <ArrowUpRight size={13}/></button>
              <a className="home-maps-real-link" href="https://maps.app.goo.gl/kQR7hMfPdd7EKAhY6" target="_blank" rel="noopener noreferrer">Buka tujuan di Google Maps <ArrowUpRight size={12}/></a>
              <small className="home-google-note">Ilustrasi peta · detail lokasi dibuka dari Google Maps asli</small>
            </div>
          </div>}
          <div className="home-phone-homebar"/>
        </div>
      </div>
    </div>
    <div className="home-demo-footer">
      <span>{!tapped ? "01 — Geser kartu ke kanan untuk mulai" : submitted ? "03 — Simulasi selesai" : showReview ? "02 — Pilih rating dan coba form review" : "01 — Kartu berhasil terbaca"}</span>
      <div className="home-demo-footer-actions">
        {tapped && !showReview && <button type="button" onClick={() => setShowReview(true)}>Coba alur review <ArrowUpRight size={12}/></button>}
        <button type="button" onClick={resetDemo}><RotateCcw size={13}/> Reset demo</button>
      </div>
    </div>
  </div>;
}
function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    {
      number: "01",
      eyebrow: "THE FIRST CONTACT",
      title: "Tap or scan.",
      description: "Pelanggan cukup mendekatkan smartphone ke kartu NFC atau memindai QR Code yang tersedia. Tidak perlu aplikasi tambahan.",
      note: "NFC + QR CODE",
      visual: "tap",
      visualTitle: "One simple tap.",
      visualCopy: "Dekatkan ponsel. Kartu akan terbaca otomatis."
    },
    {
      number: "02",
      eyebrow: "INSTANT REDIRECT",
      title: "Your page opens.",
      description: "Browser langsung membuka tautan tujuan yang sudah kamu atur. Pengalaman tetap cepat, familiar, dan mudah diikuti.",
      note: "DIRECT TO YOUR LINK",
      visual: "open",
      visualTitle: "Straight to the point.",
      visualCopy: "Tidak ada aplikasi yang harus diunduh."
    },
    {
      number: "03",
      eyebrow: "THE MOMENT THAT MATTERS",
      title: "Leave a review.",
      description: "Pelanggan tiba di halaman review bisnismu dan bisa membagikan pengalaman mereka dengan lebih praktis.",
      note: "READY FOR FEEDBACK",
      visual: "review",
      visualTitle: "Make feedback easier.",
      visualCopy: "Satu langkah lebih dekat ke ulasan pelanggan."
    }
  ];
  const step = steps[activeStep];

  return (
    <section className="dt-how-section" id="cara-kerja">
      <div className="dt-how-heading">
        <div>
          <span className="dt-how-kicker"><i/> 03 / HOW IT WORKS</span>
          <h2>From a tap<br/>to a <em>review.</em></h2>
        </div>
        <p>Teknologi di baliknya sederhana. Pengalaman pelanggan juga harus begitu.</p>
      </div>

      <div className="dt-how-workspace">
        <div className="dt-how-steps" role="tablist" aria-label="Tahapan penggunaan DiTapAja">
          {steps.map((item, index) => (
            <button
              key={item.number}
              type="button"
              role="tab"
              id={"dt-how-tab-" + index}
              aria-selected={activeStep === index}
              aria-controls="dt-how-panel"
              className={"dt-how-step" + (activeStep === index ? " is-active" : "")}
              onClick={() => setActiveStep(index)}
            >
              <span className="dt-how-step-number">{item.number}</span>
              <span className="dt-how-step-label">{item.title}</span>
              <span className="dt-how-step-indicator">{activeStep === index ? <Check size={15}/> : <ArrowUpRight size={14}/>}</span>
            </button>
          ))}
        </div>

        <div className="dt-how-panel" id="dt-how-panel" role="tabpanel" aria-labelledby={"dt-how-tab-" + activeStep}>
          <div className="dt-how-copy" key={step.number}>
            <span className="dt-how-eyebrow">{step.eyebrow}</span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
            <div className="dt-how-note"><span><i/>{step.note}</span><span>STEP {step.number} / 03</span></div>
          </div>

          <div className={"dt-how-visual dt-how-visual-" + step.visual} aria-label={step.visualTitle}>
            <div className="dt-how-visual-grid"/>
            <div className="dt-how-visual-orbit"/>
            <div className="dt-how-visual-core">
              {activeStep === 0 ? (
                <>
                  <div className="dt-how-mini-card"><span>DITAPAJA®</span><b>YOUR<br/><em>review</em><br/>STARTS HERE.</b><small>NFC · QR</small></div>
                  <div className="dt-how-mini-phone"><span/><Smartphone size={31}/><i/></div>
                  <div className="dt-how-signal"><i/><i/><i/></div>
                </>
              ) : activeStep === 1 ? (
                <>
                  <div className="dt-how-browser"><div className="dt-how-browser-bar"><i/><i/><i/><span>YOUR DESTINATION</span></div><div className="dt-how-browser-content"><span className="dt-how-browser-mark">D.</span><b>Business<br/><em>destination.</em></b><small>OPENED IN YOUR BROWSER</small><div className="dt-how-browser-line"/></div></div>
                  <div className="dt-how-link-orbit"><Link2 size={22}/></div>
                </>
              ) : (
                <>
                  <div className="dt-how-review-card"><span>YOUR EXPERIENCE</span><b>How was<br/>your visit?</b><div className="dt-how-stars">★★★★★</div><small>SHARE YOUR FEEDBACK</small><div className="dt-how-review-line"/></div>
                  <div className="dt-how-review-spark">✳</div>
                </>
              )}
            </div>
            <div className="dt-how-visual-caption"><span><i/> {step.visualTitle}</span><small>{step.visualCopy}</small></div>
            <span className="dt-how-visual-index">DTA / {step.number}</span>
          </div>
        </div>
        <div className="dt-how-progress" aria-hidden="true"><span style={{width: ((activeStep + 1) / 3 * 100) + "%"}}/></div>
      </div>
      <div className="dt-how-footer"><span>DESIGNED TO FEEL EFFORTLESS.</span><span>NFC FIRST. QR ALWAYS READY.</span></div>
    </section>
  );
}

export default function Home() {
  return <main className="dt-next-home dt-editorial-home dt-home-rebuild" id="top">
    <SiteHeader/>

    <section className="ed-hero">
      <div className="ed-hero-grid">
        <div className="ed-hero-copy">
          <span className="home-kicker"><i/> NFC REVIEW CARD · DASHBOARD GRATIS</span>
          <h1>Good reviews.<br/><em>Made easier.</em></h1>
          <p className="ed-hero-lead">Bantu pelanggan menemukan halaman review bisnismu tanpa langkah yang berbelit. Satu tap atau scan, lalu mereka bisa langsung memberi ulasan.</p>
          <div className="ed-hero-actions">
            <a href="#koleksi" className="ed-button">Pilih kartu <ArrowUpRight size={17}/></a>
            <a href="#cara-kerja" className="ed-text-link">Lihat cara kerja <ArrowDownRight size={16}/></a>
          </div>
          <div className="home-hero-proof">
            <span><Nfc size={15}/> NFC + QR Code</span>
            <span><Check size={15}/> Tanpa aplikasi</span>
            <span><Check size={15}/> Tanpa biaya bulanan</span>
          </div>
        </div>

        <HeroTapDemo/>
      </div>
      <div className="home-hero-marquee"><span>MAKE IT SIMPLE</span><i/> <span>MAKE IT COUNT</span><i/> <span>MAKE IT DITAPAJA</span><i/> <span>MAKE IT SIMPLE</span></div>
    </section>

    <section className="ed-intro-band home-intro">
      <span className="home-section-index">01 / THE IDEA</span>
      <h2>Turn every visit<br/>into a chance to <em>connect.</em></h2>
      <p>Pengalaman memberi ulasan seharusnya sesederhana pengalaman menikmati bisnismu.</p>
    </section>

    <section className="nx-collection ed-collection" id="koleksi">
      <div className="ed-section-heading">
        <div><span className="home-section-index">02 / THE COLLECTION</span><h2>Find your<br/>business <em>style.</em></h2></div>
        <p>Pilih tampilan yang paling cocok untuk bisnismu. Setiap kartu sudah dilengkapi NFC, QR Code, dan dashboard gratis.</p>
      </div>
      <ProductCarousel products={products}/>
    </section>

    <HowItWorks/>\n\n    <section className="home-dashboard-story dt-behind" id="behind-the-card">
      <div className="dt-behind-copy">
        <span className="home-section-index">04 / BEHIND THE CARD</span>
        <p className="dt-behind-kicker">THE CONTROL ROOM</p>
        <h2>Small card.<br/><em>Big picture.</em></h2>
        <p className="dt-behind-intro">Di balik setiap tap, ada dashboard yang bikin semuanya tetap teratur. Kelola kartu, tentukan tujuan, dan pahami interaksi pelanggan dari satu tempat.</p>
        <a className="ed-button" href="/login">Explore dashboard <ArrowUpRight size={17}/></a>
        <div className="dt-behind-capabilities">
          <div><span>01</span><b>Manage your cards</b><small>Aktifkan, arsipkan, dan atur kartu.</small></div>
          <div><span>02</span><b>Control every destination</b><small>Ubah tautan tujuan kapan saja.</small></div>
          <div><span>03</span><b>Understand engagement</b><small>Lihat aktivitas tap dan klik review.</small></div>
        </div>
      </div>
      <div className="dt-behind-visual">
        <div className="dt-behind-orbit dt-behind-orbit-one"/>
        <div className="dt-behind-orbit dt-behind-orbit-two"/>
        <div className="dt-behind-panel">
          <div className="dt-behind-panel-top">
            <div className="dt-behind-brand"><BrandMark/><span>DITAPAJA <i>STUDIO</i></span></div>
            <span className="dt-behind-preview-tag">DASHBOARD PREVIEW</span>
          </div>
          <div className="dt-behind-panel-heading"><div><small>YOUR WORKSPACE</small><b>Overview<span>.</span></b></div><span className="dt-behind-period">LAST 30 DAYS⌄</span></div>
          <div className="dt-behind-metrics">
            <div><span>TOTAL TAPS</span><b>1,284</b><small>Card interactions</small><i className="dt-behind-metric-mark">↗</i></div>
            <div><span>REVIEW CLICKS</span><b>864</b><small>Outbound visits</small><i className="dt-behind-metric-mark">↗</i></div>
          </div>
          <div className="dt-behind-activity">
            <div className="dt-behind-activity-head"><div><small>ACTIVITY</small><b>Engagement overview</b></div><span>ILLUSTRATIVE DATA</span></div>
            <div className="dt-behind-chart">{[27,42,35,58,47,72,54,82,63,91,70,78,58,96,73,86,62,80].map((height,i)=><i key={i} style={{height:height+"%"}}/>)}</div>
            <div className="dt-behind-chart-labels"><span>01 NOV</span><span>08 NOV</span><span>15 NOV</span><span>24 NOV</span></div>
          </div>
          <div className="dt-behind-card-line"><div className="dt-behind-card-icon"><Nfc size={17}/></div><div><b>Noir — Main counter</b><small>Last interaction · just now</small></div><span>ACTIVE</span></div>
        </div>
        <div className="dt-behind-float-note"><span><i/> SYSTEM STATUS</span><b>Everything in one place.</b></div>
        <p className="dt-behind-caption">THE INTELLIGENCE BEHIND EVERY TAP.</p>
      </div>
    </section>

    <section className="home-closing">
      <div className="home-closing-top"><span>05 / START SOMETHING SIMPLE</span><BrandMark/></div>
      <div className="home-closing-main"><h2>Make every<br/><em>tap count.</em></h2><div><p>Mulai dari satu kartu. Berikan pelanggan cara yang lebih praktis untuk terhubung dengan bisnismu.</p><a className="ed-button" href="/koleksi">Jelajahi koleksi <ArrowUpRight size={17}/></a></div></div>
      <div className="home-closing-bottom"><span>DITAPAJA®</span><span>GOOD REVIEWS, MADE EASIER.</span><span>EST. 2026</span></div>
    </section>

    <footer className="nx-footer ed-footer"><div className="nx-footer-top"><div><a href="/" className="nx-footer-brand"><BrandMark/> DiTap<span>Aja.</span></a><p>NFC review card untuk koneksi yang lebih mudah antara bisnis dan pelanggan.</p></div><div><a href="/koleksi">Koleksi kartu</a><a href="/cara-kerja">Cara kerja</a><a href="/faq">FAQ</a></div><div><a href="/login">Dashboard</a><a href="/activate">Aktivasi kartu</a><a href="/kontak">Hubungi kami</a></div><div className="nx-footer-contact"><b>Punya pertanyaan?</b><a href="https://wa.me/6281321778081">Diskusikan dengan kami <ArrowUpRight size={15}/></a></div></div><div className="nx-footer-bottom"><span>© 2026 DiTapAja. All rights reserved.</span><span>NFC + QR CODE · DASHBOARD GRATIS</span><a href="#top">Back to top ↑</a></div></footer>
  </main>;
}
