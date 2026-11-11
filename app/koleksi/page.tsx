import type { Metadata } from "next";
import InfoPage from "../components/info-page";
import ProductCarousel from "../components/product-carousel";
import { Check, Nfc, QrCode, BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Koleksi Kartu NFC DiTapAja",
  description: "Pilih kartu NFC + QR DiTapAja untuk bisnis. Dashboard termasuk tanpa biaya bulanan.",
};

const products = [
  { name: "DiTapAja Noir", label: "01 / BLACK EDITION", description: "Karakter tegas untuk bisnis yang ingin tampil standout.", tone: "noir", price: "Rp50.000", order: "READY TO ORDER", action: "Beli Noir", mode: "buy" },
  { name: "DiTapAja Blanc", label: "02 / WHITE EDITION", description: "Minimal, bersih, dan mudah menyatu dengan identitas brand.", tone: "blanc", price: "Rp50.000", before: "Rp60.000", discount: "SAVE 17%", order: "READY TO ORDER", action: "Beli Blanc", mode: "buy" },
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
      <div className="catalog-page-note">
        <div><QrCode size={19} /><b>Semua yang kamu butuhkan dalam satu kartu.</b></div>
        <p>Noir dan Blanc tersedia untuk pembelian langsung melalui Shopee. Untuk desain Signature, pemesanan dilakukan melalui WhatsApp dengan minimum 10 kartu.</p>
      </div>
    </InfoPage>
  );
}
