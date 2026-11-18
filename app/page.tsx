import { ArrowRight, ArrowUpRight, Check, ChevronDown, Link2, Smartphone, ShieldCheck, Sparkles } from "lucide-react";
import SiteHeader from "./components/site-header";
import ProductCarousel from "./components/product-carousel";
import ScrollMotion from "./components/scroll-motion";

const products=[
{name:"DiTapAja Noir",label:"01 / BLACK EDITION",description:"Karakter tegas untuk bisnis yang ingin tampil standout.",tone:"noir",price:"Rp50.000",order:"READY TO ORDER",action:"Beli Noir",mode:"buy"},
{name:"DiTapAja Blanc",label:"02 / WHITE EDITION",description:"Minimal, bersih, dan mudah menyatu dengan identitas brand.",tone:"blanc",price:"Rp50.000",order:"READY TO ORDER",action:"Beli Blanc",mode:"buy"},
{name:"DiTapAja Signature",label:"03 / CUSTOM EDITION",description:"Kartu dengan identitas visual bisnismu sendiri.",tone:"signature",price:"Rp60.000",order:"PRE-ORDER · MIN. 10 KARTU",action:"Pre-order",mode:"preorder"}];
const questions=[
["Apakah ada biaya dashboard bulanan?","Tidak ada. Akses dashboard sudah termasuk dalam pembelian kartu DiTapAja."],
["Bagaimana pelanggan menggunakan kartu?","Pelanggan cukup mendekatkan smartphone yang mendukung NFC atau memindai QR Code pada kartu."],
["Apakah link tujuan bisa diganti?","Bisa. Kamu dapat mengubah tujuan kartu melalui dashboard tanpa perlu mengganti kartu."],
["Data apa yang tersedia di dashboard?","Kamu dapat memantau jumlah tap, estimasi pengunjung unik, dan klik menuju Google Review. Angka ini bukan jumlah ulasan yang dipublikasikan."]];
function Brand(){return <a href="/" className="brand"><span className="brand-symbol"><i/><i/><i/></span><span>DiTap<span className="blue-word">Aja</span></span></a>}
export default function Home(){return <main className="concept-home dt-home-mobile-first" id="top">
<ScrollMotion/>
<SiteHeader/>
<section className="concept-hero dt-home-hero">
 <div className="dt-home-hero-inner">
  <div className="concept-eyebrow"><span/> NFC REVIEW CARD <i/> BUILT FOR BETTER REVIEWS</div>
  <h1>Make every<br/><em>customer tap count.</em></h1>
  <p className="concept-lead">Permudah pelanggan memberi ulasan Google. Satu kartu NFC + QR, dengan dashboard gratis untuk memantau aktivitasnya.</p>
  <div className="concept-hero-actions"><a className="concept-button" href="#koleksi">Temukan kartu <ArrowUpRight size={17}/></a><a className="concept-quiet-link" href="#experience">Lihat cara kerja <ArrowRight size={15}/></a></div>
  <div className="dt-hero-proof"><span><Check size={14}/> NFC + QR</span><span><Check size={14}/> Dashboard gratis</span><span><Check size={14}/> Tanpa biaya bulanan</span></div>
 </div>
 <div className="dt-hero-index"><span>DITAPAJA® / 2026</span><a href="#koleksi">SCROLL TO EXPLORE <span>↓</span></a></div>
</section>
<section className="concept-collection dt-home-collection" id="koleksi">
 <div className="concept-section-top dt-home-section-heading"><div><div className="concept-eyebrow dark-eyebrow">THE COLLECTION</div><h2>Designed to<br/><em>make an impact.</em></h2></div><p>Kartu review yang praktis digunakan, mudah dikelola, dan siap menjadi bagian dari pengalaman bisnismu.</p></div>
 <ProductCarousel products={products}/>
 <div className="concept-collection-foot"><span>ONE CARD. MORE CONNECTIONS.</span><p>Semua kartu dilengkapi NFC, QR Code, dan akses dashboard tanpa biaya bulanan.</p></div>
</section>
<section className="concept-experience dt-home-how" id="experience">
 <div className="concept-experience-head"><div className="concept-eyebrow">SIMPLE BY DESIGN</div><h2>From tap<br/><em>to review.</em></h2><p>Pengalaman yang sederhana, tanpa aplikasi tambahan.</p></div>
 <div className="concept-flow"><article><span className="concept-step-no">01</span><div className="concept-step-icon"><Smartphone size={22}/></div><h3>Tap atau scan</h3><p>Pelanggan mendekatkan ponsel ke kartu atau memindai QR Code.</p></article><div className="concept-flow-line"/><article><span className="concept-step-no">02</span><div className="concept-step-icon"><Link2 size={22}/></div><h3>Halaman terbuka</h3><p>Link tujuan bisnismu terbuka langsung di browser.</p></article><div className="concept-flow-line"/><article><span className="concept-step-no">03</span><div className="concept-step-icon"><Check size={22}/></div><h3>Berikan ulasan</h3><p>Pelanggan diarahkan ke Google Review untuk berbagi pengalaman.</p></article></div>
 <div className="concept-experience-note"><ShieldCheck size={17}/> Tidak perlu install aplikasi. Gunakan NFC yang kompatibel atau kamera untuk scan QR.</div>
</section>
<section className="concept-dashboard dt-home-dashboard" id="dashboard">
 <div className="concept-dashboard-copy"><div className="concept-eyebrow dark-eyebrow">YOUR BUSINESS, IN CONTROL</div><h2>See what<br/><em>every tap means.</em></h2><p>Pantau interaksi pelanggan dan kelola tautan kartu dari satu dashboard yang sudah termasuk dalam pembelian.</p><ul><li><Check size={15}/> Pantau jumlah tap</li><li><Check size={15}/> Lihat estimasi pengunjung unik</li><li><Check size={15}/> Pantau klik ke Google Review</li><li><Check size={15}/> Ubah tautan kapan saja</li></ul><a href="/login" className="concept-dashboard-link">Masuk ke dashboard <ArrowUpRight size={16}/></a></div>
 <div className="concept-dashboard-visual"><div className="concept-dashboard-frame"><div className="concept-dash-top"><Brand/><span><i/> DASHBOARD PREVIEW</span></div><div className="concept-dash-welcome"><small>OVERVIEW</small><h3>Ringkasan bisnismu</h3><p>Aktivitas kartu dalam satu tampilan</p></div><div className="concept-dash-metrics"><div><span>Total tap</span><b>— — —</b><small>Aktivitas kartu</small></div><div><span>Review clicks</span><b>— — —</b><small>Menuju Google Review</small></div></div><div className="concept-dash-chart"><div><span>RINGKASAN AKTIVITAS</span><small>Ilustrasi tampilan</small></div><div className="concept-chart-bars">{[30,48,38,67,52,82,59,92,70,100,76,88].map((h,i)=><i key={i} style={{height:h+"%"}}/>)}</div></div></div><div className="concept-dash-sticker"><Sparkles size={16}/><span>Included with<br/><b>every card.</b></span></div></div>
</section>
<section className="concept-faq dt-home-faq" id="faq"><div><div className="concept-eyebrow dark-eyebrow">GOOD TO KNOW</div><h2>Before you<br/><em>make the move.</em></h2><p>Belum menemukan jawaban? <a href="https://wa.me/6281321778081">Tanya langsung <ArrowUpRight size={13}/></a></p></div><div className="concept-faq-list">{questions.map(([q,a])=><details key={q}><summary>{q}<ChevronDown size={17}/></summary><p>{a}</p></details>)}</div></section>
<section className="concept-final dt-home-final"><div className="concept-final-orbit"/><div className="concept-eyebrow">READY WHEN YOU ARE</div><h2>Make the next<br/><em>review effortless.</em></h2><p>Mulai dari satu kartu. Buat setiap interaksi lebih berarti.</p><a href="#koleksi" className="concept-final-button">Pilih kartu sekarang <ArrowUpRight size={17}/></a><span className="concept-final-mark">DiTapAja®</span></section>
<footer className="concept-footer"><Brand/><span>© 2026 DiTapAja. Lebih mudah terhubung.</span><a href="https://wa.me/6281321778081">Hubungi kami <ArrowUpRight size={14}/></a></footer>
</main>}
