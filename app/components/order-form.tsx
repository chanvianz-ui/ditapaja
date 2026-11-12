"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, ArrowUpRight, Check, MessageCircle, Minus, Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";

const products = {
  noir: { name: "DiTapAja Noir", price: 50000, minimum: 1, type: "Pesanan reguler · minimum 1 kartu" },
  blanc: { name: "DiTapAja Blanc", price: 50000, minimum: 1, type: "Pembelian langsung" },
  signature: { name: "DiTapAja Signature", price: 60000, minimum: 10, type: "Pre-order custom" },
} as const;

type ProductKey = keyof typeof products;

export default function OrderForm({ initialProduct = "signature" }: { initialProduct?: string }) {
  const safeInitial = Object.prototype.hasOwnProperty.call(products, initialProduct) ? initialProduct as ProductKey : "signature";
  const [productKey, setProductKey] = useState<ProductKey>(safeInitial);
  const [quantity, setQuantity] = useState<number>(products[safeInitial].minimum);
  const [business, setBusiness] = useState("");
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [orderNotice, setOrderNotice] = useState("");
  const product = products[productKey];
  const minimum = product.minimum;
  const total = useMemo(() => product.price * quantity, [product.price, quantity]);
  const formatPrice = (value: number) => "Rp" + value.toLocaleString("id-ID");

  function changeProduct(value: string) {
    const next = value as ProductKey;
    setProductKey(next);
    setQuantity(products[next].minimum);
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const digits = phone.replace(/\D/g, "");
    const normalizedPhone = digits.startsWith("0")
      ? "62" + digits.slice(1)
      : digits.startsWith("8")
        ? "62" + digits
        : digits;
    if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
      const phoneInput = event.currentTarget.querySelector<HTMLInputElement>('input[name="phone"]');
      phoneInput?.setCustomValidity("Masukkan nomor WhatsApp yang valid, termasuk kode negara jika diperlukan.");
      phoneInput?.reportValidity();
      phoneInput?.focus();
      return;
    }
    setSending(true);
    setOrderNotice("");
    const whatsappWindow = window.open("about:blank", "_blank");
    let orderReference = "";
    let saveFailed = false;
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer, business, phone: normalizedPhone, destination, product: product.name, quantity, notes, website }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal menyimpan pesanan.");
      orderReference = result.orderId || "";
    } catch (error) {
      saveFailed = true;
      console.error("Order save failed:", error);
    }
    const message = [
      "Halo DiTapAja, saya ingin melakukan pemesanan.",
      "",
      "DETAIL PESANAN",
      ...(orderReference ? ["Referensi pesanan: " + orderReference] : []),
      "Produk: " + product.name,
      "Jenis: " + product.type,
      "Harga per kartu: " + formatPrice(product.price),
      "Jumlah: " + quantity + " kartu",
      "Estimasi subtotal: " + formatPrice(total),
      "",
      "DATA PEMESAN",
      "Nama bisnis: " + business,
      "Nama pemesan: " + customer,
      "Nomor WhatsApp: +" + normalizedPhone,
      "Alamat/kota pengiriman: " + destination,
      "Catatan: " + (notes.trim() || "-"),
      "",
      "Mohon konfirmasi ketersediaan, ongkir, estimasi pengerjaan, dan langkah pembayaran. Terima kasih."
    ].join("\n");
    const whatsappUrl = "https://wa.me/6281321778081?text=" + encodeURIComponent(message);
    if (whatsappWindow) { whatsappWindow.opener = null; whatsappWindow.location.href = whatsappUrl; }
    else { window.location.href = whatsappUrl; }
    setOrderNotice(saveFailed ? "WhatsApp tetap dibuka, tetapi pesanan belum tercatat otomatis. Tim kami akan mencatatnya saat konfirmasi." : "Pesanan berhasil dicatat. Lanjutkan konfirmasi melalui WhatsApp.");
    setSending(false);
  }

  return (
    <main className="order-page">
      <header className="order-header">
        <Link href="/" className="order-brand"><span className="order-brand-mark">D</span>DiTap<span>Aja</span></Link>
        <Link href="/koleksi" className="order-back"><ArrowLeft size={15}/> Kembali ke koleksi</Link>
      </header>
      <div className="order-layout">
        <section className="order-intro">
          <span className="order-kicker"><i/> PEMESANAN DITAPAJA</span>
          <h1>Satu langkah<br/><em>menuju lebih banyak review.</em></h1>
          <p>Isi detail singkat di bawah. Kami akan menerima rangkuman pesananmu melalui WhatsApp untuk konfirmasi selanjutnya.</p>
          <div className="order-assurance"><span><ShieldCheck size={17}/></span><div><b>Pesanan dikonfirmasi oleh tim kami</b><small>Belum ada pembayaran melalui formulir. Tim kami akan mengonfirmasi pesanan terlebih dahulu.</small></div></div>
          <div className="order-mini-note"><Check size={14}/> NFC + QR Code dalam satu kartu</div>
          <div className="order-mini-note"><Check size={14}/> Dashboard termasuk tanpa biaya bulanan</div>
        </section>
        <form className="order-form" onSubmit={submitOrder}>
          <div className="order-form-heading"><div><span>01 / PRODUK</span><h2>Detail pesanan</h2></div><small>* Wajib diisi</small></div>
          <label aria-hidden="true" className="pointer-events-none absolute -left-[10000px] top-auto h-px w-px overflow-hidden">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)}/></label>
          <label className="order-field">Pilih kartu
            <select value={productKey} onChange={event => changeProduct(event.target.value)}>
              <option value="noir">DiTapAja Noir — Rp50.000 / kartu</option>
              <option value="blanc">DiTapAja Blanc — Rp50.000 / kartu</option>
              <option value="signature">DiTapAja Signature — Rp60.000 / kartu</option>
            </select>
          </label>
          <div className="order-product-summary"><span>{product.type}</span><b>{product.name}</b><small>{minimum > 1 ? "Minimum " + minimum + " kartu untuk desain custom." : "Minimum 1 kartu untuk Noir dan Blanc."}</small></div>
          <div className="order-quantity-row"><div><b>Jumlah kartu</b><small>Minimum {minimum} kartu</small></div><div className="order-quantity"><button type="button" aria-label="Kurangi jumlah" disabled={quantity <= minimum} onClick={() => setQuantity(value => Math.max(minimum, value - 1))}><Minus size={15}/></button><output>{quantity}</output><button type="button" aria-label="Tambah jumlah" disabled={quantity >= 1000} onClick={() => setQuantity(value => Math.min(1000, value + 1))}><Plus size={15}/></button></div></div>
          <div className="order-total"><span>Estimasi subtotal</span><b>{formatPrice(total)}</b><small>Belum termasuk ongkos kirim. Harga final dikonfirmasi oleh tim DiTapAja.</small></div>
          <div className="order-form-heading order-customer-heading"><div><span>02 / DATA PEMESAN</span><h2>Ke mana kami menghubungimu?</h2></div></div>
          <div className="order-fields-grid">
            <label className="order-field">Nama bisnis<input required maxLength={120} autoComplete="organization" value={business} onChange={event => setBusiness(event.target.value)} placeholder="Contoh: Kopi Senja"/></label>
            <label className="order-field">Nama pemesan<input required maxLength={100} autoComplete="name" value={customer} onChange={event => setCustomer(event.target.value)} placeholder="Nama lengkap"/></label>
            <label className="order-field">Nomor WhatsApp<input required type="tel" name="phone" inputMode="tel" autoComplete="tel" maxLength={24} value={phone} onChange={event => { event.target.setCustomValidity(""); setPhone(event.target.value); }} placeholder="08xxxxxxxxxx" aria-describedby="order-phone-hint"/><small id="order-phone-hint" className="order-field-hint">Gunakan nomor aktif yang terhubung ke WhatsApp.</small></label>
            <label className="order-field">Kota / alamat pengiriman<input required maxLength={250} autoComplete="shipping street-address" value={destination} onChange={event => setDestination(event.target.value)} placeholder="Kota dan provinsi"/></label>
          </div>
          <label className="order-field order-notes-field">Catatan tambahan <textarea value={notes} onChange={event => setNotes(event.target.value)} maxLength={1000} rows={3} placeholder="Logo, warna brand, kebutuhan custom, atau pertanyaan lainnya."/></label>
          {orderNotice && <p role="status" className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">{orderNotice}</p>}
          <button className="order-submit" type="submit" disabled={sending}><MessageCircle size={17}/> {sending ? "Mencatat pesanan..." : "Kirim detail ke WhatsApp"} <ArrowUpRight size={16}/></button>
          <p className="order-privacy-note">Pesanan akan dicatat di sistem DiTapAja. WhatsApp kemudian terbuka dengan rangkuman pesanan agar kamu dapat mengirimkannya dan mengonfirmasi detail bersama tim kami.</p>
        </form>
      </div>
      <footer className="order-footer"><span>© 2026 DiTapAja</span><span>Make every customer interaction count.</span></footer>
    </main>
  );
}
