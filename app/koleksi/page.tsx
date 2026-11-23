import type { Metadata } from "next";
import { ArrowDown, ArrowUpRight, Check, Nfc, QrCode, BarChart3, ShieldCheck } from "lucide-react";
import SiteHeader from "../components/site-header";
import ProductCarousel from "../components/product-carousel";

export const metadata: Metadata = {
  title: "Koleksi Kartu NFC DiTapAja",
  description: "Pilih kartu NFC + QR DiTapAja untuk bisnis. Dashboard termasuk tanpa biaya bulanan.",
};

const products = [
  { name: "DiTapAja Noir", label: "Noir", description: "Karakter tegas untuk bisnis yang ingin tampil standout.", tone: "noir", price: "Rp50.000", order: "READY TO ORDER", action: "Beli Noir", mode: "buy" },
  { name: "DiTapAja Blanc", label: "Blanc", description: "Minimal, bersih, dan mudah menyatu dengan identitas brand.", tone: "blanc", price: "Rp50.000", order: "READY TO ORDER", action: "Beli Blanc", mode: "buy" },
  { name: "DiTapAja Signature", label: "Signature", description: "Kartu dengan identitas visual bisnismu sendiri.", tone: "signature", price: "Rp60.000", order: "PRE-ORDER · MIN. 10 KARTU", action: "Pre-order", mode: "preorder" },
];

export default function KoleksiPage() {
  return <main className="nx-catalog-page">
    <SiteHeader />
    <section className="nx-catalog-hero">
      <div className="nx-catalog-hero-grid"/>
      <div className="nx-catalog-hero-copy">
        <div className="nx-eyebrow"><span className="nx-pulse"/> EXPLORE THE COLLECTION <span>DITAPAJA / 02</span></div>
        <h1>Find your<br/><em>everyday icon.</em></h1>
        <p>Temukan desain yang paling cocok dengan karakter bisnismu. Satu kartu untuk menghubungkan pelanggan ke pengalaman review yang lebih praktis.</p>
        <a href="#catalog-products" className="nx-button-primary">Pilih desain <ArrowDown size={16}/></a>
      </div>
      <div className="nx-catalog-orbit" aria-hidden="true"><div className="nx-catalog-orbit-ring"/><div className="nx-catalog-orbit-card"><span>DITAPAJA / NFC</span><b>Make it<br/>count<span>.</span></b><small>ONE TAP. MORE CONNECTIONS.</small></div><div className="nx-catalog-orbit-tag"><Nfc size={17}/> NFC + QR</div></div>
    </section>
    <section className="nx-catalog-perks">
      <div><span><Nfc size={19}/></span><p><b>Tap or scan</b><small>NFC dan QR dalam satu kartu</small></p></div>
      <div><span><BarChart3 size={19}/></span><p><b>Free dashboard</b><small>Pantau aktivitas kartu kapan saja</small></p></div>
      <div><span><ShieldCheck size={19}/></span><p><b>No monthly fee</b><small>Satu kali pembelian, tanpa langganan</small></p></div>
    </section>
    <section className="nx-catalog-products" id="catalog-products">
      <div className="nx-section-head"><div><div className="nx-eyebrow nx-eyebrow-muted">01 / PICK YOUR STYLE</div><h2>Designed to<br/><em>be remembered.</em></h2></div><div className="nx-section-aside"><p>Setiap edisi dirancang dengan karakter yang berbeda. Pilih satu yang paling mewakili bisnismu.</p></div></div>
      <ProductCarousel products={products}/>
      <div className="nx-catalog-note"><QrCode size={18}/><p><b>Everything you need, included.</b><span>Semua kartu dilengkapi NFC, QR Code, dan akses dashboard gratis. Noir dan Blanc dapat dipesan mulai satu kartu. Signature tersedia pre-order minimum 10 kartu.</span></p></div>
    </section>
    <footer className="nx-footer"><div className="nx-footer-top"><div><a href="/" className="nx-footer-brand"><span className="dt-v2-brand-mark"><i/><i/><i/></span> DiTap<span>Aja.</span></a><p>NFC review card untuk koneksi yang lebih mudah antara bisnis dan pelanggan.</p></div><div><small>EXPLORE</small><a href="/">Beranda</a><a href="/cara-kerja">Cara kerja</a><a href="/faq">FAQ</a></div><div><small>WORKSPACE</small><a href="/login">Dashboard</a><a href="/activate">Aktivasi kartu</a><a href="/kontak">Hubungi kami</a></div><div className="nx-footer-contact"><small>LET&apos;S CONNECT</small><b>Punya pertanyaan?</b><a href="https://wa.me/6281321778081">Diskusikan dengan kami <ArrowUpRight size={15}/></a></div></div><div className="nx-footer-bottom"><span>© 2026 DiTapAja. All rights reserved.</span><span>NFC + QR CODE · DASHBOARD GRATIS</span><a href="#">Back to top ↑</a></div></footer>
  </main>;
}
