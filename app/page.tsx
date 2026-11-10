import {
  ArrowRight, ArrowUpRight, Check, ChevronDown, CircleHelp, CreditCard,
  Gauge, MapPin, Menu, MessageCircle, MousePointerClick, Nfc, ShieldCheck,
  Smartphone, Sparkles, Star, TrendingUp, Zap
} from "lucide-react";

const products = [
  { name: "DiTapAja Noir", subtitle: "BLACK EDITION", desc: "Desain hitam elegan untuk bisnis dengan karakter modern dan eksklusif.", price: "Lihat detail produk", tone: "noir", code: "01", href: "/products/noir" },
  { name: "DiTapAja Blanc", subtitle: "WHITE EDITION", desc: "Desain putih minimalis yang bersih, rapi, dan timeless.", price: "Lihat detail produk", tone: "blanc", code: "02", href: "/products/blanc" },
  { name: "DiTapAja Signature", subtitle: "CUSTOM EDITION", desc: "Desain personal yang mengikuti logo dan identitas visual bisnismu.", price: "Lihat detail produk", tone: "signature", code: "03", href: "/products/signature" },
];

const faqs = [
  ["Apakah ada biaya langganan dashboard?", "Tidak. Dashboard DiTapAja termasuk dalam pembelian NFC card dan tidak dikenakan biaya langganan bulanan."],
  ["Apa itu DiTapAja NFC Review Card?", "DiTapAja adalah kartu NFC yang membantu pelanggan membuka halaman review bisnis hanya dengan mendekatkan smartphone yang mendukung NFC."],
  ["Apakah pelanggan perlu mengunduh aplikasi?", "Tidak. Pelanggan cukup menggunakan smartphone yang mendukung NFC dan membuka tautan yang muncul."],
  ["Bisakah link Google Maps diganti?", "Ya. Nantinya kamu dapat mengatur tujuan kartu melalui dashboard DiTapAja tanpa perlu menulis ulang kartu NFC."],
  ["Apakah saya bisa melihat berapa kali kartu di-tap?", "Ya. Dashboard gratis DiTapAja dirancang untuk menampilkan jumlah tap dan klik menuju halaman review. Dashboard termasuk dalam pembelian kartu, tanpa biaya langganan bulanan."],
];

function Brand() {
  return <a href="#" className="brand" aria-label="DiTapAja beranda"><span className="brand-symbol"><i/><i/><i/></span><span>DiTap<span className="blue-word">Aja</span><small>NFC REVIEW • FREE DASHBOARD</small></span></a>;
}

function NfcCardVisual({ variant = "blue" }: { variant?: string }) {
  return <div className={`nfc-card-visual ${variant}`}>
    <div className="card-visual-top"><span>DiTapAja.</span><span className="tiny-chip">NFC ENABLED</span></div>
    <div className="card-wave"><span/><span/><span/></div>
    <div className="card-visual-bottom"><b>MAKE EVERY TAP COUNT.</b><Nfc size={20}/></div>
  </div>;
}

