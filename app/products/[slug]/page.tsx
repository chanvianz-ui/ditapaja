import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, BarChart3, CalendarDays, Check, Link2, MonitorSmartphone, Nfc, QrCode, Settings2 } from "lucide-react";
import SiteHeader from "../../components/site-header";
import { PRODUCTS, formatProductPrice, isProductSlug } from "../../lib/product-catalog";
import styles from "./product-detail.module.css";

const collection = PRODUCTS;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = isProductSlug(slug) ? collection[slug] : undefined;
  if (!product) return { title: "Produk tidak ditemukan | DiTapAja", robots: { index: false, follow: false } };
  const description = product.description + " " + product.detail;
  return {
    title: product.name + " — Kartu NFC + QR",
    description,
    alternates: { canonical: "/products/" + slug },
    openGraph: { title: product.name + " | DiTapAja", description, url: "/products/" + slug, type: "website", siteName: "DiTapAja" },
  };
}

const features = [
  { icon: Nfc, title: "Akses NFC sekali sentuh", desc: "Pelanggan cukup mendekatkan ponsel yang mendukung NFC untuk membuka halaman tujuan." },
  { icon: QrCode, title: "Akses melalui QR Code", desc: "Pelanggan juga dapat memindai QR Code menggunakan kamera ponsel." },
  { icon: BarChart3, title: "Pantau performa kartu", desc: "Lihat jumlah tap, estimasi pengunjung unik, dan klik menuju Google Review." },
  { icon: Link2, title: "Pengelolaan tautan fleksibel", desc: "Perbarui tujuan tautan melalui dashboard tanpa perlu mengganti kartu fisik." },
  { icon: CalendarDays, title: "Analisis aktivitas", desc: "Tinjau aktivitas kartu berdasarkan rentang waktu yang tersedia." },
  { icon: MonitorSmartphone, title: "Dashboard responsif", desc: "Kelola kartu dengan nyaman melalui ponsel maupun komputer." },
  { icon: Settings2, title: "Kelola kartu dari satu tempat", desc: "Atur kartu dan tautan tujuan dari satu akun DiTapAja." },
  { icon: Check, title: "Tanpa biaya langganan bulanan", desc: "Akses dashboard sudah termasuk dalam pembelian kartu." },
];

