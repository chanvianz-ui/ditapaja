"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, BarChart3, Check, Link2, Nfc, QrCode, Smartphone, Star, RotateCcw, Wifi } from "lucide-react";
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
  return <div className={`home-hero-visual home-tap-demo ${tapped ? "is-tapped" : ""}`} aria-label="Demo interaktif pelanggan tap kartu NFC dan membuka halaman Google Review">
    <div className="home-demo-heading"><div><span className="home-section-index">LIVE PRODUCT DEMO</span><b>One tap. Straight to reviews.</b></div><span className="home-demo-live"><i/> INTERACTIVE</span></div>
    <div className="home-demo-stage">
      <div className="home-demo-card-wrap"><span className="home-demo-step">01 / TAP CARD</span>
        <button type="button" className="home-demo-card" onClick={() => setTapped(true)} aria-label="Simulasikan pelanggan mengetuk kartu NFC">
          <div className="home-demo-card-top"><BrandMark/><span>DITAPAJA®</span><Nfc size={22}/></div>
          <div className="home-demo-card-title">YOUR<br/><em>review</em><br/>STARTS HERE.</div>
          <div className="home-demo-card-bottom"><span>ONE TAP TO REVIEW</span><span>NFC · QR</span></div>
        </button>
        <div className="home-demo-tap-hint"><Wifi size={15}/>{tapped ? "CARD DETECTED" : "TAP TO TRY THE DEMO"}</div>
      </div>
      <div className="home-demo-transfer"><span/><ArrowUpRight size={17}/><small>NFC</small></div>
      <div className="home-demo-phone-wrap"><span className="home-demo-step">02 / PHONE SCREEN</span>
        <div className="home-demo-phone"><div className="home-phone-island"/><div className="home-phone-status"><span>9:41</span><span>●●● ▰</span></div>
          {tapped ? <div className="home-google-screen">
            <div className="home-google-top"><span className="home-google-g">Google</span><span>⋮</span></div>
            <div className="home-google-business"><div className="home-google-avatar">B</div><div><b>Your Business</b><small>Business profile</small></div></div>
            <div className="home-google-rating"><b>4.8</b><span>★★★★★</span><small>Customer reviews</small></div>
            <div className="home-google-divider"/>
            <strong>Share your experience</strong><p>Your review helps others discover this place.</p>
            <div className="home-google-stars">☆　☆　☆　☆　☆</div>
            <div className="home-google-write">Write a review <ArrowUpRight size={12}/></div>
            <small className="home-google-note">Google review destination</small>
          </div> : <div className="home-phone-idle">
            <div className="home-phone-nfc"><Nfc size={27}/></div><b>Ready when<br/>you are.</b>
            <p>Bring your phone close to the DiTapAja card to open the review page.</p><span><i/> WAITING FOR NFC</span>
          </div>}
          <div className="home-phone-homebar"/>
        </div>
      </div>
    </div>
    <div className="home-demo-footer"><div><span className={tapped ? "done" : ""}>01</span> Tap NFC card <i/> <span className={tapped ? "done" : ""}>02</span> Google Review opens</div>
      <button type="button" onClick={() => setTapped(!tapped)}>{tapped ? <><RotateCcw size={13}/> Replay demo</> : <><Nfc size={14}/> Simulasikan tap</>}</button>
    </div>
  </div>;
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
      <div className="ed-collection-note"><span>EVERYTHING INCLUDED</span><p><Nfc size={17}/> NFC <i>+</i> <QrCode size={17}/> QR Code <i>+</i> Dashboard gratis. Tanpa biaya bulanan.</p></div>
    </section>

    <section className="ed-flow home-flow" id="cara-kerja">
      <div className="ed-flow-head"><span className="home-section-index">03 / HOW IT WORKS</span><h2>Three steps.<br/><em>That’s all.</em></h2><p>Alur yang ringkas, supaya pelanggan bisa fokus pada hal yang paling penting: berbagi pengalaman mereka.</p></div>
      <div className="ed-flow-list">
        <article><span className="ed-flow-number">01</span><div className="ed-flow-icon"><Smartphone size={21}/></div><div><h3>Tap or scan.</h3><p>Pelanggan mendekatkan ponsel ke kartu NFC atau memindai QR Code.</p></div><ArrowUpRight className="home-flow-arrow"/></article>
        <article><span className="ed-flow-number">02</span><div className="ed-flow-icon"><Link2 size={21}/></div><div><h3>Your page opens.</h3><p>Halaman tujuan terbuka langsung di browser. Tidak perlu mengunduh aplikasi.</p></div><ArrowUpRight className="home-flow-arrow"/></article>
        <article><span className="ed-flow-number">03</span><div className="ed-flow-icon"><Star size={21}/></div><div><h3>Leave a review.</h3><p>Pelanggan diarahkan ke halaman review yang sudah kamu tentukan.</p></div><ArrowUpRight className="home-flow-arrow"/></article>
      </div>
    </section>

    <section className="home-dashboard-story">
      <div className="home-dashboard-copy">
        <span className="home-section-index">04 / BEHIND THE CARD</span>
        <h2>One card.<br/><em>More control.</em></h2>
        <p>Kartu hanyalah awal. Atur link tujuan, kelola kartu, dan pantau aktivitas dari satu dashboard yang bisa kamu akses kapan saja.</p>
        <a className="ed-button" href="/login">Masuk ke dashboard <ArrowUpRight size={17}/></a>
        <div className="home-dashboard-points"><span><Check size={15}/> Kelola kartu</span><span><Check size={15}/> Atur tujuan review</span><span><Check size={15}/> Pantau aktivitas</span></div>
      </div>
      <div className="home-dashboard-visual">
        <div className="home-dash-window">
          <div className="home-dash-bar"><div><i/><i/><i/></div><span>DITAPAJA / OVERVIEW</span><span>•••</span></div>
          <div className="home-dash-body">
            <aside className="home-dash-sidebar"><BrandMark/><span className="active"/><span/><span/><span/><span/></aside>
            <div className="home-dash-content">
              <div className="home-dash-heading"><div><small>YOUR WORKSPACE</small><b>Overview</b></div><span>THIS MONTH⌄</span></div>
              <div className="home-dash-stats"><div><small>TOTAL TAPS</small><b>1,284</b><i>↗ Activity</i></div><div><small>REVIEW CLICKS</small><b>864</b><i>↗ Engagement</i></div></div>
              <div className="home-dash-chart"><div><small>ACTIVITY OVERVIEW</small><span>LAST 7 DAYS</span></div><div className="home-chart-bars">{[34,54,43,76,59,88,68,96,72,84,57,78,48,91].map((height,i)=><i key={i} style={{height:height+"%"}}/>)}</div><div className="home-chart-labels"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div></div>
              <div className="home-dash-card-row"><span><Nfc size={14}/> Noir — Main counter</span><b>ACTIVE</b></div>
            </div>
          </div>
        </div>
        <div className="home-dash-caption"><BarChart3 size={16}/> YOUR BUSINESS, AT A GLANCE.</div>
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
