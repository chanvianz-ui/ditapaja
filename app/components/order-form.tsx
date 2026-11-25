"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, CreditCard, FileImage, LockKeyhole, MessageCircle, Minus, Plus, ShieldCheck, Upload } from "lucide-react";
import Link from "next/link";
import SiteHeader from "./site-header";

const products = {
  noir: { name: "DiTapAja Noir", price: 50000, minimum: 1, type: "Regular" },
  blanc: { name: "DiTapAja Blanc", price: 50000, minimum: 1, type: "Regular" },
  signature: { name: "DiTapAja Signature", price: 60000, minimum: 10, type: "Custom · Pre-order" },
} as const;
type ProductKey = keyof typeof products;

const accounts = [
  { bank: "BCA", number: "5771660178", owner: "Chandra Irawan" },
  { bank: "BNI", number: "2106676984", owner: "Chandra Irawan" },
];

export default function OrderForm({ initialProduct = "signature" }: { initialProduct?: string }) {
  const safeInitial = Object.prototype.hasOwnProperty.call(products, initialProduct) ? initialProduct as ProductKey : "signature";
  const [productKey, setProductKey] = useState<ProductKey>(safeInitial);
  const [quantity, setQuantity] = useState<number>(products[safeInitial].minimum);
  const [business, setBusiness] = useState("");
  const [customer, setCustomer] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [orderId, setOrderId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const product = products[productKey];
  const total = useMemo(() => product.price * quantity, [product.price, quantity]);
  const money = (value: number) => "Rp" + value.toLocaleString("id-ID");

  function changeProduct(value: string) {
    const next = value as ProductKey;
    setProductKey(next);
    setQuantity(products[next].minimum);
  }

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const digits = phone.replace(/\\D/g, "");
    const normalizedPhone = digits.startsWith("0") ? "62" + digits.slice(1) : digits.startsWith("8") ? "62" + digits : digits;
    if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
      setError("Masukkan nomor WhatsApp yang valid.");
      return;
    }
    if (website.trim()) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer, email, business, phone: normalizedPhone, destination, product: product.name, quantity, notes, website }),
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.orderId) throw new Error(result.error || "Pesanan gagal dibuat.");
      setOrderId(result.orderId);
      setNotice("Pesanan berhasil dibuat. Silakan transfer sesuai total, lalu unggah bukti pembayaran.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat membuat pesanan.");
    } finally {
      setSending(false);
    }
  }

  async function submitProof() {
    if (!orderId || !selectedFile) {
      setError("Pilih file bukti transfer terlebih dahulu.");
      return;
    }
    const whatsappWindow = window.open("about:blank", "_blank");
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.set("orderId", orderId);
      form.set("email", email.trim().toLowerCase());
      form.set("paymentMethod", "bank_transfer");
      form.set("paymentReference", paymentReference.trim());
      form.set("file", selectedFile);
      const response = await fetch("/api/orders/payment-proof", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Bukti transfer gagal dikirim.");

      const normalizedPhone = phone.replace(/\\D/g, "").replace(/^0/, "62");
      const message = [
        "Halo DiTapAja, saya sudah melakukan pemesanan dan mengirim bukti transfer melalui website.",
        "",
        "KONFIRMASI PESANAN",
        "Nomor pesanan: " + orderId,
        "Nama: " + customer,
        "Bisnis: " + business,
        "Produk: " + product.name,
        "Jumlah: " + quantity + " kartu",
        "Total transfer: " + money(total),
        "Metode: Transfer bank",
        "Referensi transfer: " + (paymentReference.trim() || "-"),
        "Email: " + email,
        "WhatsApp: +" + normalizedPhone,
        "",
        "Bukti transfer sudah diunggah melalui website. Mohon konfirmasi penerimaan dan verifikasi pembayaran saya. Terima kasih."
      ].join("\\n");
      const url = "https://wa.me/6281321778081?text=" + encodeURIComponent(message);
      if (whatsappWindow) { whatsappWindow.opener = null; whatsappWindow.location.href = url; }
      else window.location.href = url;
      setNotice("Bukti transfer berhasil dikirim. Status pembayaran menunggu verifikasi tim DiTapAja.");
      setShowAccountPrompt(true);
    } catch (err) {
      if (whatsappWindow) whatsappWindow.close();
      setError(err instanceof Error ? err.message : "Bukti transfer gagal dikirim.");
    } finally {
      setUploading(false);
    }
  }

  async function copyNumber(number: string) {
    try { await navigator.clipboard.writeText(number); setNotice("Nomor rekening berhasil disalin."); }
    catch { setNotice("Salin nomor rekening secara manual."); }
  }

  return (
    <main className="order-page dt-order-checkout dt-order-payment-flow">
      <SiteHeader />
      <header className="order-header">
        <Link href="/" className="order-brand"><span className="order-brand-mark">D</span>DiTap<span>Aja</span></Link>
        <Link href="/koleksi" className="order-back"><ArrowLeft size={15}/> Kembali ke koleksi</Link>
      </header>

      <div className="order-layout">
        <section className="order-intro dt-order-intro">
          <span className="order-kicker"><i/> PEMESANAN DITAPAJA</span>
          <h1>Pesan kartu.<br/><em>Bayar dengan mudah.</em></h1>
          <p>Selesaikan pemesanan langsung di website. Unggah bukti transfer, lalu konfirmasi pesanan melalui WhatsApp.</p>
          <div className="order-assurance"><span><ShieldCheck size={17}/></span><div><b>Pembayaran diverifikasi manual</b><small>Bukti transfer tersimpan secara privat. Status lunas hanya diberikan setelah tim kami memeriksa pembayaran.</small></div></div>
          <div className="order-mini-note"><Check size={14}/> NFC + QR Code dalam satu kartu</div>
          <div className="order-mini-note"><Check size={14}/> Dashboard termasuk tanpa biaya bulanan</div>
          <div className="dt-order-steps"><span className={!orderId ? "is-active" : "is-done"}>01 <small>Data pesanan</small></span><i/><span className={orderId ? "is-active" : ""}>02 <small>Pembayaran</small></span><i/><span className={showAccountPrompt ? "is-done" : ""}>03 <small>Konfirmasi</small></span></div>
        </section>

        <section className="order-form dt-order-form">
          {!orderId ? (
            <form onSubmit={createOrder}>
              <div className="order-form-heading"><div><span>01 / CHECKOUT</span><h2>Detail pesanan</h2></div><small>* Wajib diisi</small></div>
              <label aria-hidden="true" className="pointer-events-none absolute -left-[10000px] top-auto h-px w-px overflow-hidden">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label>
              <label className="order-field">Pilih kartu
                <select value={productKey} onChange={e=>changeProduct(e.target.value)}>
                  <option value="noir">DiTapAja Noir — Rp50.000 / kartu</option>
                  <option value="blanc">DiTapAja Blanc — Rp50.000 / kartu</option>
                  <option value="signature">DiTapAja Signature — Rp60.000 / kartu</option>
                </select>
              </label>
              <div className="order-product-summary"><span>{product.type}</span><b>{product.name}</b><small>{product.minimum > 1 ? "Minimum 10 kartu untuk desain custom." : "Minimum 1 kartu."}</small></div>
              <div className="order-quantity-row"><div><b>Jumlah kartu</b><small>Minimum {product.minimum} kartu</small></div><div className="order-quantity"><button type="button" aria-label="Kurangi jumlah" disabled={quantity<=product.minimum} onClick={()=>setQuantity(v=>Math.max(product.minimum,v-1))}><Minus size={15}/></button><output>{quantity}</output><button type="button" aria-label="Tambah jumlah" disabled={quantity>=1000} onClick={()=>setQuantity(v=>Math.min(1000,v+1))}><Plus size={15}/></button></div></div>
              <div className="order-total dt-order-total"><span>Subtotal produk</span><b>{money(total)}</b><small>Ongkos kirim akan dikonfirmasi oleh tim DiTapAja.</small></div>
              <div className="order-form-heading order-customer-heading"><div><span>02 / INFORMASI CUSTOMER</span><h2>Data pemesan & pengiriman</h2></div></div>
              <div className="order-fields-grid">
                <label className="order-field">Nama bisnis<input required maxLength={120} autoComplete="organization" value={business} onChange={e=>setBusiness(e.target.value)} placeholder="Nama bisnis"/></label>
                <label className="order-field">Nama lengkap<input required maxLength={100} autoComplete="name" value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="Nama pemesan"/></label>
                <label className="order-field">Email aktif<input required type="email" autoComplete="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value.trimStart())} placeholder="nama@email.com"/><small className="order-field-hint">Gunakan email yang sama saat mendaftar untuk melihat riwayat order.</small></label>
                <label className="order-field">Nomor WhatsApp<input required type="tel" inputMode="tel" autoComplete="tel" maxLength={24} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="08xxxxxxxxxx"/></label>
                <label className="order-field">Alamat pengiriman<input required maxLength={250} autoComplete="shipping street-address" value={destination} onChange={e=>setDestination(e.target.value)} placeholder="Alamat lengkap, kota, provinsi"/></label>
              </div>
              <label className="order-field order-notes-field">Catatan tambahan <textarea value={notes} onChange={e=>setNotes(e.target.value)} maxLength={1000} rows={3} placeholder="Logo, warna brand, atau kebutuhan custom."/></label>
              {error && <p role="alert" className="dt-order-error">{error}</p>}
              <button className="order-submit" type="submit" disabled={sending}>{sending ? "Membuat pesanan..." : "Buat pesanan & lanjut pembayaran"} <ArrowRight size={16}/></button>
              <p className="order-privacy-note"><LockKeyhole size={12}/> Tidak perlu login untuk melakukan pemesanan.</p>
            </form>
          ) : (
            <div className="dt-payment-step">
              <div className="order-form-heading"><div><span>02 / PEMBAYARAN</span><h2>Transfer pembayaran</h2></div><span className="dt-order-status">ORDER DIBUAT</span></div>
              <div className="dt-order-reference"><small>Nomor pesanan</small><strong>{orderId}</strong><button type="button" onClick={()=>void copyNumber(orderId)} aria-label="Salin nomor pesanan"><Copy size={15}/></button></div>
              <p className="dt-payment-intro">Transfer sesuai subtotal berikut ke salah satu rekening DiTapAja. Pastikan nominal transfer sesuai.</p>
              <div className="dt-bank-list">
                {accounts.map(account=><article key={account.bank} className="dt-bank-card"><div className="dt-bank-head"><b>{account.bank}</b><span>TRANSFER BANK</span></div><strong>{account.number}</strong><p>a.n. {account.owner}</p><button type="button" onClick={()=>void copyNumber(account.number)}><Copy size={13}/> Salin nomor rekening</button></article>)}
              </div>
              <div className="dt-payment-total"><span>Total transfer</span><strong>{money(total)}</strong><small>Belum termasuk ongkos kirim. Jika ada penyesuaian ongkir, tim kami akan menghubungi melalui WhatsApp.</small></div>
              <div className="dt-proof-upload">
                <div><span>03 / KONFIRMASI PEMBAYARAN</span><h3>Unggah bukti transfer</h3><p>Gunakan screenshot atau foto bukti transfer yang menampilkan nominal, tanggal, dan status transaksi.</p></div>
                <label className="dt-proof-file"><FileImage size={18}/><span>{selectedFile ? selectedFile.name : "Pilih file bukti transfer"}</span><small>JPG, PNG, WEBP, PDF · Maks. 5 MB</small><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setSelectedFile(e.target.files?.[0] || null)}/></label>
                <label className="order-field">Nomor referensi / berita transfer <span className="font-normal text-slate-400">(opsional)</span><input maxLength={120} value={paymentReference} onChange={e=>setPaymentReference(e.target.value)} placeholder="Nomor referensi transaksi"/></label>
                {error && <p role="alert" className="dt-order-error">{error}</p>}
                <button type="button" className="order-submit" onClick={()=>void submitProof()} disabled={uploading || !selectedFile}>{uploading ? "Mengirim bukti pembayaran..." : "Kirim bukti & konfirmasi via WhatsApp"} <MessageCircle size={16}/></button>
                <p className="order-privacy-note"><ShieldCheck size={12}/> Bukti pembayaran disimpan secara privat dan diperiksa manual oleh admin.</p>
              </div>
            </div>
          )}
          {notice && <p role="status" className="dt-order-notice">{notice}</p>}
        </section>
      </div>
      <footer className="order-footer"><span>© 2026 DiTapAja</span><span>Make every customer interaction count.</span></footer>

      {showAccountPrompt && <div className="fixed inset-0 z-[100] dt-order-account-overlay flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-labelledby="order-account-title"><div><Check size={27}/></div><p>PAYMENT SUBMITTED</p><h2 id="order-account-title">Bukti pembayaran diterima</h2><p>Tim DiTapAja akan memeriksa pembayaran secara manual. Masuk atau daftar menggunakan email <b>{email}</b> untuk memantau status transaksi dan riwayat pesanan.</p><div><Link href={"/login?next="+encodeURIComponent("/pesanan")}>Masuk</Link><Link href={"/register?next="+encodeURIComponent("/pesanan")}>Daftar akun</Link></div><button type="button" onClick={()=>setShowAccountPrompt(false)}>Nanti saja</button></section></div>}
    </main>
  );
}
