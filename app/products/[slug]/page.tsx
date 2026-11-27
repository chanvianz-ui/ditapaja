import Link from "next/link";
import SiteHeader from "../../components/site-header";
import type { Metadata } from "next";
import { PRODUCTS, formatProductPrice, isProductSlug } from "../../lib/product-catalog";
import { ArrowLeft, ArrowUpRight, Check, ChartNoAxesCombined, Link2, MonitorSmartphone, Nfc, QrCode, Settings2, CalendarDays } from "lucide-react";
const collection = PRODUCTS;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
 const { slug } = await params;
 const product = (isProductSlug(slug) ? collection[slug] : undefined);
 if (!product) return { title: "Produk tidak ditemukan | DiTapAja", robots: { index: false, follow: false } };
 const description = product.description + " " + product.detail;
 return {
  title: product.name + " — Kartu NFC + QR",
  description,
  alternates: { canonical: "/products/" + slug },
  openGraph: { title: product.name + " | DiTapAja", description, url: "/products/" + slug, type: "website", siteName: "DiTapAja" },
 };
}

const features=[
{icon:Nfc,title:"Akses NFC sekali sentuh",desc:"Pelanggan cukup mendekatkan ponsel yang mendukung NFC untuk membuka halaman ulasan."},
{icon:QrCode,title:"Akses melalui QR Code",desc:"Pelanggan juga dapat memindai QR Code menggunakan kamera ponsel."},
{icon:ChartNoAxesCombined,title:"Pantau performa kartu",desc:"Lihat jumlah tap, estimasi pengunjung unik, dan klik menuju Google Review."},
{icon:Link2,title:"Pengelolaan tautan fleksibel",desc:"Perbarui tujuan tautan melalui dashboard tanpa perlu mengganti kartu fisik."},
{icon:CalendarDays,title:"Analisis aktivitas",desc:"Tinjau aktivitas kartu berdasarkan rentang waktu yang tersedia."},
{icon:MonitorSmartphone,title:"Dashboard responsif",desc:"Kelola kartu dengan nyaman melalui ponsel maupun komputer."},
{icon:Settings2,title:"Kelola kartu dari satu tempat",desc:"Atur kartu dan tautan tujuan dari satu akun DiTapAja."},
{icon:Check,title:"Tanpa biaya langganan bulanan",desc:"Akses dashboard sudah termasuk dalam pembelian kartu. Tidak ada biaya langganan bulanan."}
];
function ProductArtwork({tone}:{tone:string}) {
 const variant = tone === "blanc" ? "BLANC / WHITE" : tone === "signature" ? "SIGNATURE / CUSTOM" : "NOIR / BLACK";
 return <div className={`detail-art detail-art--${tone}`} role="img" aria-label={`Visualisasi kartu DiTapAja ${tone}`}>
  <div className="detail-art-orbit detail-art-orbit--one" />
  <div className="detail-art-orbit detail-art-orbit--two" />
  <div className="detail-art-index"><span>DITAPAJA OBJECTS</span><b>01 — 03</b></div>
  <div className={`detail-card detail-card--${tone}`}>
   <div className="detail-card-top"><span className="detail-card-brand">DiTapAja<span>.</span></span><span className="detail-card-edition">{variant}</span></div>
   <div className="detail-card-center"><span className="detail-card-overline">YOUR REVIEW, ONE TAP AWAY</span><strong>Make every<br/>tap count<span>.</span></strong><div className="detail-stars" aria-hidden="true">★★★★★</div></div>
   <div className="detail-card-bottom"><span><i/> NFC + QR ENABLED</span><span className="detail-card-mark"><Nfc size={25} strokeWidth={1.5}/></span></div>
  </div>
  <div className="detail-art-foot"><span>01 / PHYSICAL NFC REVIEW CARD</span><span>10 × 10 CM</span></div>
 </div>;
}
export default async function ProductDetail({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params; const product=collection[slug as keyof typeof collection];
 if(!product)return <main className="product-not-found"><h1>Produk tidak ditemukan</h1><Link href="/koleksi">Kembali ke koleksi</Link></main>;
 const minimumQuantity=product.minimum;
 const minimumTotal=product.price*minimumQuantity;
 const orderUrl="/pesan?product="+slug;
 const orderLabel=product.mode==="preorder"?"Mulai pre-order":"Pesan sekarang";
 return <main className="product-detail-page"><SiteHeader />

 <section className="detail-hero container dt-product-hero"><div className="detail-copy dt-product-copy"><Link href="/koleksi" className="detail-back"><ArrowLeft size={15}/> Kembali ke koleksi</Link><div className="eyebrow">DITAPAJA / PRODUK / {product.edition}</div><h1>{product.name}</h1><h2>{product.headline}</h2><p>{product.description}</p><p>{product.detail}</p><div className="detail-price"><strong>{formatProductPrice(product.price)}</strong><span>/ kartu</span>{product.mode==="preorder"&&<small>Min. {minimumQuantity} kartu · Total mulai {formatProductPrice(minimumTotal)}</small>}</div><div className="detail-pills"><span><Nfc size={14}/> NFC</span><span><QrCode size={14}/> QR Code</span><span><Check size={14}/> Dashboard gratis</span></div><Link className="button" href={orderUrl}>{orderLabel} <ArrowUpRight size={16}/></Link><p className="detail-order-hint">{product.mode==="preorder"?"Diskusikan kebutuhan desain custom melalui WhatsApp.":"Isi detail pesanan, lalu lanjutkan konfirmasi melalui WhatsApp."}</p></div><ProductArtwork tone={product.color}/></section>
 <section className="detail-spec-section dt-product-spec"><div className="container"><div className="eyebrow">SPESIFIKASI PRODUK</div><h2>Spesifikasi kartu</h2><div className="detail-spec-grid"><div><span>Material</span><b>PVC Card</b></div><div><span>Ukuran</span><b>10 × 10 cm</b></div><div><span>Teknologi</span><b>NFC</b></div><div><span>Akses alternatif</span><b>QR Code</b></div><div><span>Warna / desain</span><b>{product.edition.replace(" EDITION","")}</b></div><div><span>Tujuan penggunaan</span><b>Google Review</b></div></div><p className="detail-fit"><b>Cocok untuk:</b> {product.fit}</p></div></section>
 <section className="detail-features container dt-product-features"><div className="eyebrow">FITUR DALAM SATU EKOSISTEM</div><h2>Lebih dari sekadar kartu.<br/>Semua terhubung dalam satu tempat.</h2><p className="detail-feature-intro">Setiap kartu dilengkapi dashboard untuk mengelola tautan tujuan dan memantau interaksi pelanggan, tanpa biaya langganan bulanan.</p><div className="detail-feature-grid">{features.map(({icon:Icon,title,desc})=><article key={title}><span><Icon size={20}/></span><h3>{title}</h3><p>{desc}</p></article>)}</div></section>
 <section className="detail-order dt-product-order"><div className="container detail-order-inner"><div><div className="eyebrow">MULAI BERSAMA DITAPAJA</div><h2>Ubah setiap interaksi<br/>menjadi peluang ulasan.</h2><p>{product.mode==="preorder"?"Mulai dari minimum 10 kartu. Tim kami akan membantu membahas kebutuhan desain dan pemesananmu.":"Isi detail pesanan dan lanjutkan konfirmasi melalui WhatsApp. Dashboard monitoring sudah termasuk tanpa biaya bulanan."}</p></div><Link className="button button-white" href={orderUrl}>{orderLabel} <ArrowUpRight size={16}/></Link></div></section>
 <footer className="detail-footer"><Link href="/">© 2026 DiTapAja</Link><span>Satu sentuhan untuk lebih banyak ulasan.</span></footer></main>;
}
