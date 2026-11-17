import type { Metadata } from "next";
import InfoPage from "../components/info-page";
import ProductCarousel from "../components/product-carousel";
import Link from "next/link";
import { Check, Nfc, QrCode, BarChart3, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Koleksi Kartu NFC DiTapAja",
  description: "Pilih kartu NFC + QR DiTapAja untuk bisnis. Dashboard termasuk tanpa biaya bulanan.",
};

const products = [
  { name: "DiTapAja Noir", label: "01 / BLACK EDITION", description: "Karakter tegas untuk bisnis yang ingin tampil standout.", tone: "noir", price: "Rp50.000", order: "READY TO ORDER", action: "Beli Noir", mode: "buy" },
  { name: "DiTapAja Blanc", label: "02 / WHITE EDITION", description: "Minimal, bersih, dan mudah menyatu dengan identitas brand.", tone: "blanc", price: "Rp50.000", order: "READY TO ORDER", action: "Beli Blanc", mode: "buy" },
  { name: "DiTapAja Signature", label: "03 / CUSTOM EDITION", description: "Kartu dengan identitas visual bisnismu sendiri.", tone: "signature", price: "Rp60.000", order: "PRE-ORDER · MIN. 10 KARTU", action: "Pre-order", mode: "preorder" },
];

export default function KoleksiPage() {
  return (
    <InfoPage
      eyebrow="KOLEKSI / DITAPAJA"
      title={<>Pilih kartu untuk<br /><em>bisnismu.</em></>}
      lead="Temukan desain yang paling sesuai dengan karakter bisnismu. Setiap kartu menggabungkan NFC dan QR Code, lengkap dengan akses dashboard."
    >
      <div className="catalog-page-benefits">
        <div><Nfc size={18} /><span><b>NFC + QR</b><small>Dua cara akses</small></span></div>
        <div><BarChart3 size={18} /><span><b>Dashboard termasuk</b><small>Pantau aktivitas kartu</small></span></div>
        <div><Check size={18} /><span><b>Tanpa bulanan</b><small>Satu kali pembelian</small></span></div>
      </div>
      <ProductCarousel products={products} />
      <section className="catalog-compare" aria-labelledby="catalog-compare-title">
        <div className="catalog-compare-heading">
          <div>
            <span className="catalog-compare-eyebrow">PILIH SESUAI KEBUTUHAN</span>
            <h2 id="catalog-compare-title">Bandingkan setiap desain.</h2>
            <p>Fungsi utamanya sama. Pilih tampilan dan jumlah pembelian yang paling sesuai dengan bisnismu.</p>
          </div>
          <span className="catalog-compare-shared"><Check size={14}/> Dashboard tanpa biaya bulanan</span>
        </div>
        <div className="catalog-compare-grid">
          <article className="catalog-compare-card">
            <div className="catalog-compare-card-top"><span className="catalog-compare-swatch noir"/> <span>01 / BLACK EDITION</span></div>
            <h3>DiTapAja Noir</h3>
            <p className="catalog-compare-persona">Hitam elegan dan tegas untuk tampilan modern.</p>
            <div className="catalog-compare-price">Rp50.000 <small>/ kartu</small></div>
            <dl><div><dt>Minimum order</dt><dd>1 kartu</dd></div><div><dt>Karakter desain</dt><dd>Hitam · Elegan</dd></div><div><dt>Akses</dt><dd>NFC + QR Code</dd></div></dl>
            <Link href="/products/noir">Detail Noir <ArrowUpRight size={15}/></Link>
          </article>
          <article className="catalog-compare-card">
            <div className="catalog-compare-card-top"><span className="catalog-compare-swatch blanc"/> <span>02 / WHITE EDITION</span></div>
            <h3>DiTapAja Blanc</h3>
            <p className="catalog-compare-persona">Putih minimalis yang bersih dan timeless.</p>
            <div className="catalog-compare-price">Rp50.000 <small>/ kartu</small></div>
            <dl><div><dt>Minimum order</dt><dd>1 kartu</dd></div><div><dt>Karakter desain</dt><dd>Putih · Minimalis</dd></div><div><dt>Akses</dt><dd>NFC + QR Code</dd></div></dl>
            <Link href="/products/blanc">Detail Blanc <ArrowUpRight size={15}/></Link>
          </article>
          <article className="catalog-compare-card">
            <div className="catalog-compare-card-top"><span className="catalog-compare-swatch signature"/> <span>03 / CUSTOM EDITION</span></div>
            <h3>DiTapAja Signature</h3>
            <p className="catalog-compare-persona">Desain custom mengikuti identitas visual brand.</p>
            <div className="catalog-compare-price">Rp60.000 <small>/ kartu</small></div>
            <dl><div><dt>Minimum order</dt><dd>10 kartu</dd></div><div><dt>Karakter desain</dt><dd>Custom · Personal</dd></div><div><dt>Akses</dt><dd>NFC + QR Code</dd></div></dl>
            <Link href="/products/signature">Detail Signature <ArrowUpRight size={15}/></Link>
          </article>
        </div>
        <p className="catalog-compare-footnote">Semua pilihan mendapat akses dashboard yang sama. Perbedaan utama ada pada desain, harga, dan minimum pemesanan.</p>
      </section>
      <div className="catalog-page-note">
        <div><QrCode size={19} /><b>Semua yang kamu butuhkan dalam satu kartu.</b></div>
        <p>Noir dan Blanc dapat dipesan mulai satu kartu. DiTapAja Signature tersedia melalui pre-order dengan minimum 10 kartu. Semua pesanan dikonfirmasi melalui WhatsApp.</p>
      </div>
    </InfoPage>
  );
}
