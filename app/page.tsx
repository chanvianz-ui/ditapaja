import { ArrowDown, ArrowUpRight, Check, ChevronRight, CircleDot, CreditCard, Gauge, Link2, Nfc, QrCode, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import SiteHeader from "./components/site-header";
import ProductCarousel from "./components/product-carousel";

const products = [
  { name: "Noir", label: "Noir", description: "Karakter tegas untuk bisnis yang ingin tampil standout.", tone: "noir", price: "Rp50.000", order: "READY TO ORDER", action: "Beli Noir", mode: "buy" },
  { name: "Blanc", label: "Blanc", description: "Minimal, bersih, dan mudah menyatu dengan identitas brand.", tone: "blanc", price: "Rp50.000", order: "READY TO ORDER", action: "Beli Blanc", mode: "buy" },
  { name: "Signature", label: "Signature", description: "Kartu dengan identitas visual bisnismu sendiri.", tone: "signature", price: "Rp60.000", order: "PRE-ORDER · MIN. 10 KARTU", action: "Pre-order", mode: "preorder" }
];

function BrandGlyph() {
  return <span className="dta-glyph" aria-hidden="true"><i/><i/><i/></span>;
}

function CardArtifact() {
  return <div className="dta-artifact" aria-label="Visual kartu NFC DiTapAja">
    <div className="dta-artifact-back"><span>DITAPAJA® / NFC REVIEW SYSTEM</span><span>01—03</span></div>
    <div className="dta-artifact-card">
      <div className="dta-artifact-top"><BrandGlyph/><span>DITAPAJA</span><Nfc size={20}/></div>
      <div className="dta-artifact-title">Make<br/><em>good</em><br/>reviews.</div>
      <div className="dta-artifact-bottom"><span>ONE TAP CLOSER</span><span>NFC · QR</span></div>
      <div className="dta-artifact-chip">TAP<br/>HERE <ArrowUpRight size={16}/></div>
    </div>
    <div className="dta-artifact-orbit dta-artifact-orbit-a"/>
    <div className="dta-artifact-orbit dta-artifact-orbit-b"/>
    <div className="dta-artifact-note"><span className="dta-live-dot"/><span><small>BUILT FOR REAL BUSINESSES</small><b>One tap. No extra app.</b></span></div>
    <span className="dta-artifact-index">DTA / OBJECT 001</span>
  </div>;
}

const steps = [
  { n:"01", icon:Nfc, title:"Tap the card.", copy:"Pelanggan cukup mendekatkan smartphone ke kartu NFC. QR Code juga tersedia sebagai alternatif." },
  { n:"02", icon:Link2, title:"Your link opens.", copy:"Browser langsung membuka halaman tujuan yang sudah kamu atur. Tanpa aplikasi tambahan." },
  { n:"03", icon:Sparkles, title:"Make it count.", copy:"Pelanggan tiba di halaman review dan bisa membagikan pengalaman mereka dengan lebih praktis." }
];

export default function Home() {
  return <main className="dta-home" id="top">
    <SiteHeader/>
    <section className="dta-hero">
      <div className="dta-hero-inner">
        <div className="dta-hero-copy">
          <div className="dta-eyebrow"><span className="dta-live-dot"/> NFC REVIEW CARD <i/> FREE DASHBOARD</div>
          <p className="dta-hero-overline">A SMALL OBJECT.<br/>A BETTER EXPERIENCE.</p>
          <h1>Bikin review<br/>semudah <em>satu tap.</em></h1>
          <p className="dta-hero-description">Cara yang lebih praktis untuk mengarahkan pelanggan ke halaman review bisnismu. Cukup tap atau scan — selesai.</p>
          <div className="dta-hero-actions">
            <a href="#koleksi" className="dta-primary-action">Temukan kartu <ArrowUpRight size={18}/></a>
            <a href="#cara-kerja" className="dta-secondary-action">Lihat cara kerja <ArrowDown size={15}/></a>
          </div>
          <div className="dta-trust-row"><span><Check size={14}/> NFC + QR</span><span><Check size={14}/> Tanpa aplikasi</span><span><Check size={14}/> Tanpa biaya bulanan</span></div>
        </div>
        <CardArtifact/>
      </div>
      <div className="dta-hero-bottom"><span>DESIGNED TO BE SIMPLE</span><span>01 — 04 <ArrowDown size={13}/></span></div>
    </section>

    <section className="dta-manifesto">
      <div className="dta-section-tag"><span>01</span> THE IDEA</div>
      <div className="dta-manifesto-content"><h2>Less friction.<br/><em>More connection.</em></h2><p>Jangan biarkan pelanggan mencari-cari link review. Letakkan aksesnya tepat di tempat pengalaman baik itu terjadi.</p></div>
      <div className="dta-manifesto-stamp"><ScanLine size={20}/><span>JUST TAP<br/>OR SCAN</span></div>
    </section>

    <section className="dta-collection" id="koleksi">
      <div className="dta-section-heading"><div><div className="dta-section-tag"><span>02</span> THE OBJECTS</div><h2>Choose your<br/><em>signature.</em></h2></div><p>Satu fungsi. Tiga karakter visual. Temukan kartu yang paling pas untuk identitas bisnismu.</p></div>
      <ProductCarousel products={products}/>
      <div className="dta-collection-foot"><span>ALL CARDS INCLUDE NFC + QR</span><span>STARTS FROM <b>Rp50.000</b></span></div>
    </section>

    <section className="dta-process" id="cara-kerja">
      <div className="dta-section-heading"><div><div className="dta-section-tag"><span>03</span> THE EXPERIENCE</div><h2>Three steps.<br/><em>That's it.</em></h2></div><p>Teknologi yang bekerja di belakang layar, supaya pelanggan tidak perlu berpikir dua kali.</p></div>
      <div className="dta-process-list">{steps.map((step) => { const Icon=step.icon; return <article className="dta-process-item" key={step.n}><span className="dta-process-number">{step.n}</span><span className="dta-process-icon"><Icon size={21}/></span><div><h3>{step.title}</h3><p>{step.copy}</p></div><ChevronRight className="dta-process-arrow" size={18}/></article>; })}</div>
      <div className="dta-process-note"><ShieldCheck size={17}/><span>Kompatibel dengan smartphone ber-NFC. QR Code tetap tersedia untuk perangkat lain.</span></div>
    </section>

    <section className="dta-dashboard">
      <div className="dta-dashboard-copy"><div className="dta-section-tag"><span>04</span> BEYOND THE CARD</div><h2>Control it<br/>from <em>one place.</em></h2><p>Kartu fisik adalah awalnya. Kelola tautan tujuan dan pantau aktivitas kartu lewat dashboard yang sudah termasuk.</p><div className="dta-dashboard-points"><span><CreditCard size={16}/> Kelola kartu</span><span><Gauge size={16}/> Pantau aktivitas</span><span><QrCode size={16}/> Akses QR Code</span></div><a href="/login" className="dta-outline-action">Explore dashboard <ArrowUpRight size={17}/></a></div>
      <div className="dta-dashboard-visual">
        <div className="dta-dash-window"><div className="dta-dash-top"><span><BrandGlyph/> DITAPAJA <i>STUDIO</i></span><span>WORKSPACE / OVERVIEW</span></div><div className="dta-dash-welcome"><small>YOUR BUSINESS, IN ONE VIEW</small><b>Good evening<span>.</span></b><p>Here’s what’s happening with your cards.</p></div><div className="dta-dash-stats"><div><span>TOTAL TAPS</span><b>1,284</b><small>Card interactions</small></div><div><span>LINK CLICKS</span><b>864</b><small>Destination visits</small></div></div><div className="dta-dash-chart"><div><span>ACTIVITY OVERVIEW</span><small>LAST 30 DAYS</small></div><div className="dta-chart-bars">{[28,42,34,57,46,70,52,84,63,76,58,91,67,80,54,73].map((v,i)=><i key={i} style={{height:v+"%"}}/>)}</div></div><div className="dta-dash-card"><span className="dta-dash-card-icon"><Nfc size={17}/></span><span><b>Noir — Main counter</b><small>ACTIVE CARD</small></span><i><CircleDot size={9}/> ACTIVE</i></div><div className="dta-dash-disclaimer">ILLUSTRATIVE PREVIEW · NOT LIVE ACCOUNT DATA</div></div>
      </div>
    </section>

    <section className="dta-final-cta"><div className="dta-final-cta-top"><span>YOUR NEXT MOVE</span><span>DITAPAJA®</span></div><h2>Make the<br/><em>next tap count.</em></h2><p>Mulai dari satu kartu NFC. Bawa pengalaman review yang lebih mudah ke bisnismu.</p><a href="/koleksi" className="dta-primary-action">Pilih kartu pertamamu <ArrowUpRight size={18}/></a><div className="dta-final-cta-bottom"><span>NFC CARD / QR CODE / FREE DASHBOARD</span><span>© 2026 DITAPAJA</span></div></section>

    <footer className="dta-footer"><a href="/" className="dta-footer-brand"><BrandGlyph/> DiTapAja<span>®</span></a><p>Make every customer experience count.</p><div className="dta-footer-links"><a href="/koleksi">Koleksi</a><a href="/faq">FAQ</a><a href="/kontak">Kontak</a><a href="/login">Dashboard</a></div><small>© 2026 DiTapAja. All rights reserved.</small></footer>
  </main>;
}
