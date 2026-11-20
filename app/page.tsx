"use client";

import { useState } from "react";
import { ArrowRight, ArrowUpRight, BarChart3, Check, ChevronDown, Link2, Nfc, QrCode, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import SiteHeader from "./components/site-header";
import ProductCarousel from "./components/product-carousel";
import ScrollMotion from "./components/scroll-motion";

const products = [
  { name: "Noir", label: "Noir", description: "Karakter tegas untuk bisnis yang ingin tampil standout.", tone: "noir", price: "Rp50.000", order: "READY TO ORDER", action: "Beli Noir", mode: "buy" },
  { name: "Blanc", label: "Blanc", description: "Minimal, bersih, dan mudah menyatu dengan identitas brand.", tone: "blanc", price: "Rp50.000", order: "READY TO ORDER", action: "Beli Blanc", mode: "buy" },
  { name: "Signature", label: "Signature", description: "Kartu dengan identitas visual bisnismu sendiri.", tone: "signature", price: "Rp60.000", order: "PRE-ORDER · MIN. 10 KARTU", action: "Pre-order", mode: "preorder" }
];

const questions = [
  ["Bagaimana cara kerja kartu DiTapAja?", "Pelanggan cukup menempelkan smartphone yang mendukung NFC ke kartu, atau memindai QR Code. Halaman Google Review bisnismu akan terbuka langsung di browser—tanpa aplikasi tambahan."],
  ["Apakah ada biaya bulanan untuk dashboard?", "Tidak ada biaya langganan. Dashboard sudah termasuk dalam pembelian kartu, sehingga kamu bisa memantau aktivitas tap dan klik menuju Google Review tanpa biaya bulanan."],
  ["Bagaimana cara memesan dan mengatur kartu?", "Pilih desain Noir, Blanc, atau Signature pada bagian koleksi lalu lakukan pemesanan. Setelah kartu diterima, atur link tujuan melalui dashboard dan kartu siap digunakan."]
];

function BrandMark() {
  return <span className="dt-v2-brand-mark" aria-hidden="true"><i /><i /><i /></span>;
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState<string | null>(questions[0][0]);

  return (
    <main className="concept-home dt-editorial-home dt-home-v2 dt-home-v4" id="top">
      <ScrollMotion />
      <SiteHeader />

      <section className="dt-v2-hero">
        <div className="dt-v2-hero-copy">
          <div className="dt-v2-kicker"><span /> NFC REVIEW CARD <i /> MADE FOR BETTER CONNECTIONS</div>
          <h1>Good reviews<br /><em>start with a tap.</em></h1>
          <p>Sederhanakan cara pelanggan menemukan halaman Google Review bisnismu. Satu kartu NFC + QR, lengkap dengan dashboard gratis.</p>
          <div className="dt-v2-actions">
            <a className="dt-v2-primary" href="#koleksi">Temukan kartu <ArrowUpRight size={17} /></a>
            <a className="dt-v2-secondary" href="#cara-kerja">Lihat cara kerja <ArrowRight size={15} /></a>
          </div>
          <div className="dt-v2-proof"><span><Check size={14} /> NFC + QR Code</span><span><Check size={14} /> Dashboard gratis</span><span><Check size={14} /> Tanpa biaya bulanan</span></div>
        </div>
        <div className="dt-v2-hero-art" aria-label="Ilustrasi NFC card dan dashboard DiTapAja">
          <div className="dt-v2-art-orbit dt-v2-orbit-one" />
          <div className="dt-v2-art-orbit dt-v2-orbit-two" />
          <div className="dt-v2-glass-note"><span className="dt-v2-live-dot" /><span><b>One simple tap</b><small>One easier review journey</small></span></div>
          <div className="dt-v2-phone">
            <div className="dt-v2-phone-top"><span>9:41</span><span>•••</span></div>
            <div className="dt-v2-google"><b>G</b> Google</div>
            <div className="dt-v2-avatar">B</div>
            <strong>Your business</strong>
            <small>We'd love to hear from you</small>
            <div className="dt-v2-stars">★★★★★</div>
            <div className="dt-v2-phone-rule" />
            <span className="dt-v2-phone-label">SHARE YOUR EXPERIENCE</span>
            <div className="dt-v2-review-button">Write a review <ArrowUpRight size={12} /></div>
          </div>
          <div className="dt-v2-floating-card">
            <div className="dt-v2-card-top"><BrandMark /><span>NFC / QR</span></div>
            <div className="dt-v2-card-word">DiTapAja<span>.</span></div>
            <div className="dt-v2-card-bottom"><span>CONTACTLESS REVIEW</span><Nfc size={21} /></div>
          </div>
          <div className="dt-v2-glass-stat"><span className="dt-v2-stat-icon"><BarChart3 size={17} /></span><span><small>YOUR DASHBOARD</small><b>Every tap, in view.</b></span><ArrowUpRight size={15} /></div>
        </div>
        <div className="dt-v2-hero-index"><span>DESIGNED FOR BETTER CONNECTIONS</span></div>
      </section>

      <section className="dt-v2-collection" id="koleksi">
        <div className="dt-v2-section-heading">
          <div><div className="dt-v2-kicker dt-v2-kicker-dark">THE COLLECTION <i /></div><h2>A card that fits<br />your <em>business.</em></h2></div>
          <p>Dirancang untuk pengalaman yang praktis, tampilan yang berkarakter, dan pengelolaan yang sederhana.</p>
        </div>
        <ProductCarousel products={products} />
        <div className="dt-v2-collection-foot"><span>INCLUDED WITH EVERY CARD</span><p>NFC, QR Code, dan akses dashboard gratis. Tidak ada biaya langganan bulanan.</p></div>
      </section>

      <section className="dt-v2-dashboard" id="dashboard">
        <div className="dt-v2-dashboard-copy">
          <div className="dt-v2-kicker dt-v2-kicker-dark">MORE THAN A CARD <i /></div>
          <h2>Simple outside.<br /><em>Insightful inside.</em></h2>
          <p>Semua aktivitas kartu bisa dipantau dari satu tempat. Tidak perlu aplikasi tambahan atau biaya dashboard bulanan.</p>
          <ul><li><Check size={15} /> Pantau jumlah tap kartu</li><li><Check size={15} /> Lihat estimasi pengunjung unik</li><li><Check size={15} /> Pantau klik menuju Google Review</li><li><Check size={15} /> Ubah tautan tujuan kapan saja</li></ul>
          <a href="/login" className="dt-v2-text-link">Masuk ke dashboard <ArrowUpRight size={16} /></a>
        </div>
        <div className="dt-v2-dashboard-stage">
          <div className="dt-v2-dashboard-glass">
            <div className="dt-v2-dash-head"><span className="dt-v2-dash-brand"><BrandMark /> DiTapAja</span><span className="dt-v2-dash-pill"><i /> LIVE PREVIEW</span></div>
            <div className="dt-v2-dash-intro"><small>OVERVIEW / YOUR BUSINESS</small><h3>Ringkasan aktivitas</h3><p>Semua interaksi kartu dalam satu tampilan.</p></div>
            <div className="dt-v2-metrics"><div><small>TOTAL TAP</small><b>— — —</b><span>Aktivitas kartu</span></div><div><small>REVIEW CLICKS</small><b>— — —</b><span>Menuju Google Review</span></div></div>
            <div className="dt-v2-chart"><div><b>Aktivitas kartu</b><small>Ilustrasi tampilan dashboard</small></div><div className="dt-v2-bars">{[28,42,34,58,48,72,54,84,66,94,73,88].map((height, i) => <i key={i} style={{ height: height + "%" }} />)}</div><div className="dt-v2-chart-labels"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div></div>
          </div>
          <div className="dt-v2-dashboard-stamp"><Sparkles size={16} /><span>Included with<br /><b>every card.</b></span></div>
        </div>
      </section>

      <section className="dt-v2-how" id="cara-kerja">
        <div className="dt-v2-how-heading"><div className="dt-v2-kicker dt-v2-kicker-dark">THREE SIMPLE STEPS <i /></div><h2>From tap<br />to <em>review.</em></h2><p>Semudah itu. Tanpa aplikasi tambahan.</p></div>
        <div className="dt-v2-steps">
          <article><span className="dt-v2-step-number">01</span><div className="dt-v2-step-icon"><Smartphone size={21} /></div><h3>Tap or scan</h3><p>Pelanggan mendekatkan ponsel ke kartu atau memindai QR Code.</p></article>
          <article><span className="dt-v2-step-number">02</span><div className="dt-v2-step-icon"><Link2 size={21} /></div><h3>Page opens</h3><p>Link tujuan bisnismu terbuka langsung di browser.</p></article>
          <article><span className="dt-v2-step-number">03</span><div className="dt-v2-step-icon"><Check size={21} /></div><h3>Share the experience</h3><p>Pelanggan diarahkan ke halaman Google Review untuk memberi ulasan.</p></article>
        </div>
        <div className="dt-v2-how-note"><ShieldCheck size={17} /> NFC yang kompatibel atau kamera untuk scan QR. Tidak perlu install aplikasi.</div>
      </section>

      <footer className="dt-v2-footer dt-v2-footer-expanded">
        <div className="dt-footer-main">
          <div className="dt-footer-about">
            <a href="#top" className="dt-v2-footer-brand"><BrandMark /> DiTapAja<span>.</span></a>
            <p>NFC review card untuk membantu bisnis membangun pengalaman pelanggan yang lebih praktis.</p>
            <a className="dt-footer-contact" href="https://wa.me/6281321778081">Ada yang ingin ditanyakan? <ArrowUpRight size={14}/></a>
          </div>
          <div className="dt-footer-column">
            <span className="dt-footer-label">JELAJAHI</span>
            <a href="#koleksi">Koleksi kartu</a>
            <a href="#dashboard">Dashboard</a>
            <a href="#cara-kerja">Cara kerja</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="dt-footer-column">
            <span className="dt-footer-label">KOLEKSI</span>
            <a href="#koleksi">Noir</a>
            <a href="#koleksi">Blanc</a>
            <a href="#koleksi">Signature</a>
          </div>
          <div className="dt-footer-column dt-footer-help">
            <span className="dt-footer-label">BUTUH BANTUAN?</span>
            <p>Diskusikan kebutuhan kartu untuk bisnismu bersama kami.</p>
            <a href="https://wa.me/6281321778081">Hubungi DiTapAja <ArrowUpRight size={14}/></a>
          </div>
        </div>
        <div className="dt-footer-bottom">
          <span>© 2026 DiTapAja. All rights reserved.</span>
          <span>NFC + QR CODE · DASHBOARD GRATIS</span>
          <a href="#top">Kembali ke atas ↑</a>
        </div>
      </footer>
    </main>
  );
}
