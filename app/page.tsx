import { ArrowRight, ArrowUpRight, Check, ChevronDown, Nfc, QrCode, BarChart3, Link2, Smartphone } from "lucide-react";

const products = [
  { name:"DiTapAja Noir", label:"BLACK EDITION", description:"Karakter tegas untuk brand yang berani tampil berbeda.", tone:"noir", href:"/products/noir" },
  { name:"DiTapAja Blanc", label:"WHITE EDITION", description:"Sederhana, bersih, dan mudah menyatu dengan ruang apa pun.", tone:"blanc", href:"/products/blanc" },
  { name:"DiTapAja Signature", label:"CUSTOM EDITION", description:"Sentuhan personal dengan identitas visual brand milikmu.", tone:"signature", href:"/products/signature" }
];

const questions = [
  ["Apakah dashboard dikenakan biaya bulanan?","Tidak. Akses dashboard sudah termasuk dalam pembelian kartu DiTapAja."],
  ["Bagaimana pelanggan menggunakan kartu?","Pelanggan cukup mendekatkan smartphone yang mendukung NFC atau memindai QR Code pada kartu."],
  ["Apakah link tujuan bisa diubah?","Bisa. Tujuan kartu dapat dikelola melalui dashboard tanpa perlu mengganti kartu."],
  ["Apa saja yang bisa dipantau?","Dashboard dirancang untuk menampilkan jumlah tap, estimasi pengunjung unik, dan klik menuju Google Review."]
];

function Brand(){return <a href="/" className="brand"><span className="brand-symbol"><i/><i/><i/></span><span>DiTap<span className="blue-word">Aja</span></span></a>}

function CardMock({tone}:{tone:string}) {
 return <div className={`simple-card ${tone}`}>
  <div className="simple-card-top"><b>DiTapAja<span>.</span></b><Nfc size={23}/></div>
  <div className="simple-card-center"><span>YOUR BUSINESS</span><strong>MAKE EVERY<br/>TAP COUNT.</strong></div>
  <div className="simple-card-bottom"><span>NFC · QR CODE</span><span>10 × 10 CM</span></div>
 </div>
}

