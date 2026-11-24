"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Check, Link2, Nfc, QrCode, ShieldCheck, Smartphone } from "lucide-react";
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

export default function Home() {
  return <main className="dt-next-home dt-editorial-home" id="top">
    <SiteHeader/>
    <section className="ed-hero">
      
      <div className="ed-hero-grid">
        <div className="ed-hero-copy">
          
          <h1>Make it easy<br/>to <em>be heard.</em></h1>
          <p className="ed-hero-lead">Bantu pelanggan meninggalkan ulasan tanpa langkah yang berbelit. Cukup satu tap atau scan, lalu mereka sampai ke halaman bisnismu.</p>
          <div className="ed-hero-actions"><a href="#koleksi" className="ed-button">Temukan kartu <ArrowUpRight size={17}/></a><a href="#cara-kerja" className="ed-text-link">Lihat cara kerja <ArrowDownRight size={16}/></a></div>
          
        </div>
        <div className="ed-hero-art" aria-label="Ilustrasi kartu NFC DiTapAja">
          <div className="ed-art-halo"/>
          <div className="ed-card-object"><div className="ed-card-top"><BrandMark/></div><div className="ed-card-word">Make<br/>it <i>count.</i></div><div className="ed-card-bottom"><span>DITAPAJA</span><span>01 / 03</span></div></div>
          
        </div>
      </div>
      
    </section>

    <section className="ed-intro-band">
      <h2>Less friction between<br/><em>you and your customers.</em></h2>
      <span>Teknologi yang bekerja di belakang layar. Pengalaman yang terasa sederhana di depan.</span>
    </section>

    <section className="nx-collection ed-collection" id="koleksi">
      <div className="ed-section-heading"><div><h2>Choose the one<br/>that feels <em>right.</em></h2></div></div>
      <ProductCarousel products={products}/>
      <div className="ed-collection-note"><span>INCLUDED WITH EVERY CARD</span><p><Nfc size={17}/> NFC <i>+</i> <QrCode size={17}/> QR Code <i>+</i> Dashboard gratis. Tanpa biaya bulanan.</p></div>
    </section>

    <section className="ed-flow" id="cara-kerja">
      <div className="ed-flow-head"><h2>Three steps.<br/><em>No extra steps.</em></h2></div>
      <div className="ed-flow-list">
        <article><span className="ed-flow-number">01</span><div className="ed-flow-icon"><Smartphone size={21}/></div><div><h3>They tap or scan.</h3><p>Pelanggan mendekatkan ponsel ke kartu NFC atau memindai QR Code.</p></div></article>
        <article><span className="ed-flow-number">02</span><div className="ed-flow-icon"><Link2 size={21}/></div><div><h3>Your page opens.</h3><p>Halaman tujuan terbuka langsung di browser. Tidak perlu mengunduh aplikasi.</p></div></article>
        <article><span className="ed-flow-number">03</span><div className="ed-flow-icon"><Check size={21}/></div><div><h3>They leave a review.</h3><p>Pelanggan diarahkan ke halaman review yang sudah kamu tentukan.</p></div></article>
      </div>
    </section>

    <section className="ed-workspace">
      <div className="ed-workspace-copy"><h2>A card is just<br/>the <em>beginning.</em></h2><p>Setelah kartu aktif, kamu bisa mengatur link tujuan, mengelola beberapa kartu, dan melihat aktivitas yang tercatat dari satu dashboard.</p><a className="ed-text-link" href="/login">Masuk ke dashboard <ArrowUpRight size={17}/></a></div>
      <div className="ed-workspace-panel"><div className="ed-panel-title">Everything<br/>in its <em>place.</em></div><div className="ed-panel-items"><div><BarChart3/><span><b>Activity</b><small>Tap & review clicks</small></span><ArrowRight/></div><div><Nfc/><span><b>Your cards</b><small>Status & destination links</small></span><ArrowRight/></div><div><ShieldCheck/><span><b>Your access</b><small>No monthly subscription</small></span><ArrowRight/></div></div></div>
    </section>

    <section className="ed-last-call"><div><h2>Make the next<br/><em>tap matter.</em></h2></div><div><p>Mulai dari satu kartu. Kembangkan pengalaman review bisnismu dengan cara yang lebih praktis.</p><a className="ed-button" href="/koleksi">Lihat koleksi <ArrowUpRight size={17}/></a></div><span className="ed-last-mark">D.</span></section>

    <footer className="nx-footer ed-footer"><div className="nx-footer-top"><div><a href="/" className="nx-footer-brand"><BrandMark/> DiTap<span>Aja.</span></a><p>NFC review card untuk koneksi yang lebih mudah antara bisnis dan pelanggan.</p></div><div><a href="/koleksi">Koleksi kartu</a><a href="/cara-kerja">Cara kerja</a><a href="/faq">FAQ</a></div><div><a href="/login">Dashboard</a><a href="/activate">Aktivasi kartu</a><a href="/kontak">Hubungi kami</a></div><div className="nx-footer-contact"><b>Punya pertanyaan?</b><a href="https://wa.me/6281321778081">Diskusikan dengan kami <ArrowUpRight size={15}/></a></div></div><div className="nx-footer-bottom"><span>© 2026 DiTapAja. All rights reserved.</span><span>NFC + QR CODE · DASHBOARD GRATIS</span><a href="#top">Back to top ↑</a></div></footer>
  </main>;
}
