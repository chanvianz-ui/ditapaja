import type { Metadata } from "next";
import { ArrowDown, ArrowUpRight, Nfc, BarChart3, ShieldCheck } from "lucide-react";
import SiteHeader from "../components/site-header";
import ProductCarousel from "../components/product-carousel";
import { PRODUCT_LIST } from "../lib/product-catalog";

export const metadata: Metadata = {
  title: "Koleksi Kartu NFC DiTapAja",
  description: "Pilih kartu NFC + QR DiTapAja untuk bisnismu. Termasuk dashboard monitoring tanpa biaya bulanan.",
};

const products = PRODUCT_LIST;

export default function KoleksiPage() {
  return <main className="nx-catalog-page">
    <SiteHeader />
    <section className="nx-catalog-hero nx-catalog-hero-v2">
      <div className="nx-catalog-hero-grid"/>
      <div className="nx-catalog-hero-copy">
        <div className="nx-eyebrow"><span className="nx-pulse"/> KOLEKSI KARTU NFC <span>DITAPAJA / 02</span></div>
        <h1>Temukan<br/><em>gaya bisnismu.</em></h1>
        <p>Temukan desain yang paling cocok dengan karakter bisnismu. Satu kartu untuk menghubungkan pelanggan ke pengalaman review yang lebih praktis.</p>
        <a href="#catalog-products" className="nx-button-primary">Pilih desain <ArrowDown size={16}/></a>
      </div>
      <div className="nx-catalog-orbit nx-catalog-object" role="img" aria-label="Pratinjau desain kartu DiTapAja Noir"><div className="nx-catalog-orbit-ring"/><div className="nx-catalog-orbit-card"><span>DITAPAJA® <small>SMART REVIEW OBJECT</small></span><b>Make it<br/><em>count.</em></b><small>NFC + QR&nbsp;&nbsp; / &nbsp;&nbsp;NOIR 001</small></div><div className="nx-catalog-orbit-tag"><Nfc size={17}/> NFC + QR</div><div className="nx-catalog-object-caption"><span>01 / NOIR</span><span>MATTE FINISH</span></div></div>
    </section>
    <section className="nx-catalog-perks">
      <div><span><Nfc size={19}/></span><p><b>Tap atau scan</b><small>NFC dan QR dalam satu kartu</small></p></div>
      <div><span><BarChart3 size={19}/></span><p><b>Dashboard gratis</b><small>Pantau aktivitas kartu kapan saja</small></p></div>
      <div><span><ShieldCheck size={19}/></span><p><b>Tanpa biaya bulanan</b><small>Satu kali pembelian, tanpa langganan</small></p></div>
    </section>
    <section className="nx-catalog-products" id="catalog-products">
      <div className="nx-section-head"><div><div className="nx-eyebrow nx-eyebrow-muted">01 / PILIH KARAKTER KARTU</div><h2>Tiga karakter.<br/><em>Satu tujuan.</em></h2></div><div className="nx-section-aside"><p>Pilih desain yang paling sesuai dengan identitas bisnismu. Pilih edisi untuk melihat spesifikasi, harga, dan cara pemesanan.</p></div></div>
      <div className="dt-home-rebuild nx-catalog-carousel-scope"><div className="ed-collection"><ProductCarousel products={products}/></div></div>
    </section>
    <footer className="nx-footer"><div className="nx-footer-top"><div><a href="/" className="nx-footer-brand"><span className="dt-v2-brand-mark"><i/><i/><i/></span> DiTap<span>Aja.</span></a><p>NFC review card untuk koneksi yang lebih mudah antara bisnis dan pelanggan.</p></div><div><small>JELAJAHI</small><a href="/">Beranda</a><a href="/cara-kerja">Cara kerja</a><a href="/faq">FAQ</a></div><div><small>AKUN</small><a href="/login">Dashboard</a><a href="/activate">Aktivasi kartu</a><a href="/kontak">Hubungi kami</a></div><div className="nx-footer-contact"><small>LET&apos;S CONNECT</small><b>Punya pertanyaan?</b><a href="https://wa.me/6281321778081">Diskusikan dengan kami <ArrowUpRight size={15}/></a></div></div><div className="nx-footer-bottom"><span>© 2026 DiTapAja. Hak cipta dilindungi.</span><span>NFC + QR CODE · DASHBOARD GRATIS</span><a href="#">Back to top ↑</a></div></footer>
  </main>;
}
