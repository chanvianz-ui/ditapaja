import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, Check, ChartNoAxesCombined, Link2, MonitorSmartphone, Nfc, QrCode, Settings2, CalendarDays } from "lucide-react";
const collection = {
 noir:{name:"DiTapAja Noir",edition:"BLACK EDITION",headline:"Elegance in Every Interaction.",description:"Desain hitam yang elegan dan eksklusif untuk bisnis yang ingin menghadirkan kesan modern dan profesional.",detail:"Dengan ukuran 10 × 10 cm, Noir mudah ditempatkan di area kasir maupun meja pelanggan. Cukup satu kali tap NFC atau scan QR Code, pelanggan langsung diarahkan ke halaman Google Review bisnismu.",color:"noir",price:"Rp50.000",mode:"buy",fit:"Specialty coffee, coffee shop, restoran, lounge, bar, dan bisnis dengan konsep modern."},
 blanc:{name:"DiTapAja Blanc",edition:"WHITE EDITION",headline:"Simplicity Meets Elegance.",description:"Desain putih yang bersih, minimalis, dan timeless untuk bisnis yang mengutamakan estetika sederhana tanpa mengesampingkan fungsi.",detail:"Dengan ukuran 10 × 10 cm, Blanc memberikan tampilan rapi dan profesional. Pelanggan cukup melakukan satu kali tap NFC atau scan QR Code untuk membuka halaman Google Review.",color:"blanc",price:"Rp50.000",mode:"buy",fit:"Cafe, bakery, dessert shop, hotel, salon, klinik kecantikan, dan retail."},
 signature:{name:"DiTapAja Signature",edition:"CUSTOM EDITION",headline:"Your Brand. Your Signature.",description:"Desain personal yang mengikuti identitas visual bisnismu. Tampilkan logo, warna, dan elemen visual yang mencerminkan karakter brand.",detail:"Dengan ukuran 10 × 10 cm, kartu dirancang mengikuti identitas visual bisnismu, sekaligus memudahkan pelanggan membuka halaman Google Review melalui NFC atau QR Code.",color:"signature",price:"Rp60.000",mode:"preorder",fit:"Corporate business, franchise, hotel, restoran, coffee shop, salon, dan bisnis yang mengutamakan identitas brand."}
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
 const { slug } = await params;
 const product = collection[slug as keyof typeof collection];
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
{icon:Nfc,title:"NFC One-Tap Access",desc:"Pelanggan cukup mendekatkan ponsel yang mendukung NFC untuk membuka halaman tujuan."},
{icon:QrCode,title:"QR Code Access",desc:"Pilihan akses alternatif dengan memindai QR Code menggunakan kamera ponsel."},
{icon:ChartNoAxesCombined,title:"Dashboard Monitoring",desc:"Pantau total tap, estimasi pengunjung unik, dan klik menuju Google Review."},
{icon:Link2,title:"Flexible Link Management",desc:"Ubah tujuan tautan melalui dashboard tanpa perlu mengganti kartu."},
{icon:CalendarDays,title:"Activity Analytics",desc:"Tinjau aktivitas kartu berdasarkan periode yang tersedia di dashboard."},
{icon:MonitorSmartphone,title:"Mobile-Friendly Dashboard",desc:"Akses dashboard melalui ponsel maupun komputer."},
{icon:Settings2,title:"Kelola Kartu dengan Mudah",desc:"Atur kartu dan tujuan tautannya dari satu akun DiTapAja."},
{icon:Check,title:"Dashboard Tanpa Biaya Bulanan",desc:"Akses dashboard sudah termasuk dalam pembelian kartu, tanpa langganan bulanan."}
];
function ProductArtwork({tone}:{tone:string}){return <div className={`detail-art ${tone}`}><div className={`detail-card ${tone}`}><div className="detail-card-brand">DiTapAja<span>.</span></div><div className="detail-card-center"><span>GOOGLE REVIEW</span><b>Make every tap count.</b><div className="detail-stars">★★★★★</div></div><div className="detail-card-bottom"><span>NFC ENABLED</span><Nfc size={23}/></div></div><span className="detail-art-caption">10 × 10 CM · PVC NFC CARD</span></div>}
export default async function ProductDetail({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params; const product=collection[slug as keyof typeof collection];
 if(!product)return <main className="product-not-found"><h1>Produk tidak ditemukan</h1><Link href="/koleksi">Kembali ke koleksi</Link></main>;
 const orderUrl=product.mode==="preorder"?"https://wa.me/6281321778081?text="+encodeURIComponent("Halo DiTapAja, saya ingin pre-order DiTapAja Signature. Mohon informasi desain custom untuk minimum 10 kartu."):"https://shopee.co.id/bekasidigicam";
 const orderLabel=product.mode==="preorder"?"Pre-order via WhatsApp":"Beli di Shopee";
 return <main className="product-detail-page">
 <header className="detail-header"><div className="detail-header-inner"><Link href="/" className="detail-brand"><span className="detail-brand-mark">D</span>DiTap<span>Aja</span></Link><Link href="/koleksi" className="detail-back"><ArrowLeft size={16}/> Semua koleksi</Link></div></header>
 <section className="detail-hero container"><div className="detail-copy"><div className="eyebrow">DITAPAJA PREMIUM COLLECTION / {product.edition}</div><h1>{product.name}</h1><h2>{product.headline}</h2><p>{product.description}</p><p>{product.detail}</p><div className="detail-price"><strong>{product.price}</strong><span>/ kartu</span>{product.mode==="preorder"&&<small>Minimum pemesanan 10 kartu</small>}</div><div className="detail-pills"><span><Nfc size={14}/> NFC</span><span><QrCode size={14}/> QR Code</span><span><Check size={14}/> Dashboard gratis</span></div><a className="button" href={orderUrl} target="_blank" rel="noreferrer">{orderLabel} <ArrowUpRight size={16}/></a></div><ProductArtwork tone={product.color}/></section>
 <section className="detail-spec-section"><div className="container"><div className="eyebrow">PRODUCT SPECIFICATIONS</div><h2>Detail produk</h2><div className="detail-spec-grid"><div><span>Material</span><b>PVC Card</b></div><div><span>Ukuran</span><b>10 × 10 cm</b></div><div><span>Teknologi</span><b>NFC</b></div><div><span>Akses alternatif</span><b>QR Code</b></div><div><span>Warna / desain</span><b>{product.edition.replace(" EDITION","")}</b></div><div><span>Tujuan penggunaan</span><b>Google Review</b></div></div><p className="detail-fit"><b>Cocok untuk:</b> {product.fit}</p></div></section>
 <section className="detail-features container"><div className="eyebrow">MORE THAN A CARD</div><h2>Semua yang kamu butuhkan<br/>dalam satu ekosistem.</h2><p className="detail-feature-intro">Setiap pembelian kartu DiTapAja sudah dilengkapi akses dashboard untuk mengelola dan memantau aktivitas kartu.</p><div className="detail-feature-grid">{features.map(({icon:Icon,title,desc})=><article key={title}><span><Icon size={20}/></span><h3>{title}</h3><p>{desc}</p></article>)}</div></section>
 <section className="detail-order"><div className="container detail-order-inner"><div><div className="eyebrow">READY TO GET STARTED?</div><h2>Mulai bangun reputasi<br/>bisnismu bersama DiTapAja.</h2><p>Pesan kartu pilihanmu dan nikmati dashboard monitoring tanpa biaya langganan bulanan.</p></div><a className="button button-white" href={orderUrl} target="_blank" rel="noreferrer">{orderLabel} <ArrowUpRight size={16}/></a></div></section>
 <footer className="detail-footer"><Link href="/">© 2026 DiTapAja</Link><span>Tap to Review, Tap to Reach More.</span></footer></main>;
}