export default function Home() {
  return <main>
    <header className="site-header">
      <div className="container nav-wrap">
        <Brand/>
        <nav className="desktop-nav">
          <a href="#fitur">Fitur</a><a href="#cara-kerja">Cara Kerja</a><a href="#produk">Produk</a><a href="#faq">FAQ</a>
        </nav>
        <div className="nav-actions"><a className="login-link" href="/login">Masuk</a><a className="button button-small" href="#produk">Mulai Sekarang <ArrowUpRight size={15}/></a></div>
        <button className="mobile-menu" aria-label="Menu"><Menu size={22}/></button>
      </div>
    </header>

    <section className="hero container">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot"/> CARA BARU MENGUMPULKAN REVIEW</div>
        <h1>Satu tap,<br/><span>lebih banyak</span><br/>review.</h1>
        <p className="hero-desc">Buat pelanggan lebih mudah menemukan halaman review bisnismu. Beli NFC card sekali, nikmati dashboard DiTapAja tanpa biaya langganan bulanan. Pelanggan cukup mendekatkan smartphone untuk membuka halaman review bisnismu.</p>
        <div className="hero-actions"><a className="button" href="#produk">Temukan NFC Card <ArrowRight size={17}/></a><a className="button button-ghost" href="#cara-kerja"><span className="play-icon">▶</span> Lihat cara kerja</a></div><div className="free-note"><Check size={14}/> Dashboard gratis. Tanpa biaya bulanan.</div>
        <div className="hero-proof"><div className="avatar-stack"><span>R</span><span>A</span><span>D</span><span>+</span></div><div><div className="proof-stars">★★★★★</div><small>Pengalaman review yang lebih praktis</small></div></div>
      </div>
      <div className="hero-art">
        <div className="art-glow"/>
        <div className="floating-label label-top"><span className="live-dot"/> TAP EXPERIENCE <b>01 / 03</b></div>
        <div className="phone">
          <div className="phone-island"/>
          <div className="phone-screen">
            <div className="phone-status"><span>9:41</span><span>●●● ▰</span></div>
            <div className="google-mark"><b>G</b><span>Google</span></div>
            <div className="business-avatar">K</div>
            <h3>Kopi Senja</h3><p>Tempat nyaman untuk cerita.</p>
            <div className="rating">4.9 <span>★★★★★</span></div>
            <div className="phone-divider"/>
            <div className="review-prompt">Bagaimana pengalamanmu?</div>
            <div className="review-stars">☆ ☆ ☆ ☆ ☆</div>
            <div className="review-cta">Tulis ulasan <ArrowUpRight size={13}/></div>
            <small className="phone-note">Dibuka melalui DiTapAja</small>
          </div>
        </div>
        <div className="hero-card"><NfcCardVisual/><div className="tap-rings"><span/><span/><span/></div></div>
        <div className="floating-label label-bottom"><span className="label-icon"><TrendingUp size={15}/></span><div><b>Tap berhasil!</b><small>Pengalaman tanpa ribet</small></div><Check size={16} className="check-icon"/></div>
        <div className="art-caption">TAP. REVIEW. GROW.</div>
      </div>
    </section>

    <section className="trust-strip"><div className="container trust-inner"><span>DIBUAT UNTUK BISNIS YANG INGIN TERUS BERTUMBUH</span><div><b>CAFÉ & RESTAURANT</b><b>BEAUTY & WELLNESS</b><b>RETAIL</b><b>HOSPITALITY</b></div></div></section>

    <section className="section container" id="fitur">
      <div className="section-heading"><div className="eyebrow">KENAPA DITAPAJA?</div><h2>Review yang baik dimulai<br/>dari pengalaman yang <span>mudah.</span></h2><p>Hilangkan langkah yang tidak perlu. Bantu pelanggan memberikan feedback saat pengalaman mereka masih segar.</p></div>
      <div className="feature-grid">
        <article className="feature-card feature-main"><div className="feature-icon blue-bg"><Nfc size={22}/></div><div className="feature-number">01 / SIMPLE</div><h3>Cukup satu tap.</h3><p>Pelanggan tidak perlu mencari nama bisnismu secara manual. Dekatkan smartphone ke kartu dan halaman tujuan langsung terbuka.</p><div className="feature-illustration"><div className="mini-nfc"><Nfc size={28}/><b>DiTapAja</b></div><div className="mini-phone"><div/><div/><div/></div></div></article>
        <article className="feature-card"><div className="feature-icon purple-bg"><Gauge size={22}/></div><div className="feature-number">02 / INSIGHT</div><h3>Kenali performa.</h3><p>Pantau aktivitas tap dan klik review melalui dashboard yang mudah dipahami.</p><div className="mini-chart"><div className="chart-bars"><i/><i/><i/><i/><i/><i/><i/></div><div className="chart-line"><span>Aktivitas meningkat</span><b>↗ 24.8%</b></div></div></article>
        <article className="feature-card"><div className="feature-icon green-bg"><Zap size={22}/></div><div className="feature-number">03 / FLEXIBLE</div><h3>Atur dengan mudah.</h3><p>Kelola tujuan link kartu dari satu tempat. Tidak perlu mengganti kartu setiap kali link berubah.</p><div className="link-preview"><span className="link-icon"><MapPin size={16}/></span><div><b>Google Maps Review</b><small>maps.app.goo.gl/your-business</small></div><Check size={17}/></div></article>
      </div>
    </section>

    <section className="how-section" id="cara-kerja"><div className="container how-inner"><div className="how-copy"><div className="eyebrow">MUDAH DALAM 3 LANGKAH</div><h2>Dari tap sampai<br/><span>review.</span> Sesederhana itu.</h2><p>Pengalaman singkat yang membuat pelanggan lebih mudah terhubung dengan bisnismu.</p><a href="#produk" className="text-link">Pilih kartu NFC kamu <ArrowRight size={16}/></a></div><div className="steps"><div className="step"><div className="step-icon"><Smartphone size={21}/></div><div><span>LANGKAH 01</span><h3>Tap kartu NFC</h3><p>Pelanggan mendekatkan smartphone ke kartu DiTapAja.</p></div><b>01</b></div><div className="step"><div className="step-icon"><MousePointerClick size={21}/></div><div><span>LANGKAH 02</span><h3>Halaman terbuka</h3><p>Halaman bisnis dan tombol review tampil di browser.</p></div><b>02</b></div><div className="step"><div className="step-icon"><Star size={21}/></div><div><span>LANGKAH 03</span><h3>Bagikan pengalaman</h3><p>Pelanggan dapat melanjutkan ke halaman Google Review.</p></div><b>03</b></div></div></div></section>

    <section className="dashboard-section container" id="dashboard"><div className="dashboard-copy"><div className="eyebrow">LEBIH DARI SEKADAR KARTU</div><h2>Semua aktivitas,<br/>dalam <span>satu dashboard.</span></h2><p>Kelola kartu NFC, atur link tujuan, dan pahami interaksi pelanggan dari satu tempat. Dirancang supaya kamu fokus mengembangkan bisnis.</p><ul><li><Check size={16}/> Ringkasan aktivitas tap</li><li><Check size={16}/> Statistik klik review</li><li><Check size={16}/> Kelola beberapa kartu</li></ul><a className="button" href="#produk">Jelajahi produk <ArrowRight size={16}/></a></div><div className="dashboard-mock"><div className="mock-top"><div className="mock-brand"><span className="brand-symbol"><i/><i/><i/></span> DiTapAja</div><div className="mock-user">CI</div></div><div className="mock-body"><aside className="mock-side"><span className="mock-active">▦ Overview</span><span>▣ My Cards</span><span>⌁ Analytics</span><span>⚙ Settings</span></aside><div className="mock-content"><small>OVERVIEW / NOVEMBER 2026</small><h3>Selamat datang kembali!</h3><div className="mock-stats"><div><span>Total tap</span><b>2,481</b><em>↗ 12.8%</em></div><div><span>Review clicks</span><b>1,126</b><em>↗ 18.4%</em></div></div><div className="mock-graph"><div className="graph-title">Aktivitas NFC <span>7 hari terakhir⌄</span></div><div className="graph-lines"><i/><i/><i/><i/></div><svg viewBox="0 0 400 100" preserveAspectRatio="none"><path d="M0 82 C35 78 45 53 80 64 S125 35 160 49 S210 22 245 39 S285 15 320 27 S365 5 400 12" fill="none" stroke="#3978f6" strokeWidth="3" strokeLinecap="round"/></svg></div><div className="mock-card-row"><span className="mock-card-thumb"><Nfc size={17}/></span><span><b>Kopi Senja — Main Outlet</b><small>Active · Jakarta Selatan</small></span><strong>1,248 taps</strong></div></div></div></div></section>

    <section className="free-dashboard-band"><div className="container free-dashboard-inner"><div className="free-dashboard-icon"><Gauge size={25}/></div><div className="free-dashboard-copy"><span className="eyebrow">TERMASUK DALAM PEMBELIAN</span><h2>Dashboard gratis. <span>Selamanya.</span></h2><p>Beli NFC card DiTapAja satu kali dan gunakan dashboard untuk mengelola kartu serta memantau aktivitas tap dan klik review — tanpa tagihan langganan bulanan.</p></div><div className="free-dashboard-points"><div><Check size={15}/> Tanpa biaya bulanan</div><div><Check size={15}/> Kelola kartu dari satu akun</div><div><Check size={15}/> Pantau aktivitas kartu</div></div></div></section>

    <section className="products-section" id="produk"><div className="container"><div className="products-heading"><div><div className="eyebrow">DITAPAJA PREMIUM COLLECTION</div><h2>Pilih gaya bisnismu.</h2><p>Tiga desain NFC Review Card, satu dashboard gratis untuk memantau aktivitas pelanggan.</p></div></div><div className="product-grid">{products.map((p)=><article className="product-card" key={p.code}><a href={p.href} className="product-card-link" aria-label={`Lihat detail ${p.name}`}><div className={`product-art ${p.tone}`}><span className="product-tag">{p.subtitle}</span><div className={`collection-card ${p.tone}`}><span className="collection-brand">DiTapAja<span>.</span></span><span className="collection-review">GOOGLE REVIEW</span><span className="collection-nfc">NFC <Nfc size={18}/></span><span className="collection-size">10 × 10 CM</span></div><span className="product-code">DITAPAJA / {p.code}</span></div><div className="product-info"><h3>{p.name}</h3><p>{p.desc}</p><div><b>{p.price}</b><span className="product-arrow"><ArrowUpRight size={17}/></span></div></div></a></article>)}</div><p className="product-disclaimer">Setiap kartu dilengkapi NFC, QR Code, dan akses dashboard DiTapAja tanpa biaya langganan bulanan.</p></div></section>
