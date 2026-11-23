"use client";

import { ArrowDown, ArrowRight, ArrowUpRight, BarChart3, Check, Layers3, Link2, Nfc, ShieldCheck, Smartphone, Sparkles, Zap } from "lucide-react";
import SiteHeader from "./components/site-header";
import ProductCarousel from "./components/product-carousel";
import ScrollMotion from "./components/scroll-motion";

const products = [
  { name: "Noir", label: "Noir", description: "Karakter tegas untuk bisnis yang ingin tampil standout.", tone: "noir", price: "Rp50.000", order: "READY TO ORDER", action: "Beli Noir", mode: "buy" },
  { name: "Blanc", label: "Blanc", description: "Minimal, bersih, dan mudah menyatu dengan identitas brand.", tone: "blanc", price: "Rp50.000", order: "READY TO ORDER", action: "Beli Blanc", mode: "buy" },
  { name: "Signature", label: "Signature", description: "Kartu dengan identitas visual bisnismu sendiri.", tone: "signature", price: "Rp60.000", order: "PRE-ORDER · MIN. 10 KARTU", action: "Pre-order", mode: "preorder" }
];

function BrandMark() {
  return <span className="dt-v2-brand-mark" aria-hidden="true"><i /><i /><i /></span>;
}

export default function Home() {
  return (
    <main className="dt-next-home" id="top">
      <ScrollMotion />
      <SiteHeader />

      <section className="nx-hero nx-hero-v2 nx-hero-simple">
        <div className="nx-hero-simple-copy">
          <span className="nx-hero-simple-kicker"><i/> NFC REVIEW CARD FOR BUSINESS</span>
          <h1>Good reviews<br/>start with a <em>tap.</em></h1>
          <p className="nx-lead">Bikin pelanggan lebih mudah terhubung dengan bisnismu. Satu kartu untuk NFC, QR Code, dan dashboard review gratis.</p>
          <div className="nx-hero-actions">
            <a href="#koleksi" className="nx-button-primary">Pilih kartu <ArrowUpRight size={18}/></a>
            <a href="#cara-kerja" className="nx-button-quiet">Cara kerja <ArrowDown size={16}/></a>
          </div>
          <div className="nx-hero-simple-note"><span>01</span> Tap atau scan. Tanpa aplikasi. <i/> <span>02</span> Dashboard gratis. Tanpa biaya bulanan.</div>
        </div>
        <div className="nx-hero-simple-visual" aria-label="Kartu NFC DiTapAja">
          <div className="nx-hero-simple-glow"/>
          <div className="nx-hero-card nx-hero-card-v2 nx-hero-card-simple">
            <div className="nx-card-head"><BrandMark/><span>CONTACTLESS REVIEW</span></div>
            <div className="nx-card-title">DiTapAja<span>.</span></div>
            <div className="nx-card-wave"><i/><i/><i/><i/><i/><i/><i/></div>
            <div className="nx-card-bottom"><span>ONE TAP. MORE CONNECTIONS.</span><Nfc size={22}/></div>
          </div>
          <span className="nx-hero-simple-caption">ONE CARD. MORE CONNECTIONS.</span>
        </div>
      </section>

      <section className="nx-proof-strip" aria-label="Keunggulan DiTapAja">
        <span>BUILT FOR REAL-WORLD BUSINESS</span><b>NFC <i>×</i> QR CODE</b><b>FREE DASHBOARD</b><b>NO MONTHLY FEE</b><span className="nx-proof-spark">✳</span>
      </section>

      <section className="nx-collection" id="koleksi">
        <div className="nx-section-head">
          <div><div className="nx-eyebrow nx-eyebrow-muted">02 / THE COLLECTION</div><h2>Choose your<br/><em>signature.</em></h2></div>
          <div className="nx-section-aside"><p>Desain yang punya karakter. Teknologi yang bekerja sederhana. Pilih kartu yang paling cocok dengan bisnismu.</p><a href="/koleksi">Lihat semua koleksi <ArrowUpRight size={16}/></a></div>
        </div>
        <ProductCarousel products={products}/>
        <div className="nx-collection-note"><Sparkles size={17}/><span>Setiap pembelian sudah termasuk akses dashboard. <b>Tidak ada biaya langganan.</b></span></div>
      </section>

      <section className="nx-system" id="dashboard">
        <div className="nx-system-copy">
          <div className="nx-eyebrow">03 / THE CONTROL CENTER</div>
          <h2>Not just a card.<br/><em>Your business,</em><br/>in control.</h2>
          <p>Kelola seluruh kartu dari satu workspace. Pantau interaksi, ubah link tujuan, dan pahami bagaimana pelanggan terhubung dengan bisnismu.</p>
          <div className="nx-feature-list">
            <div><span><BarChart3 size={17}/></span><p><b>Activity overview</b><small>Pantau tap dan klik review</small></p><Check size={15}/></div>
            <div><span><Layers3 size={17}/></span><p><b>Card management</b><small>Kelola status dan link tujuan</small></p><Check size={15}/></div>
            <div><span><ShieldCheck size={17}/></span><p><b>One free workspace</b><small>Dashboard tanpa biaya bulanan</small></p><Check size={15}/></div>
          </div>
          <a className="nx-text-link" href="/login">Masuk ke dashboard <ArrowUpRight size={17}/></a>
        </div>
        <div className="nx-dashboard-art">
          <div className="nx-dash-orbit"/>
          <div className="nx-dash-window">
            <div className="nx-dash-top"><span className="nx-dash-logo"><BrandMark/> DiTapAja</span><span className="nx-dash-live"><i/> WORKSPACE PREVIEW</span></div>
            <div className="nx-dash-greeting"><small>MONDAY / YOUR BUSINESS</small><b>Good morning<span>.</span></b><p>Here&apos;s what&apos;s happening with your cards.</p></div>
            <div className="nx-dash-stats"><div><small>TOTAL TAPS</small><b>128</b><span>↗ 12.8% this week</span></div><div><small>REVIEW CLICKS</small><b>84</b><span>↗ 8.4% this week</span></div></div>
            <div className="nx-dash-chart"><div><b>Engagement activity</b><small>Last 7 days</small></div><div className="nx-chart-bars">{[35,52,42,69,56,86,66,92,72,100,78,90].map((v,i)=><i key={i} style={{height:v+"%"}}/>)}</div><div className="nx-chart-days"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div></div>
          </div>
          <div className="nx-dash-float"><span><Zap size={17}/></span><div><b>Everything connected.</b><small>One simple workspace</small></div></div>
        </div>
      </section>

      <section className="nx-how" id="cara-kerja">
        <div className="nx-how-heading"><div className="nx-eyebrow nx-eyebrow-muted">04 / HOW IT WORKS</div><h2>Three steps.<br/><em>One better journey.</em></h2><p>Praktis untuk pelanggan. Mudah untuk bisnismu.</p></div>
        <div className="nx-how-grid">
          <article><span className="nx-step-index">01</span><div className="nx-step-icon"><Smartphone size={23}/></div><h3>Tap or scan</h3><p>Pelanggan menempelkan ponsel ke kartu atau memindai QR Code.</p><span className="nx-step-line"/></article>
          <article><span className="nx-step-index">02</span><div className="nx-step-icon"><Link2 size={23}/></div><h3>Page opens</h3><p>Link tujuan bisnismu terbuka langsung di browser, tanpa aplikasi.</p><span className="nx-step-line"/></article>
          <article><span className="nx-step-index">03</span><div className="nx-step-icon"><Check size={23}/></div><h3>Share your story</h3><p>Pelanggan diarahkan ke halaman Google Review untuk memberi ulasan.</p><span className="nx-step-line"/></article>
        </div>
      </section>

      <section className="nx-final-cta">
        <div className="nx-cta-glow"/>
        <div className="nx-eyebrow">READY WHEN YOU ARE</div>
        <h2>Make the next<br/><em>tap matter.</em></h2>
        <p>Mulai bangun pengalaman review yang lebih praktis untuk bisnismu.</p>
        <a href="/koleksi" className="nx-button-primary">Jelajahi koleksi <ArrowRight size={17}/></a>
        <span className="nx-cta-mark">DiTapAja<span>.</span></span>
      </section>

      <footer className="nx-footer">
        <div className="nx-footer-top"><div><a href="/" className="nx-footer-brand"><BrandMark/> DiTap<span>Aja.</span></a><p>NFC review card untuk koneksi yang lebih mudah antara bisnis dan pelanggan.</p></div><div><small>EXPLORE</small><a href="/koleksi">Koleksi kartu</a><a href="/cara-kerja">Cara kerja</a><a href="/faq">FAQ</a></div><div><small>WORKSPACE</small><a href="/login">Dashboard</a><a href="/activate">Aktivasi kartu</a><a href="/kontak">Hubungi kami</a></div><div className="nx-footer-contact"><small>LET&apos;S CONNECT</small><b>Punya pertanyaan?</b><a href="https://wa.me/6281321778081">Diskusikan dengan kami <ArrowUpRight size={15}/></a></div></div>
        <div className="nx-footer-bottom"><span>© 2026 DiTapAja. All rights reserved.</span><span>NFC + QR CODE · DASHBOARD GRATIS</span><a href="#top">Back to top ↑</a></div>
      </footer>
    </main>
  );
}
