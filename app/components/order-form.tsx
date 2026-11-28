"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, FileImage, LockKeyhole, MessageCircle, Minus, Plus, ShieldCheck, Sparkles, PackageCheck, CreditCard, Truck } from "lucide-react";
import Link from "next/link";
import SiteHeader from "./site-header";
import { PRODUCTS, formatProductPrice, isProductSlug, type ProductSlug } from "../lib/product-catalog";

const products = PRODUCTS;
const accounts = [
  { bank: "BCA", number: "5771660178", owner: "Chandra Irawan" },
  { bank: "BNI", number: "2106676984", owner: "Chandra Irawan" },
];

export default function OrderForm({ initialProduct = "signature" }: { initialProduct?: string }) {
  const safeInitial: ProductSlug = isProductSlug(initialProduct) ? initialProduct : "signature";
  const [productKey, setProductKey] = useState<ProductSlug>(safeInitial);
  const [quantity, setQuantity] = useState<number>(products[safeInitial].minimum);
  const [business, setBusiness] = useState("");
  const [customer, setCustomer] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [orderId, setOrderId] = useState("");
  const [uploadToken, setUploadToken] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const product = products[productKey];
  const total = useMemo(() => product.price * quantity, [product.price, quantity]);
  const money = formatProductPrice;

  function changeProduct(value: string) {
    if (!isProductSlug(value)) return;
    setProductKey(value);
    setQuantity(products[value].minimum);
  }

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const digits = phone.replace(/\D/g, "");
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
      if (typeof result.uploadToken !== "string") throw new Error("Token upload pesanan tidak diterima. Hubungi DiTapAja.");
      setOrderId(result.orderId);
      setUploadToken(result.uploadToken);
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
      form.set("uploadToken", uploadToken);
      form.set("paymentMethod", "bank_transfer");
      form.set("paymentReference", paymentReference.trim());
      form.set("file", selectedFile);
      const response = await fetch("/api/orders/payment-proof", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Bukti transfer gagal dikirim.");

      const digits = phone.replace(/\D/g, "");
      const normalizedPhone = digits.startsWith("0") ? "62" + digits.slice(1) : digits.startsWith("8") ? "62" + digits : digits;
      const message = [
        "Halo tim DiTapAja, saya ingin mengonfirmasi pesanan dan pembayaran saya.",
        "",
        "*KONFIRMASI PESANAN*",
        "No. pesanan: " + orderId,
        "Nama: " + customer.trim(),
        "Bisnis: " + business.trim(),
        "Produk: " + product.name,
        "Jumlah: " + quantity + " kartu",
        "Total: *" + money(total) + "*",
        "Pembayaran: Transfer bank",
        ...(paymentReference.trim() ? ["Referensi transfer: " + paymentReference.trim()] : []),
        "Email akun: " + email.trim(),
        "",
        "Bukti transfer sudah saya unggah melalui website. Mohon bantu cek dan konfirmasi pembayaran jika dana sudah diterima.",
        "",
        "Terima kasih."
      ].join("\n");
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
    <main className="dt-order-redesign">
      <SiteHeader />
      <section className="dt-order-hero">
        <div className="dt-order-hero-inner">
          <div className="dt-order-hero-copy">
            <Link href="/koleksi" className="dt-order-back"><ArrowLeft size={15}/> Kembali ke koleksi</Link>
            <span className="dt-order-eyebrow"><i/> ORDER YOUR NFC CARD</span>
            <h1>Make it real.<br/><em>Start with one tap.</em></h1>
            <p>Pesan kartu NFC untuk bisnismu. Isi detail pesanan, selesaikan pembayaran, lalu tim kami akan membantu proses berikutnya.</p>
            <div className="dt-order-proof">
              <span><Check size={15}/> NFC + QR Code</span>
              <span><Check size={15}/> Dashboard gratis</span>
              <span><Check size={15}/> Tanpa biaya bulanan</span>
            </div>
          </div>
          <div className="dt-order-hero-art" aria-label="Pratinjau kartu NFC DiTapAja">
            <div className="dt-order-art-glow"/>
            <div className="dt-order-art-card">
              <div><span className="dt-order-art-mark"><i/><i/><i/></span><b>DITAPAJA</b><span>NFC · QR READY</span></div>
              <strong>YOUR<br/><em>review</em><br/>STARTS HERE.</strong>
              <small>ONE TAP CLOSER TO A GOOD REVIEW.</small>
            </div>
            <span className="dt-order-art-caption">A PHYSICAL TOUCHPOINT FOR YOUR BUSINESS</span>
          </div>
        </div>
      </section>

      <section className="dt-order-process">
        <div className="dt-order-section-heading">
          <span>THE ORDER EXPERIENCE</span>
          <h2>{orderId ? "One step closer." : "Your card, your way."}</h2>
          <p>{orderId ? "Pesanan sudah tercatat. Selesaikan transfer dan kirim bukti pembayaran." : "Semua dimulai dari detail sederhana. Tidak perlu membuat akun untuk memesan."}</p>
        </div>
        <div className="dt-order-stepbar" aria-label="Tahapan pemesanan">
          <div className={!orderId ? "is-current" : "is-complete"}><span>{orderId ? <Check size={15}/> : "01"}</span><b>Detail pesanan</b></div>
          <i/>
          <div className={orderId ? "is-current" : ""}><span>02</span><b>Pembayaran</b></div>
          <i/>
          <div className={showAccountPrompt ? "is-complete" : ""}><span>{showAccountPrompt ? <Check size={15}/> : "03"}</span><b>Konfirmasi</b></div>
        </div>

        <div className="dt-order-workspace">
          <section className="dt-order-main-card">
            {!orderId ? (
              <form onSubmit={createOrder}>
                <div className="dt-order-card-heading"><div><span>01 / CHECKOUT</span><h3>Detail pesanan</h3><p>Tentukan kartu dan isi informasi pemesan.</p></div><span className="dt-order-required">* Wajib diisi</span></div>
                <label aria-hidden="true" className="pointer-events-none absolute -left-[10000px] top-auto h-px w-px overflow-hidden">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label>

                <div className="dt-order-product-card">
                  <div className="dt-order-product-visual"><span>DITAPAJA</span><strong>{product.type}</strong><small>NFC · QR</small></div>
                  <div className="dt-order-product-info">
                    <span>YOUR CARD SELECTION</span><b>{product.name}</b><p>{product.minimum > 1 ? "Minimum 10 kartu untuk desain custom." : "Minimum 1 kartu. Siap digunakan untuk bisnismu."}</p>
                    <label className="dt-order-select-label">Pilih desain kartu
                      <select value={productKey} onChange={e=>changeProduct(e.target.value)}>
                        <option value="noir">DiTapAja Noir — Rp50.000 / kartu</option>
                        <option value="blanc">DiTapAja Blanc — Rp50.000 / kartu</option>
                        <option value="signature">DiTapAja Signature — Rp60.000 / kartu</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="dt-order-quantity-total">
                  <div className="dt-order-quantity-box"><span>JUMLAH KARTU</span><div><button type="button" aria-label="Kurangi jumlah" disabled={quantity<=product.minimum} onClick={()=>setQuantity(v=>Math.max(product.minimum,v-1))}><Minus size={16}/></button><output>{quantity}</output><button type="button" aria-label="Tambah jumlah" disabled={quantity>=1000} onClick={()=>setQuantity(v=>Math.min(1000,v+1))}><Plus size={16}/></button></div><small>Minimum {product.minimum} kartu</small></div>
                  <div className="dt-order-total-box"><span>ESTIMASI SUBTOTAL</span><strong>{money(total)}</strong><small>Ongkos kirim dikonfirmasi terpisah</small></div>
                </div>

                <div className="dt-order-form-section">
                  <div className="dt-order-subheading"><span>02 / YOUR INFORMATION</span><h3>Data pemesan & pengiriman</h3><p>Pastikan email dan nomor WhatsApp aktif agar tim kami mudah menghubungi.</p></div>
                  <div className="dt-order-fields">
                    <label>Nama bisnis<input required maxLength={120} autoComplete="organization" value={business} onChange={e=>setBusiness(e.target.value)} placeholder="Contoh: Kopi Senja"/></label>
                    <label>Nama lengkap<input required maxLength={100} autoComplete="name" value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="Nama pemesan"/></label>
                    <label>Email aktif<input required type="email" autoComplete="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value.trimStart())} placeholder="nama@email.com"/><small>Gunakan email yang sama saat mendaftar untuk melihat riwayat order.</small></label>
                    <label>Nomor WhatsApp<input required type="tel" inputMode="tel" autoComplete="tel" maxLength={24} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="08xxxxxxxxxx"/></label>
                    <label className="dt-order-address-field">Alamat pengiriman<input required maxLength={250} autoComplete="shipping street-address" value={destination} onChange={e=>setDestination(e.target.value)} placeholder="Alamat lengkap, kota, provinsi"/></label>
                    <label className="dt-order-notes-field">Catatan tambahan <span>(opsional)</span><textarea value={notes} onChange={e=>setNotes(e.target.value)} maxLength={1000} rows={3} placeholder="Logo, warna brand, atau kebutuhan custom."/></label>
                  </div>
                </div>
                {error && <p role="alert" className="dt-order-alert">{error}</p>}
                <button className="dt-order-submit" type="submit" disabled={sending}>{sending ? "Membuat pesanan..." : "Buat pesanan & lanjut pembayaran"} <ArrowRight size={17}/></button>
                <p className="dt-order-privacy"><LockKeyhole size={13}/> Tidak perlu login untuk melakukan pemesanan.</p>
              </form>
            ) : (
              <div className="dt-order-payment-view">
                <div className="dt-order-card-heading"><div><span>02 / PAYMENT</span><h3>Transfer pembayaran</h3><p>Gunakan salah satu rekening berikut sesuai total pesanan.</p></div><span className="dt-order-payment-badge"><i/> ORDER DIBUAT</span></div>
                <div className="dt-order-reference"><div><small>NOMOR PESANAN</small><strong>{orderId}</strong></div><button type="button" onClick={()=>void copyNumber(orderId)} aria-label="Salin nomor pesanan"><Copy size={16}/></button></div>
                <div className="dt-order-bank-grid">
                  {accounts.map(account=><article key={account.bank}><div><b>{account.bank}</b><span>TRANSFER BANK</span></div><strong>{account.number}</strong><small>a.n. {account.owner}</small><button type="button" onClick={()=>void copyNumber(account.number)}><Copy size={14}/> Salin nomor rekening</button></article>)}
                </div>
                <div className="dt-order-transfer-total"><span>TOTAL TRANSFER</span><strong>{money(total)}</strong><p>Belum termasuk ongkos kirim. Jika ada penyesuaian ongkir, tim kami akan menghubungi melalui WhatsApp.</p></div>
                <div className="dt-order-proof-panel">
                  <div className="dt-order-subheading"><span>03 / PAYMENT CONFIRMATION</span><h3>Kirim bukti pembayaran</h3><p>Unggah screenshot atau foto bukti transfer yang menampilkan nominal, tanggal, dan status transaksi.</p></div>
                  <label className="dt-order-file"><FileImage size={21}/><strong>{selectedFile ? selectedFile.name : "Pilih file bukti transfer"}</strong><small>JPG, PNG, WEBP, PDF · Maks. 5 MB</small><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setSelectedFile(e.target.files?.[0] || null)}/></label>
                  <label className="dt-order-reference-field">Nomor referensi / berita transfer <span>(opsional)</span><input maxLength={120} value={paymentReference} onChange={e=>setPaymentReference(e.target.value)} placeholder="Nomor referensi transaksi"/></label>
                  {error && <p role="alert" className="dt-order-alert">{error}</p>}
                  <button type="button" className="dt-order-submit" onClick={()=>void submitProof()} disabled={uploading || !selectedFile}>{uploading ? "Mengirim bukti pembayaran..." : "Kirim bukti & konfirmasi via WhatsApp"} <MessageCircle size={17}/></button>
                  <p className="dt-order-privacy"><ShieldCheck size={13}/> Bukti pembayaran disimpan secara privat dan diperiksa manual oleh admin.</p>
                </div>
              </div>
            )}
            {notice && <p role="status" className="dt-order-notice"><Check size={15}/>{notice}</p>}
          </section>

          <aside className="dt-order-aside">
            <div className="dt-order-aside-card dt-order-summary-card">
              <span>YOUR ORDER</span><h3>Simple from<br/><em>start to finish.</em></h3>
              <div className="dt-order-summary-line"><PackageCheck size={18}/><div><b>Kartu NFC fisik</b><small>Siap digunakan di lokasi bisnismu</small></div></div>
              <div className="dt-order-summary-line"><CreditCard size={18}/><div><b>NFC + QR Code</b><small>Dua cara untuk membuka halaman tujuan</small></div></div>
              <div className="dt-order-summary-line"><Sparkles size={18}/><div><b>Dashboard gratis</b><small>Kelola kartu dan tautan tujuan</small></div></div>
              <div className="dt-order-summary-line"><Truck size={18}/><div><b>Pengiriman dikonfirmasi</b><small>Tim kami menghubungi untuk detail ongkir</small></div></div>
            </div>
            <div className="dt-order-aside-card dt-order-help-card"><span>NEED A HAND?</span><h3>Masih ada yang ingin ditanyakan?</h3><p>Hubungi tim DiTapAja jika butuh bantuan sebelum menyelesaikan pesanan.</p><a href="https://wa.me/6281321778081" target="_blank" rel="noopener noreferrer"><MessageCircle size={16}/> Chat tim DiTapAja <ArrowRight size={15}/></a></div>
          </aside>
        </div>
      </section>

      <footer className="dt-order-footer"><div><b>DiTapAja.</b><span>Make every customer interaction count.</span></div><Link href="/koleksi">Jelajahi koleksi <ArrowRight size={14}/></Link></footer>

      {showAccountPrompt && <div className="dt-order-account-overlay"><section role="dialog" aria-modal="true" aria-labelledby="order-account-title"><div className="dt-order-modal-icon"><Check size={27}/></div><p>PAYMENT SUBMITTED</p><h2 id="order-account-title">Bukti pembayaran diterima</h2><p>Tim DiTapAja akan memeriksa pembayaran secara manual. Masuk atau daftar menggunakan email <b>{email}</b> untuk memantau status transaksi dan riwayat pesanan.</p><div><Link href={"/login?next="+encodeURIComponent("/pesanan")}>Masuk</Link><Link href={"/register?next="+encodeURIComponent("/pesanan")}>Daftar akun</Link></div><button type="button" onClick={()=>setShowAccountPrompt(false)}>Nanti saja</button></section></div>}
    </main>
  );
}
