"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, MessageCircle, Minus, Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";

const products = {
  noir: { name: "DiTapAja Noir", price: 50000, minimum: 1, type: "Pembelian langsung" },
  blanc: { name: "DiTapAja Blanc", price: 50000, minimum: 1, type: "Pembelian langsung" },
  signature: { name: "DiTapAja Signature", price: 60000, minimum: 10, type: "Pre-order custom" },
} as const;

type ProductKey = keyof typeof products;

export default function OrderForm({ initialProduct = "signature" }: { initialProduct?: string }) {
  const safeInitial = initialProduct in products ? initialProduct as ProductKey : "signature";
  const [productKey, setProductKey] = useState<ProductKey>(safeInitial);
  const [quantity, setQuantity] = useState(products[safeInitial].minimum);
  const [business, setBusiness] = useState("");
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const product = products[productKey];
  const minimum = product.minimum;
  const total = useMemo(() => product.price * quantity, [product.price, quantity]);
  const formatPrice = (value: number) => "Rp" + value.toLocaleString("id-ID");

  function changeProduct(value: string) {
    const next = value as ProductKey;
    setProductKey(next);
    setQuantity(products[next].minimum);
  }

  function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = [
      "Halo DiTapAja, saya ingin melakukan pemesanan.",
      "",
      "DETAIL PESANAN",
      "Produk: " + product.name,
      "Jenis: " + product.type,
      "Harga per kartu: " + formatPrice(product.price),
      "Jumlah: " + quantity + " kartu",
      "Estimasi subtotal: " + formatPrice(total),
      "",
      "DATA PEMESAN",
      "Nama bisnis: " + business,
      "Nama pemesan: " + customer,
      "Nomor WhatsApp: " + phone,
      "Alamat/kota pengiriman: " + destination,
      "Catatan: " + (notes.trim() || "-"),
      "",
      "Mohon konfirmasi ketersediaan, ongkir, estimasi pengerjaan, dan langkah pembayaran. Terima kasih."
    ].join("\n");
    window.open("https://wa.me/6281321778081?text=" + encodeURIComponent(message), "_blank", "noopener,noreferrer");
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
          <div className="order-assurance"><span><ShieldCheck size={17}/></span><div><b>Pesanan dikonfirmasi oleh tim kami</b><small>Belum ada pembayaran yang dilakukan melalui formulir ini.</small></div></div>
          <div className="order-mini-note"><Check size={14}/> NFC + QR Code dalam satu kartu</div>
          <div className="order-mini-note"><Check size={14}/> Dashboard termasuk tanpa biaya bulanan</div>
        </section>
        <form className="order-form" onSubmit={submitOrder}>
          <div className="order-form-heading"><div><span>01 / PRODUK</span><h2>Detail pesanan</h2></div><small>* Wajib diisi</small></div>
          <label className="order-field">Pilih kartu
            <select value={productKey} onChange={event => changeProduct(event.target.value)}>
              <option value="noir">DiTapAja Noir — Rp50.000 / kartu</option>
              <option value="blanc">DiTapAja Blanc — Rp50.000 / kartu</option>
              <option value="signature">DiTapAja Signature — Rp60.000 / kartu</option>
            </select>
          </label>
          <div className="order-product-summary"><span>{product.type}</span><b>{product.name}</b><small>{minimum > 1 ? "Minimum " + minimum + " kartu untuk desain custom." : "Tersedia untuk pembelian satuan."}</small></div>
          <div className="order-quantity-row"><div><b>Jumlah kartu</b><small>Minimum {minimum} kartu</small></div><div className="order-quantity"><button type="button" aria-label="Kurangi jumlah" disabled={quantity <= minimum} onClick={() => setQuantity(value => Math.max(minimum, value - 1))}><Minus size={15}/></button><output>{quantity}</output><button type="button" aria-label="Tambah jumlah" onClick={() => setQuantity(value => value + 1)}><Plus size={15}/></button></div></div>
          <div className="order-total"><span>Estimasi subtotal</span><b>{formatPrice(total)}</b><small>Belum termasuk ongkos kirim. Harga final dikonfirmasi oleh tim DiTapAja.</small></div>
          <div className="order-form-heading order-customer-heading"><div><span>02 / DATA PEMESAN</span><h2>Ke mana kami menghubungimu?</h2></div></div>
          <div className="order-fields-grid">
            <label className="order-field">Nama bisnis<input required value={business} onChange={event => setBusiness(event.target.value)} placeholder="Contoh: Kopi Senja"/></label>
            <label className="order-field">Nama pemesan<input required value={customer} onChange={event => setCustomer(event.target.value)} placeholder="Nama lengkap"/></label>
            <label className="order-field">Nomor WhatsApp<input required type="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="08xxxxxxxxxx"/></label>
            <label className="order-field">Kota / alamat pengiriman<input required value={destination} onChange={event => setDestination(event.target.value)} placeholder="Kota dan provinsi"/></label>
          </div>
          <label className="order-field order-notes-field">Catatan tambahan <textarea value={notes} onChange={event => setNotes(event.target.value)} rows={3} placeholder="Logo, warna brand, kebutuhan custom, atau pertanyaan lainnya."/></label>
          <button className="order-submit" type="submit"><MessageCircle size={17}/> Kirim detail ke WhatsApp <ArrowUpRight size={16}/></button>
          <p className="order-privacy-note">Dengan melanjutkan, WhatsApp akan terbuka dengan rangkuman pesanan yang kamu isi. Kamu masih bisa memeriksa dan mengedit pesan sebelum mengirimkannya.</p>
        </form>
      </div>
      <footer className="order-footer"><span>© 2026 DiTapAja</span><span>Make every customer interaction count.</span></footer>
    </main>
  );
}
