import type { Metadata } from "next";
import InfoPage from "../components/info-page";
import { ArrowUpRight, CheckCircle2, Link2, Nfc, Smartphone, BarChart3, QrCode } from "lucide-react";

export const metadata: Metadata = {
  title: "Panduan Penggunaan — DiTapAja",
  description: "Panduan pemilik bisnis untuk menyiapkan kartu, mengatur link Google Review, menulis NFC, dan membaca analitik DiTapAja.",
};

const steps = [
  {icon: Smartphone, title:"Buat akun dan masuk", body:"Daftar menggunakan nama, email, dan password. Setelah masuk, kamu akan diarahkan ke dashboard."},
  {icon: Link2, title:"Tambahkan kartu", body:"Pilih Add New Card, beri nama kartu agar mudah dikenali, lalu masukkan URL Google Maps atau Google Review yang valid."},
  {icon: Nfc, title:"Tulis URL ke kartu NFC", body:"Di dashboard, pilih Tulis NFC pada kartu yang aktif. Gunakan Chrome di Android, aktifkan NFC, lalu dekatkan kartu saat browser memintanya."},
  {icon: QrCode, title:"Uji akses pelanggan", body:"Coba tap kartu dengan ponsel yang mendukung NFC. Kamu juga dapat menguji QR Code yang tercetak pada kartu fisik."},
  {icon: BarChart3, title:"Pantau hasilnya", body:"Buka bagian Analytics untuk melihat tap, pengunjung unik berbasis hash, klik Google Review, dan grafik aktivitas. Filter dapat dipilih berdasarkan kartu dan rentang 7, 30, atau 90 hari."},
];

export default function GuidePage() {
  return (
    <InfoPage
      eyebrow="PANDUAN / UNTUK PEMILIK BISNIS"
      title={<>Mulai dari sini.<br />Siap dalam beberapa langkah.</>}
      lead="Ikuti alur singkat ini untuk menyiapkan kartu DiTapAja dan mulai memantau aktivitasnya."
    >
      <div className="guide-page-steps">
        {steps.map(({icon: Icon, title, body}, index) => (
          <article key={title}>
            <div className="guide-step-index">0{index + 1}</div>
            <div className="guide-step-icon"><Icon size={23}/></div>
            <div><h2>{title}</h2><p>{body}</p></div>
            <CheckCircle2 className="guide-step-check" size={20}/>
          </article>
        ))}
      </div>
      <div className="guide-page-callout">
        <div><Nfc size={22}/><span>CATATAN NFC</span></div>
        <h2>Browser tidak mendukung Web NFC?</h2>
        <p>Penulisan NFC melalui dashboard membutuhkan browser dan perangkat yang kompatibel. Kamu tetap bisa memakai alat penulis NFC eksternal untuk menulis URL publik kartu. Jangan lupa uji hasilnya sebelum kartu diberikan kepada pelanggan.</p>
        <a href="/fitur">Pelajari semua fitur <ArrowUpRight size={16}/></a>
      </div>
    </InfoPage>
  );
}