export default function Home(){
 return <main className="minimal-home">
  <header className="minimal-header"><div className="minimal-nav"><Brand/><nav><a href="#produk">Produk</a><a href="#cara-kerja">Cara kerja</a><a href="#faq">FAQ</a></nav><div className="minimal-actions"><a href="/login">Masuk</a><a className="minimal-cta" href="#produk">Pilih kartu <ArrowUpRight size={15}/></a></div></div></header>
  <section className="minimal-hero">
   <div className="minimal-hero-inner">
    <div className="minimal-hero-copy"><span className="minimal-kicker">NFC REVIEW CARD · FREE DASHBOARD</span><h1>Review bisnis,<br/><em>semudah satu tap.</em></h1><p>Hubungkan pelanggan ke halaman Google Review dengan satu sentuhan. Kelola kartu dan pantau interaksi melalui satu dashboard.</p><div className="minimal-hero-buttons"><a className="minimal-cta" href="#produk">Temukan kartu <ArrowRight size={16}/></a><a className="minimal-text-link" href="#cara-kerja">Pelajari cara kerja</a></div><div className="minimal-assurance"><Check size={15}/> Sekali beli. Dashboard tanpa biaya bulanan.</div></div>
    <div className="minimal-hero-visual"><div className="minimal-orbit orbit-one"/><div className="minimal-orbit orbit-two"/><CardMock tone="noir"/><div className="minimal-float"><span><Nfc size={17}/></span><div><b>Tap. Terhubung.</b><small>Tanpa aplikasi tambahan</small></div></div><div className="minimal-visual-index">DITAPAJA / 001</div></div>
   </div>
  </section>
  <section className="minimal-benefits"><div className="minimal-benefit"><Nfc/><div><b>Satu sentuhan</b><span>Akses dengan NFC</span></div></div><div className="minimal-benefit"><QrCode/><div><b>Scan juga bisa</b><span>QR Code tersedia</span></div></div><div className="minimal-benefit"><BarChart3/><div><b>Lebih terukur</b><span>Pantau dari dashboard</span></div></div><div className="minimal-benefit"><Link2/><div><b>Fleksibel</b><span>Atur link kapan saja</span></div></div></section>
  <section className="minimal-products" id="produk"><div className="minimal-section-head"><div><span className="minimal-kicker">THE COLLECTION</span><h2>Satu fungsi.<br/><em>Tiga karakter.</em></h2></div><p>Pilih desain yang paling sesuai dengan identitas bisnismu.</p></div><div className="minimal-product-grid">{products.map((p,i)=><a className="minimal-product" href={p.href} key={p.tone}><div className={`minimal-product-art ${p.tone}`}><span className="minimal-product-label">{p.label}</span><CardMock tone={p.tone}/><span className="minimal-product-number">0{i+1}</span></div><div className="minimal-product-info"><div><h3>{p.name}</h3><p>{p.description}</p></div><span className="minimal-product-arrow"><ArrowUpRight size={18}/></span></div></a>)}</div></section>
  <section className="minimal-how" id="cara-kerja"><div className="minimal-how-inner"><div><span className="minimal-kicker">HOW IT WORKS</span><h2>Tiga langkah.<br/><em>Sesederhana itu.</em></h2><p>Pengalaman yang ringkas untuk pelanggan, kendali yang lebih mudah untuk bisnismu.</p></div><div className="minimal-steps"><article><span>01</span><div><Smartphone/><h3>Tap atau scan</h3><p>Pelanggan mendekatkan ponsel atau memindai QR Code.</p></div></article><article><span>02</span><div><Link2/><h3>Halaman terbuka</h3><p>Link tujuan bisnismu terbuka langsung di browser.</p></div></article><article><span>03</span><div><Check/><h3>Lanjut ke review</h3><p>Pelanggan dapat menulis ulasan di Google.</p></div></article></div></div></section>
  <section className="minimal-dashboard"><div className="minimal-dashboard-inner"><div><span className="minimal-kicker">ONE CARD. ONE DASHBOARD.</span><h2>Kartunya sederhana.<br/><em>Kontrolnya lengkap.</em></h2><p>Atur tujuan kartu, lihat aktivitas tap, dan pantau klik menuju Google Review dari satu tempat.</p><ul><li><Check/> Ringkasan aktivitas kartu</li><li><Check/> Estimasi pengunjung unik</li><li><Check/> Klik menuju Google Review</li><li><Check/> Tanpa biaya langganan bulanan</li></ul><a className="minimal-text-link" href="/login">Masuk ke dashboard <ArrowUpRight size={16}/></a></div><div className="minimal-dashboard-art"><div className="dashboard-window"><div className="dashboard-window-top"><span/><span/><span/><b>DiTapAja / Overview</b></div><div className="dashboard-window-body"><small>YOUR ACTIVITY</small><h3>Semua dalam kendali.</h3><div className="dashboard-placeholder-stats"><div><span>Total tap</span><b>— — —</b></div><div><span>Review clicks</span><b>— — —</b></div></div><div className="dashboard-placeholder-chart"><span/><span/><span/><span/><span/><span/><span/><span/></div><small>Visual ilustrasi dashboard</small></div></div></div></div></section>
  <section className="minimal-faq" id="faq"><div><span className="minimal-kicker">GOOD TO KNOW</span><h2>Pertanyaan<br/><em>yang sering ada.</em></h2><p>Belum menemukan jawaban? <a href="https://wa.me/6281321778081">Hubungi kami.</a></p></div><div className="minimal-faq-list">{questions.map(([q,a])=><details key={q}><summary>{q}<ChevronDown size={18}/></summary><p>{a}</p></details>)}</div></section>
  <section className="minimal-end"><span className="minimal-kicker">MAKE EVERY TAP COUNT</span><h2>Mulai dari satu tap.</h2><p>Buat pengalaman review jadi lebih mudah bersama DiTapAja.</p><a className="minimal-cta minimal-cta-light" href="#produk">Pilih desain kartu <ArrowRight size={16}/></a></section>
  <footer className="minimal-footer"><Brand/><span>© 2026 DiTapAja</span><a href="https://wa.me/6281321778081">Butuh bantuan? Hubungi kami <ArrowUpRight size={14}/></a></footer>
 </main>
}
