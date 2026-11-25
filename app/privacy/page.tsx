"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="dt-legal-page">
      <article className="dt-legal-card">
        <Link href="/register" className="dt-legal-back">← Kembali ke pendaftaran</Link>
        <p className="dt-legal-eyebrow">DITAPAJA · LEGAL</p>
        <h1>Kebijakan Privasi</h1>
        <p className="dt-legal-updated">Terakhir diperbarui: 25 November 2026</p>
        <p>Kebijakan ini menjelaskan data yang dapat diproses ketika kamu menggunakan DiTapAja. Kami berupaya membatasi data pada hal yang diperlukan untuk menjalankan layanan.</p>
        <h2>1. Data yang diproses</h2>
        <p>Data akun seperti nama, alamat email, dan informasi autentikasi; data penggunaan dashboard dan kartu; serta informasi pesanan dan komunikasi yang kamu kirimkan. Informasi pembayaran yang dikirimkan untuk verifikasi hanya digunakan sesuai kebutuhan pemrosesan pesanan.</p>
        <h2>2. Tujuan penggunaan</h2>
        <p>Data digunakan untuk membuat dan mengamankan akun, menyediakan dashboard dan fitur kartu NFC, mengelola pesanan, memverifikasi pembayaran, memberikan dukungan, mencegah penyalahgunaan, serta memenuhi kewajiban hukum yang berlaku.</p>
        <h2>3. Penyedia layanan</h2>
        <p>DiTapAja dapat menggunakan penyedia infrastruktur dan layanan pihak ketiga untuk hosting, database, autentikasi, dan operasional. Data yang diperlukan dapat diproses oleh penyedia tersebut sesuai fungsi layanannya dan kebijakan privasi masing-masing.</p>
        <h2>4. Penyimpanan dan keamanan</h2>
        <p>Kami menerapkan langkah teknis dan organisasi yang wajar untuk melindungi data. Tidak ada sistem yang dapat dijamin 100% aman. Lama penyimpanan bergantung pada kebutuhan layanan, keamanan, penyelesaian pesanan, dan kewajiban hukum.</p>
        <h2>5. Cookie dan penyimpanan lokal</h2>
        <p>Aplikasi dapat menggunakan penyimpanan browser untuk menjaga sesi login dan preferensi autentikasi. Jika memilih “Ingat saya selama 7 hari”, sesi pada perangkat tersebut disimpan secara persisten dengan batas waktu tujuh hari. Jika tidak dipilih, sesi mengikuti masa hidup tab atau browser.</p>
        <h2>6. Hak dan pilihan pengguna</h2>
        <p>Kamu dapat memperbarui informasi akun melalui fitur yang tersedia atau menghubungi pengelola untuk meminta bantuan terkait data. Penghapusan data dapat dibatasi apabila data masih diperlukan untuk keamanan, transaksi, atau kewajiban hukum.</p>
        <h2>7. Perubahan kebijakan</h2>
        <p>Kebijakan ini dapat diperbarui. Perubahan akan dipublikasikan pada halaman ini beserta tanggal pembaruannya.</p>
        <h2>8. Kontak</h2>
        <p>Untuk pertanyaan atau permintaan terkait privasi, hubungi pengelola melalui kanal kontak resmi DiTapAja yang tersedia pada situs.</p>
        <div className="dt-legal-links"><Link href="/terms">Baca Syarat &amp; Ketentuan</Link><Link href="/register">Kembali daftar</Link></div>
      </article>
      <style jsx>{`
        .dt-legal-page{min-height:100svh;padding:40px 18px;background:#071426;color:#edf7fb;font-family:Arial,sans-serif}
        .dt-legal-card{width:min(100%,780px);margin:0 auto;padding:clamp(24px,5vw,54px);border:1px solid rgba(170,205,222,.15);border-radius:18px;background:#0d2038}
        .dt-legal-back,.dt-legal-links a{color:#64d8ef;text-decoration:none;font-size:12px;font-weight:700}
        .dt-legal-eyebrow{margin:36px 0 10px;color:#a8f0d5;font-size:10px;font-weight:800;letter-spacing:.18em}
        h1{margin:0;font-size:clamp(32px,6vw,48px);letter-spacing:-.06em}h2{margin:30px 0 8px;font-size:16px;color:#d9f4ed}
        p{color:#a8bac8;font-size:13px;line-height:1.9}.dt-legal-updated{font-size:11px;color:#71899c}
        .dt-legal-links{display:flex;flex-wrap:wrap;gap:20px;margin-top:35px;padding-top:20px;border-top:1px solid rgba(170,205,222,.12)}
      `}</style>
    </main>
  );
}
