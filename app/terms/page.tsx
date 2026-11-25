"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="dt-legal-v2">
      <article className="dt-legal-v2-card">
        <Link href="/register" className="dt-legal-v2-back">← Kembali ke pendaftaran</Link>
        <p className="dt-legal-eyebrow">DITAPAJA · LEGAL</p>
        <h1>Syarat &amp; Ketentuan</h1>
        <p className="dt-legal-updated">Terakhir diperbarui: 25 November 2026</p>
        <p>Dengan membuat akun atau menggunakan layanan DiTapAja, kamu menyetujui ketentuan berikut. Jika tidak setuju, jangan gunakan layanan ini.</p>
        <h2>1. Tentang layanan</h2>
        <p>DiTapAja menyediakan produk kartu NFC dan dashboard untuk membantu pengguna mengelola tautan tujuan serta pengalaman pelanggan. Fitur dapat berubah, ditingkatkan, atau dihentikan sesuai kebutuhan operasional.</p>
        <h2>2. Akun dan keamanan</h2>
        <p>Kamu wajib memberikan informasi yang akurat, menjaga kerahasiaan kredensial, dan bertanggung jawab atas aktivitas melalui akunmu. Beri tahu pengelola layanan jika mengetahui akses tanpa izin. Jangan membagikan akun atau menggunakan identitas orang lain tanpa hak.</p>
        <h2>3. Penggunaan yang diperbolehkan</h2>
        <p>Kamu tidak boleh menggunakan layanan untuk aktivitas ilegal, penipuan, spam, pelanggaran hak pihak lain, atau menyebarkan konten berbahaya. Kamu bertanggung jawab atas konten, tautan, dan tujuan URL yang dipasang pada kartu.</p>
        <h2>4. Produk, pesanan, dan pembayaran</h2>
        <p>Informasi produk, harga, ketersediaan, dan pesanan ditampilkan pada halaman pemesanan. Pesanan diproses berdasarkan informasi yang dikirimkan pengguna. Status pembayaran dapat memerlukan verifikasi manual. Jangan menganggap pesanan lunas sebelum statusnya dikonfirmasi oleh DiTapAja.</p>
        <h2>5. Ketersediaan layanan</h2>
        <p>Kami berupaya menjaga layanan tetap tersedia, tetapi tidak menjamin akses tanpa gangguan. Pemeliharaan, gangguan jaringan, atau layanan pihak ketiga dapat memengaruhi ketersediaan.</p>
        <h2>6. Pembatasan dan penghentian</h2>
        <p>DiTapAja dapat membatasi atau menangguhkan akses jika terdapat dugaan penyalahgunaan, pelanggaran ketentuan, risiko keamanan, atau kewajiban hukum.</p>
        <h2>7. Perubahan ketentuan</h2>
        <p>Ketentuan dapat diperbarui dari waktu ke waktu. Versi terbaru akan ditampilkan pada halaman ini. Penggunaan layanan setelah perubahan berlaku berarti kamu menerima ketentuan yang diperbarui.</p>
        <h2>8. Kontak</h2>
        <p>Untuk pertanyaan terkait ketentuan ini, hubungi pengelola melalui kanal kontak resmi DiTapAja yang tersedia pada situs.</p>
        <div className="dt-legal-links"><Link href="/privacy">Baca Kebijakan Privasi</Link><Link href="/register">Kembali daftar</Link></div>
      </article>
    </main>
  );
}