function ProductArtwork({ tone }: { tone: string }) {
  const variant = tone === "blanc" ? "BLANC / WHITE" : tone === "signature" ? "SIGNATURE / CUSTOM" : "NOIR / BLACK";
  const cardTone = tone === "blanc" ? styles.blanc : tone === "signature" ? styles.signature : styles.noir;
  return (
    <div className={styles.art} role="img" aria-label={`Visualisasi kartu DiTapAja ${tone}`}>
      <div className={styles.orbit} />
      <div className={styles.artIndex}><span>DITAPAJA OBJECTS</span><b>01 — 03</b></div>
      <div className={`${styles.card} ${cardTone}`}>
        <div className={styles.cardTop}><span className={styles.brand}>DiTap<span>Aja.</span></span><span>{variant}</span></div>
        <div className={styles.cardCenter}>Make every<br /><em>tap count.</em></div>
        <div className={styles.cardBottom}><span>NFC + QR ENABLED</span><Nfc size={23} /></div>
      </div>
      <div className={styles.artFoot}><span>01 / PHYSICAL NFC REVIEW CARD</span><span>10 × 10 CM</span></div>
    </div>
  );
}

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = isProductSlug(slug) ? collection[slug] : undefined;
  if (!product) return <main className={styles.page}><SiteHeader /><section className={styles.hero}><div><span className={styles.eyebrow}>DITAPAJA / 404</span><h1 className={styles.title}>Produk tidak ditemukan.</h1><Link className={styles.primary} href="/koleksi">Kembali ke koleksi <ArrowUpRight size={16} /></Link></div></section></main>;

  const minimumQuantity = product.minimum;
  const minimumTotal = product.price * minimumQuantity;
  const orderUrl = "/pesan?product=" + slug;
  const orderLabel = product.mode === "preorder" ? "Mulai pre-order" : "Pesan sekarang";

  return (
    <main className={styles.page}>
      <SiteHeader />
      <section className={styles.hero}>
        <div className={styles.copy}>
          <Link href="/koleksi" className={styles.back}><ArrowLeft size={15} /> Kembali ke koleksi</Link>
          <div className={styles.eyebrow}>DITAPAJA / PRODUCT / {product.edition}</div>
          <h1 className={styles.title}>{product.name}</h1>
          <h2 className={styles.headline}>{product.headline}</h2>
          <div className={styles.description}><p>{product.description}</p><p>{product.detail}</p></div>
          <div className={styles.price}><strong>{formatProductPrice(product.price)}</strong><span>/ kartu</span>{product.mode === "preorder" && <small>Minimum {minimumQuantity} kartu · Total mulai {formatProductPrice(minimumTotal)}</small>}</div>
          <div className={styles.pills}><span><Nfc size={14} /> NFC</span><span><QrCode size={14} /> QR Code</span><span><Check size={14} /> Dashboard gratis</span></div>
          <Link className={styles.primary} href={orderUrl}>{orderLabel} <ArrowUpRight size={16} /></Link>
          <p className={styles.hint}>{product.mode === "preorder" ? "Diskusikan kebutuhan desain custom melalui WhatsApp." : "Isi detail pesanan, lalu lanjutkan konfirmasi melalui WhatsApp."}</p>
        </div>
        <ProductArtwork tone={product.color} />
      </section>

      <section className={styles.spec}>
        <div className={styles.inner}>
          <div className={styles.eyebrow}>PRODUCT SPECIFICATIONS</div>
          <h2 className={styles.sectionTitle}>Dibuat untuk penggunaan sehari-hari.</h2>
          <div className={styles.specGrid}>
            <div className={styles.specItem}><span>Material</span><b>PVC Card</b></div>
            <div className={styles.specItem}><span>Ukuran</span><b>10 × 10 cm</b></div>
            <div className={styles.specItem}><span>Teknologi</span><b>NFC</b></div>
            <div className={styles.specItem}><span>Akses alternatif</span><b>QR Code</b></div>
            <div className={styles.specItem}><span>Warna / desain</span><b>{product.edition.replace(" EDITION", "")}</b></div>
            <div className={styles.specItem}><span>Tujuan penggunaan</span><b>Google Review</b></div>
          </div>
          <p className={styles.fit}><b>Cocok untuk:</b> {product.fit}</p>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.eyebrow}>ONE CONNECTED ECOSYSTEM</div>
        <h2 className={styles.featureHeading}>Bukan hanya kartu.<br />Ada sistem di baliknya.</h2>
        <p className={styles.featureIntro}>Setiap kartu dilengkapi dashboard untuk mengelola tautan tujuan dan memantau interaksi pelanggan, tanpa biaya langganan bulanan.</p>
        <div className={styles.featureGrid}>{features.map(({ icon: Icon, title, desc }) => <article className={styles.feature} key={title}><span className={styles.featureIcon}><Icon size={19} /></span><h3>{title}</h3><p>{desc}</p></article>)}</div>
      </section>

      <section className={styles.order}>
        <div className={styles.orderInner}>
          <div><div className={styles.eyebrow}>YOUR NEXT STEP</div><h2 className={styles.orderTitle}>Let every interaction<br />lead somewhere.</h2><p className={styles.orderCopy}>{product.mode === "preorder" ? "Mulai dari minimum 10 kartu. Tim kami akan membantu membahas kebutuhan desain dan pemesananmu." : "Isi detail pesanan dan lanjutkan konfirmasi melalui WhatsApp. Dashboard monitoring sudah termasuk tanpa biaya bulanan."}</p></div>
          <Link className={styles.primary} href={orderUrl}>{orderLabel} <ArrowUpRight size={16} /></Link>
        </div>
      </section>
      <footer className={styles.footer}><Link href="/">© 2026 DiTapAja</Link><span>Satu sentuhan untuk lebih banyak ulasan.</span><Link href="/koleksi">Lihat koleksi ↗</Link></footer>
    </main>
  );
}
