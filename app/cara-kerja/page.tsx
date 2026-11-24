import type { Metadata } from "next";
import SiteHeader from "../components/site-header";
import { ArrowDown, ArrowUpRight, BarChart3, Check, ChevronRight, Link2, MousePointer2, Nfc, QrCode, Smartphone, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Cara Kerja DiTapAja",
  description: "Pelajari cara kerja kartu review NFC DiTapAja. Pelanggan cukup tap atau scan QR, lalu menuju halaman review bisnismu.",
};

const steps = [
  { number: "01", icon: Nfc, title: "Letakkan kartu", text: "Tempatkan kartu DiTapAja di meja kasir, dekat pintu keluar, atau area lain yang mudah dijangkau pelanggan.", note: "SETUP SEKALI" },
  { number: "02", icon: Smartphone, title: "Tap atau scan", text: "Pelanggan mendekatkan ponsel yang mendukung NFC, atau membuka kamera untuk memindai QR Code.", note: "TANPA APLIKASI" },
  { number: "03", icon: Link2, title: "Halaman terbuka", text: "Ponsel membuka link tujuan yang sudah kamu atur. Pelanggan bisa langsung melanjutkan ke halaman review.", note: "LANGSUNG TERHUBUNG" },
  { number: "04", icon: BarChart3, title: "Pantau aktivitas", text: "Masuk ke dashboard untuk melihat aktivitas kartu dan mengelola link tujuan kapan pun diperlukan.", note: "DARI DASHBOARD" },
];

export default function CaraKerjaPage() {
  return (
    <main className="ck-page">
      <SiteHeader />
      <section className="ck-hero">
        <div className="ck-hero-grid" aria-hidden="true" />
        <div className="ck-hero-copy">
          <div className="ck-eyebrow"><i /> HOW IT WORKS <span>DITAPAJA / 01—04</span></div>
          <h1>From a simple tap<br />to <em>real connection.</em></h1>
          <p>Pengalaman review yang lebih mudah tidak perlu proses yang rumit. Satu kartu menghubungkan pelanggan ke halaman digital bisnismu.</p>
          <a className="ck-hero-link" href="#ck-steps">Lihat cara kerjanya <ArrowDown size={15}/></a>
          <div className="ck-hero-foot"><span>NFC + QR CODE</span><span>NO APP REQUIRED</span><span>DASHBOARD INCLUDED</span></div>
        </div>
        <div className="ck-visual" aria-label="Ilustrasi kartu DiTapAja dan ponsel">
          <div className="ck-visual-orbit ck-orbit-one"/><div className="ck-visual-orbit ck-orbit-two"/>
          <div className="ck-floating-label ck-label-top"><span className="ck-live-dot"/> READY TO TAP</div>
          <div className="ck-card">
            <div className="ck-card-head"><b><i/> DITAPAJA<sup>®</sup></b><span>SMART REVIEW CARD</span></div>
            <div className="ck-card-main"><small>YOUR BUSINESS, ONE TAP AWAY</small><strong>Make it<br/><em>count.</em></strong></div>
            <div className="ck-card-foot"><span>NFC ENABLED</span><span>01 / 001</span></div>
          </div>
          <div className="ck-phone">
            <div className="ck-phone-speaker"/>
            <div className="ck-phone-screen"><div className="ck-phone-brand">DITAPAJA</div><div className="ck-phone-check"><Check size={19}/></div><b>Halaman<br/>terbuka.</b><span>Siap menuju review</span><div className="ck-phone-url">maps.google.com <ChevronRight size={11}/></div></div>
          </div>
          <div className="ck-floating-label ck-label-bottom"><QrCode size={14}/> NFC + QR IN ONE CARD</div>
        </div>
      </section>

      <section className="ck-proof-strip">
        <div><Nfc/><span><b>NFC</b><small>Tap cepat</small></span></div><div><QrCode/><span><b>QR Code</b><small>Alternatif scan</small></span></div><div><Zap/><span><b>Simple setup</b><small>Atur lewat dashboard</small></span></div>
      </section>

      <section className="ck-steps-section" id="ck-steps">
        <div className="ck-section-heading"><div><div className="ck-eyebrow ck-eyebrow-muted">THE FLOW / 4 STEPS</div><h2>Empat langkah.<br/><em>Sesederhana itu.</em></h2></div><p>Alur yang jelas untuk pelanggan, kontrol yang praktis untuk pemilik bisnis.</p></div>
        <div className="ck-steps">
          {steps.map(({number,icon:Icon,title,text,note},index)=><article className="ck-step" key={number}>
            <div className="ck-step-top"><span>{number}</span><Icon size={20}/></div>
            <div className="ck-step-icon"><Icon size={23}/></div>
            <h3>{title}</h3><p>{text}</p><small>{note}</small>
            {index!==steps.length-1&&<div className="ck-step-connector" aria-hidden="true"/>}
          </article>)}
        </div>
      </section>

      <section className="ck-dual">
        <div className="ck-dual-intro"><div className="ck-eyebrow ck-eyebrow-muted">MADE FOR BOTH SIDES</div><h2>Easy for them.<br/><em>Clear for you.</em></h2><p>DiTapAja menyederhanakan dua sisi pengalaman: pelanggan cukup membuka link, sementara pemilik bisnis tetap punya kendali.</p></div>
        <article><div className="ck-dual-icon"><MousePointer2 size={20}/></div><span>01 / CUSTOMER EXPERIENCE</span><h3>Untuk pelanggan</h3><p>Tidak perlu install aplikasi atau mencari akun bisnis secara manual. Cukup tap atau scan, lalu lanjutkan ke halaman tujuan.</p></article>
        <article><div className="ck-dual-icon"><BarChart3 size={20}/></div><span>02 / BUSINESS CONTROL</span><h3>Untuk pemilik bisnis</h3><p>Atur link tujuan, kelola kartu, dan pantau aktivitas dari dashboard. Tidak perlu mengganti kartu ketika link tujuan berubah.</p></article>
      </section>

      <section className="ck-compat">
        <div><div className="ck-eyebrow ck-eyebrow-muted">GOOD TO KNOW</div><h2>Satu kartu.<br/><em>Dua opsi akses.</em></h2></div>
        <div className="ck-compat-options"><article><Nfc/><div><b>NFC</b><p>Gunakan ponsel yang mendukung NFC dan pastikan fitur NFC aktif.</p></div></article><article><QrCode/><div><b>QR Code</b><p>Jika NFC tidak tersedia, pelanggan tetap bisa scan QR dengan kamera ponsel.</p></div></article></div>
      </section>

      <section className="ck-close"><div><span className="ck-eyebrow">READY TO MAKE IT EASIER?</span><h2>One tap can<br/><em>change the flow.</em></h2></div><div><p>Pilih kartu yang sesuai dengan bisnismu dan mulai permudah pengalaman review pelanggan.</p><a href="/koleksi">Lihat koleksi kartu <ArrowUpRight size={16}/></a></div></section>
      <footer className="ck-footer"><a href="/" className="ck-footer-brand">DiTap<span>Aja.</span></a><span>© 2026 DiTapAja</span><div><a href="/faq">FAQ</a><a href="/kontak">Kontak</a><a href="/kebijakan-privasi">Privasi</a></div></footer>
    </main>
  );
}
