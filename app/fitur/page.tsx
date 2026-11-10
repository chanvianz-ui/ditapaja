import type { Metadata } from "next";
import InfoPage from "../components/info-page";
import { Activity, BarChart3, CheckCircle2, Link2, Nfc, QrCode, ShieldCheck, SlidersHorizontal, Smartphone, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Fitur DiTapAja — Kelola NFC Review Card",
  description: "Kenali fitur NFC Review Card DiTapAja: pengelolaan kartu, link Google Review, penulisan NFC, dan analitik aktivitas.",
};

const features = [
  { icon: Link2, number: "01", title: "Kelola tujuan link", text: "Atur dan perbarui URL Google Maps atau Google Review dari dashboard. Jika tujuan berubah, kamu tidak perlu mengganti URL kartu selama kartu masih aktif." },
  { icon: BarChart3, number: "02", title: "Pantau aktivitas", text: "Lihat total tap, estimasi pengunjung unik berbasis identitas hash, klik menuju Google Review, dan rasio klik dari aktivitas yang tercatat." },
  { icon: Nfc, number: "03", title: "Tulis NFC dari dashboard", text: "Untuk perangkat yang mendukung Web NFC, tulis URL kartu DiTapAja langsung ke kartu NFC melalui browser yang kompatibel." },
  { icon: QrCode, number: "04", title: "NFC dan QR sebagai akses", text: "Pelanggan dapat mendekatkan ponsel yang mendukung NFC atau memindai QR Code yang tersedia pada kartu fisik." },
  { icon: SlidersHorizontal, number: "05", title: "Atur status kartu", text: "Ubah nama kartu, perbarui link tujuan, aktifkan atau nonaktifkan kartu, dan hapus kartu yang tidak lagi digunakan." },
  { icon: ShieldCheck, number: "06", title: "Akun dan kontrol akses", text: "Setiap pengguna mengelola kartu miliknya melalui akun. Informasi dan aktivitas kartu ditampilkan di workspace masing-masing." },
];

export default function FeaturesPage() {
  return (
    <InfoPage
      eyebrow="FITUR / DITAPAJA"
      title={<>Sederhana untuk pelanggan.<br />Lengkap untuk bisnismu.</>}
      lead="Semua yang dibutuhkan untuk menghubungkan pelanggan ke halaman review dan mengelola kartu NFC, tanpa dashboard yang terasa rumit."
    >
      <div className="feature-page-intro">
        <div><span>ONE CARD</span><strong>NFC + QR</strong><small>Satu kartu, dua cara akses</small></div>
        <div><span>ONE WORKSPACE</span><strong>Dashboard</strong><small>Kelola kartu dan aktivitas</small></div>
        <div><span>ONE-TIME PURCHASE</span><strong>Tanpa bulanan</strong><small>Dashboard termasuk pembelian</small></div>
      </div>
      <div className="feature-page-grid">
        {features.map(({icon: Icon, number, title, text}) => (
          <article key={number}>
            <div className="feature-page-card-top"><span>{number} / FEATURE</span><Icon size={22}/></div>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <div className="feature-page-note">
        <div><Zap size={21}/><span>CATATAN KOMPATIBILITAS</span></div>
        <h2>Penulisan NFC paling mudah lewat Android.</h2>
        <p>Fitur tulis NFC menggunakan Web NFC. Gunakan Chrome di Android dengan NFC aktif dan berikan izin saat diminta. Jika browser atau perangkat tidak mendukung Web NFC, kamu tetap dapat menyiapkan kartu menggunakan alat penulis NFC terpisah.</p>
        <a href="/panduan">Lihat panduan penggunaan <span>↗</span></a>
      </div>
    </InfoPage>
  );
}
