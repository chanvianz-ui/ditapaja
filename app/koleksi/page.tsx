import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, BarChart3, Check, Nfc, QrCode, ShieldCheck } from "lucide-react";
import SiteHeader from "../components/site-header";
import ProductCarousel from "../components/product-carousel";
import { PRODUCT_LIST } from "../lib/product-catalog";
import styles from "./catalog-redesign.module.css";

export const metadata: Metadata = {
  title: "Koleksi Kartu NFC DiTapAja",
  description: "Pilih kartu NFC + QR DiTapAja untuk bisnismu. Termasuk dashboard monitoring tanpa biaya bulanan.",
  alternates: { canonical: "/koleksi" },
};

const products = PRODUCT_LIST;

export default function KoleksiPage() {
  return (
    <main className={styles.page}>
      <SiteHeader />
      <section className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.copy}>
            <div className={styles.kicker}><i /> NFC REVIEW CARD <span className={styles.index}>DITAPAJA / 02</span></div>
            <h1 className={styles.title}>A better way<br /><em>to be remembered.</em></h1>
            <p className={styles.lead}>Kartu NFC dan QR yang membantu pelanggan membuka halaman review bisnismu dalam satu langkah. Pilih desain, atur tujuan, lalu pantau interaksinya dari satu dashboard.</p>
            <div className={styles.actions}>
              <a href="#catalog-products" className={styles.primary}>Jelajahi koleksi <ArrowDown size={16} /></a>
              <Link href="/cara-kerja" className={styles.secondary}>Pelajari cara kerja <ArrowUpRight size={15} /></Link>
            </div>
          </div>
          <div className={styles.visual} role="img" aria-label="Visual kartu NFC DiTapAja Noir">
            <div className={styles.visualAura} />
            <div className={styles.card}>
              <div className={styles.cardTop}><span className={styles.brand}>DiTap<span>Aja.</span></span><span>SMART REVIEW OBJECT</span></div>
              <div className={styles.cardCenter}>Make it<br /><em>count.</em></div>
              <div className={styles.cardBottom}><span>NFC + QR / NOIR 001</span><Nfc className={styles.nfc} size={24} /></div>
            </div>
            <div className={styles.visualLabel}><QrCode size={16} /> NFC + QR READY</div>
            <span className={styles.visualFoot}>01 / PHYSICAL REVIEW CARD</span>
          </div>
        </div>
      </section>

      <section className={styles.trust} aria-label="Keunggulan DiTapAja">
        <div className={styles.trustItem}><span className={styles.trustIcon}><Nfc size={18} /></span><p><b>Tap atau scan</b><small>NFC dan QR dalam satu kartu</small></p></div>
        <div className={styles.trustItem}><span className={styles.trustIcon}><BarChart3 size={18} /></span><p><b>Dashboard gratis</b><small>Pantau aktivitas kartu kapan saja</small></p></div>
        <div className={styles.trustItem}><span className={styles.trustIcon}><ShieldCheck size={18} /></span><p><b>Tanpa biaya bulanan</b><small>Satu kali pembelian, tanpa langganan</small></p></div>
      </section>

      <section className={styles.catalog} id="catalog-products">
        <div className={styles.catalogHead}>
          <div><span className={styles.catalogEyebrow}>01 / THE COLLECTION</span><h2 className={styles.catalogTitle}>Choose your<br /><em>signature.</em></h2></div>
          <p className={styles.catalogDescription}>Setiap desain punya karakter berbeda, tetapi semuanya membawa fungsi yang sama: akses NFC, QR Code, dan dashboard monitoring tanpa biaya langganan.</p>
        </div>
        <div className={styles.carousel}><ProductCarousel products={products} /></div>
      </section>

      <section className={styles.bottomCta}>
        <div className={styles.bottomInner}>
          <div className={styles.bottomCopy}><small>DITAPAJA / YOUR NEXT STEP</small><h2>Make every tap<br />count.</h2><p>Masih mempertimbangkan desain yang tepat? Lihat cara kerja DiTapAja atau diskusikan kebutuhan bisnismu bersama tim kami.</p></div>
          <div className={styles.bottomAction}><Link href="/cara-kerja" className={styles.primary}>Lihat cara kerja <ArrowUpRight size={16} /></Link></div>
        </div>
      </section>

      <footer className={styles.footer}><div className={styles.footerInner}><span>© 2026 DiTapAja. Hak cipta dilindungi.</span><span>NFC + QR CODE · DASHBOARD GRATIS</span><Link href="/">Kembali ke beranda ↗</Link></div></footer>
    </main>
  );
}
