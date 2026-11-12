# DiTapAja — Migrasi Cloudflare Workers

Status: persiapan migrasi, belum ada deployment Cloudflare dan belum ada perubahan DNS.

## Baseline

- Source branch asal: `feature/customer-payment-proof`
- Baseline commit: `3ca12f47eb3cbfac2b4b2daf8b573d80210249de`
- Migrasi dikerjakan terpisah pada `migrate/cloudflare-workers`.
- Production Vercel tetap berjalan sebagai fallback.
- Supabase Production dan Staging tetap menjadi database terpisah; tidak ada migrasi database.

## Arsitektur target

- Next.js App Router dipertahankan.
- Vinext menjalankan aplikasi Next.js di Vite dan Cloudflare Workers.
- Supabase tetap dipakai untuk Auth, Postgres, Storage, dan RLS.
- Deployment awal memakai alamat `workers.dev`; domain khusus belum dipindah.
- Secret Supabase hanya disimpan sebagai Worker runtime secrets, tidak di-commit atau dicetak ke log.

## Urutan kerja

1. Jalankan `npx vinext check` terhadap kode aplikasi dan tinjau inkompatibilitas yang dilaporkan.
2. Jalankan `vinext init` secara non-destruktif setelah hasil compatibility check ditinjau. Untuk project ini, kandidat awal tanpa ISR/cache custom adalah `--cdn-cache=none --data-cache=none`; pilihan optimasi gambar perlu dikonfirmasi dari pemakaian `next/image`.
3. Review seluruh berkas yang dibuat/diubah oleh initializer. Pastikan `next dev`, typecheck, dan build Next.js lama tetap berfungsi.
4. Jalankan `npm run dev:vinext`, `npm run build:vinext`, dan `npm run start:vinext`; uji halaman publik, login/register, dashboard NFC, analytics, pesanan, upload bukti pembayaran, dan admin.
5. Buat Worker non-production dan pasang runtime variables/secrets untuk Supabase Staging. Jangan gunakan kredensial Production saat tes.
6. Integrasikan GitHub melalui Workers Builds, verifikasi Preview build, lalu uji seluruh alur dari browser sampai Supabase Staging.
7. Setelah stabil, baru rencanakan perpindahan DNS/domain dengan TTL rendah dan jalur rollback ke Vercel.

## Environment yang perlu disiapkan

Build-time public values (khusus build Preview):
- `NEXT_PUBLIC_SUPABASE_URL` → URL Supabase Staging
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon/publishable key Supabase Staging

Worker runtime values/secrets (khusus Staging):
- `SUPABASE_SECRET_KEY` → Supabase Staging secret key (secret)
- `ADMIN_USER_ID` → UID admin akun Staging

Catatan:
- Environment Workers Builds hanya tersedia pada saat build; runtime secrets/variables harus disetel di Worker settings.
- Jangan menyalin secret Vercel Production ke Worker uji.
- Nilai `NEXT_PUBLIC_*` tertanam saat build. Buat build preview dengan URL/key Staging.
- Jangan pernah menambahkan file `.env` atau nilai secret ke Git.

## Hambatan integrasi yang diketahui

- Akun Cloudflare tersambung, tetapi belum ada Worker terdaftar.
- Belum ada Workers Build Token di akun.
- GitHub App Cloudflare belum terlihat terhubung/diotorisasi untuk repository ini.
- Zona DNS `ditapaja.web.id` belum terdaftar pada akun Cloudflare yang tersambung.
- Sampai semua pemeriksaan lulus, jangan tambahkan custom domain, jangan ganti nameserver, dan jangan matikan Vercel.
