"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Clock3, Package, CheckCircle2, CreditCard, Truck, RefreshCw, MessageCircle, Upload, Loader2, FileCheck2, Receipt, Printer, X } from "lucide-react";

type Order = {
  id: string; customer_name: string; customer_email: string; customer_phone: string;
  product_name: string; quantity: number; unit_price: number; status: string;
  payment_status: "unpaid" | "pending_verification" | "paid" | "refunded"; payment_method: string | null;
  payment_reference: string | null; payment_proof_path: string | null; shipping_courier: string | null;
  tracking_number: string | null; shipping_cost: number; paid_at: string | null;
  shipped_at: string | null; created_at: string; notes: string | null;
};
type Activity = { id: string; order_id: string; title: string; description: string | null; created_at: string };
const statusNames: Record<string,string> = { pending:"Menunggu konfirmasi", confirmed:"Dikonfirmasi", processing:"Sedang diproses", shipped:"Dalam pengiriman", completed:"Selesai", cancelled:"Dibatalkan" };
const paymentNames: Record<string,string> = { unpaid:"Belum dibayar", pending_verification:"Menunggu verifikasi admin", paid:"Pembayaran berhasil", refunded:"Dana dikembalikan" };
const methodNames: Record<string,string> = { bank_transfer:"Transfer bank", qris:"QRIS", cash:"Tunai / COD", other:"Lainnya" };
const money = (n:number) => "Rp" + n.toLocaleString("id-ID");

export default function CustomerOrdersPage() {
  const router = useRouter();
  const [orders,setOrders] = useState<Order[]>([]);
  const [activities,setActivities] = useState<Record<string,Activity[]>>({});
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [email,setEmail] = useState("");
  const [uploadingOrderId,setUploadingOrderId] = useState<string | null>(null);
  const [proofMethod,setProofMethod] = useState<Record<string,"bank_transfer"|"qris">>({});
  const [proofReference,setProofReference] = useState<Record<string,string>>({});
  const [proofError,setProofError] = useState<Record<string,string>>({});
  const [proofSuccess,setProofSuccess] = useState<Record<string,string>>({});
  const [invoiceOrder,setInvoiceOrder] = useState<Order | null>(null);

  async function load() {
    setLoading(true); setError("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { router.replace("/login?next=%2Fpesanan"); return; }
    setEmail(auth.user.email || "");
    const { error: claimError } = await supabase.rpc("claim_my_ditapaja_orders");
    if (claimError) {
      setError(claimError.message.includes("verified") ? "Verifikasi email akunmu terlebih dahulu. Setelah itu masuk kembali untuk menghubungkan pesanan." : "Pesanan belum dapat dihubungkan. " + claimError.message);
      setLoading(false); return;
    }
    const { data, error: orderError } = await supabase.from("ditapaja_orders")
      .select("id,customer_name,customer_email,customer_phone,product_name,quantity,unit_price,status,payment_status,payment_method,payment_reference,payment_proof_path,shipping_courier,tracking_number,shipping_cost,paid_at,shipped_at,created_at,notes")
      .eq("customer_user_id",auth.user.id).order("created_at",{ascending:false});
    if (orderError) { setError("Gagal memuat riwayat transaksi: " + orderError.message); setLoading(false); return; }
    const rows = (data || []) as Order[];
    setOrders(rows);
    if (rows.length) {
      const { data: logs, error: logsError } = await supabase.from("ditapaja_order_activity")
        .select("id,order_id,title,description,created_at")
        .in("order_id",rows.map(x=>x.id)).order("created_at",{ascending:false});
      if (!logsError) {
        const grouped:Record<string,Activity[]> = {};
        (logs || []).forEach((a:Activity)=>(grouped[a.order_id] ||= []).push(a));
        setActivities(grouped);
      }
    } else setActivities({});
    setLoading(false);
  }

  async function uploadPaymentProof(order: Order, file: File | undefined) {
    if (!file) return;
    const allowedTypes = ["image/jpeg","image/png","image/webp","application/pdf"];
    if (!allowedTypes.includes(file.type) || file.size < 1 || file.size > 5 * 1024 * 1024) {
      setProofError(current => ({ ...current, [order.id]: "File harus JPG, PNG, WEBP, atau PDF dengan ukuran maksimal 5 MB." }));
      return;
    }

    setUploadingOrderId(order.id);
    setProofError(current => ({ ...current, [order.id]: "" }));
    setProofSuccess(current => ({ ...current, [order.id]: "" }));
    try {
      // The access token is only forwarded as a credential; the server verifies it with Supabase Auth.
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (sessionError || !accessToken) throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");

      const endpoint = "/api/customer/orders/" + encodeURIComponent(order.id) + "/payment-proof";
      const headers = { "Content-Type": "application/json", Authorization: "Bearer " + accessToken };
      const createResponse = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "create", fileType: file.type, fileSize: file.size }),
      });
      const createResult = await createResponse.json();
      if (!createResponse.ok || !createResult.success || !createResult.path || !createResult.token) {
        throw new Error(createResult.error || "Link upload tidak dapat dibuat.");
      }

      const { error: uploadError } = await supabase.storage
        .from("ditapaja-payment-proofs")
        .uploadToSignedUrl(createResult.path, createResult.token, file, {
          contentType: file.type,
          cacheControl: "3600",
        });
      if (uploadError) throw new Error("File gagal diunggah: " + uploadError.message);

      const confirmResponse = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "confirm",
          path: createResult.path,
          paymentMethod: proofMethod[order.id] || "bank_transfer",
          paymentReference: (proofReference[order.id] || "").trim(),
        }),
      });
      const confirmResult = await confirmResponse.json();
      if (!confirmResponse.ok || !confirmResult.success) {
        throw new Error(confirmResult.error || "Bukti pembayaran belum berhasil dikirim.");
      }

      setProofSuccess(current => ({ ...current, [order.id]: "Bukti pembayaran berhasil dikirim. Tim DiTapAja akan memeriksanya secara manual." }));
      await load();
    } catch (uploadError) {
      setProofError(current => ({
        ...current,
        [order.id]: uploadError instanceof Error ? uploadError.message : "Bukti pembayaran gagal dikirim.",
      }));
    } finally {
      setUploadingOrderId(null);
    }
  }

  useEffect(()=>{ void load(); },[router]);

  return <main className="min-h-screen bg-[#f7f9fc] px-4 py-8 sm:px-6">
    <div className="mx-auto max-w-4xl">
      <header className="mb-8 flex items-center justify-between gap-3">
        <Link href="/" className="text-xl font-black tracking-tight text-slate-900">DiTap<span className="text-blue-600">Aja.</span></Link>
        <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-blue-600">Dashboard <span aria-hidden>↗</span></Link>
      </header>
      <div className="mb-7">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-700"><ArrowLeft size={14}/> Kembali ke beranda</Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.2em] text-blue-600">CUSTOMER ACCOUNT</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Detail pesanan</h1>
            <p className="mt-2 text-sm text-slate-500">Riwayat transaksi dan perkembangan pesanan untuk {email}.</p>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Perbarui status
          </button>
        </div>
      </div>
      {error && <div role="alert" className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">{error}</div>}
      {loading ? <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-12 text-sm text-slate-500"><RefreshCw size={16} className="animate-spin"/> Memuat transaksi...</div>
      : orders.length === 0 ? <section className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm"><Package size={32} className="mx-auto text-slate-300"/><h2 className="mt-4 text-lg font-bold text-slate-900">Belum ada pesanan</h2><p className="mt-2 text-sm text-slate-500">Pastikan kamu login menggunakan email yang sama dengan email saat checkout.</p><Link href="/koleksi" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Lihat koleksi kartu</Link></section>
      : <div className="space-y-5">{orders.map(order=><article key={order.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ORDER · {order.id.slice(0,8).toUpperCase()}</p><h2 className="mt-2 text-lg font-bold text-slate-900">{order.product_name}</h2><p className="mt-1 text-xs text-slate-500">{new Date(order.created_at).toLocaleString("id-ID",{dateStyle:"long",timeStyle:"short"})}</p></div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setInvoiceOrder(order)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"><Receipt size={14}/> Invoice</button>
            <span className={"rounded-full px-3 py-1.5 text-xs font-bold "+(order.status==="completed"?"bg-emerald-50 text-emerald-700":order.status==="cancelled"?"bg-slate-100 text-slate-500":"bg-blue-50 text-blue-700")}>{statusNames[order.status] || order.status}</span>
          </div>
        </div>
        {order.status === "cancelled" ? <div className="mx-5 mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600 sm:mx-6">Pesanan ini telah dibatalkan. Hubungi tim DiTapAja jika membutuhkan bantuan.</div> : <div className="px-5 pt-5 sm:px-6">
          <div className="grid grid-cols-5 gap-1">
            {["Diterima","Dikonfirmasi","Diproses","Dikirim","Selesai"].map((step,index) => {
              const current = Math.max(0, ["pending","confirmed","processing","shipped","completed"].indexOf(order.status));
              const done = index <= current;
              return <div key={step} className="min-w-0">
                <div className={"h-1.5 rounded-full "+(done ? "bg-blue-600" : "bg-slate-100")}/>
                <p className={"mt-2 text-center text-[9px] leading-4 sm:text-[10px] "+(done ? "font-bold text-blue-700" : "text-slate-400")}>{step}</p>
              </div>;
            })}
          </div>
        </div>}
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-3"><span className="text-slate-500">Jumlah</span><b className="text-slate-800">{order.quantity} kartu</b></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Harga satuan</span><b className="text-slate-800">{money(order.unit_price)}</b></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Ongkos kirim</span><b className="text-slate-800">{money(order.shipping_cost || 0)}</b></div>
            <div className="flex justify-between gap-3 border-t border-slate-100 pt-3"><span className="font-semibold text-slate-700">Total transaksi</span><b className="text-base text-slate-900">{money(order.unit_price*order.quantity+(order.shipping_cost||0))}</b></div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800"><CreditCard size={16}/> Status pembayaran</div>
            <p className={"mt-2 text-sm font-bold "+(order.payment_status==="paid"?"text-emerald-700":order.payment_status==="refunded"?"text-slate-500":"text-amber-700")}>{paymentNames[order.payment_status] || "Menunggu verifikasi"}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{order.payment_status==="paid" ? "Pembayaran telah diperiksa dan dikonfirmasi oleh tim DiTapAja." : order.payment_status==="pending_verification" ? "Tim DiTapAja sedang memeriksa pembayaranmu. Status akan berubah setelah hasil pengecekan." : order.payment_status==="refunded" ? "Transaksi ini telah ditandai sebagai pengembalian dana." : "Belum ada konfirmasi pembayaran. Setelah pembayaran dilakukan, tim DiTapAja akan memeriksanya secara manual."}</p>
            {order.payment_method && <p className="mt-3 text-xs text-slate-600">Metode: {methodNames[order.payment_method] || order.payment_method}</p>}
            {order.payment_reference && <p className="mt-1 break-all text-xs text-slate-500">Referensi: {order.payment_reference}</p>}
            {order.paid_at && <p className="mt-1 text-xs text-slate-500">Diverifikasi: {new Date(order.paid_at).toLocaleString("id-ID")}</p>}
            {order.payment_proof_path && order.payment_status !== "unpaid" ? <div role="status" className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800"><FileCheck2 size={16} className="mt-0.5 shrink-0"/><span>{order.payment_status === "pending_verification" ? "Bukti pembayaran sudah diterima dan sedang diperiksa oleh tim DiTapAja." : "Bukti pembayaran sudah tersimpan pada pesanan ini."}</span></div> : order.status !== "cancelled" && !["paid","refunded"].includes(order.payment_status) ? <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
              <div><p className="text-xs font-bold text-slate-800">{order.payment_proof_path ? "Kirim ulang bukti pembayaran" : "Kirim bukti pembayaran"}</p><p className="mt-1 text-[11px] leading-5 text-slate-500">{order.payment_proof_path ? "Bukti sebelumnya belum dikonfirmasi. Kamu dapat mengirim ulang file yang lebih jelas." : "Unggah bukti transfer atau QRIS agar tim kami dapat melakukan verifikasi manual."}</p></div>
              <label className="block text-xs font-semibold text-slate-600">Metode pembayaran<select value={proofMethod[order.id] || "bank_transfer"} onChange={e=>setProofMethod(current=>({...current,[order.id]:e.target.value as "bank_transfer"|"qris"}))} disabled={uploadingOrderId===order.id} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="bank_transfer">Transfer bank</option><option value="qris">QRIS</option></select></label>
              <label className="block text-xs font-semibold text-slate-600">Nomor referensi / berita transfer <span className="font-normal text-slate-400">(opsional)</span><input value={proofReference[order.id] || ""} onChange={e=>setProofReference(current=>({...current,[order.id]:e.target.value.slice(0,120)}))} maxLength={120} disabled={uploadingOrderId===order.id} placeholder="Contoh: 123456789" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"/></label>
              <label className={"flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-3 text-xs font-semibold transition "+(uploadingOrderId===order.id?"cursor-wait border-blue-200 bg-blue-50 text-blue-700":"border-slate-300 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700")}>
                {uploadingOrderId===order.id ? <Loader2 size={15} className="animate-spin"/> : <Upload size={15}/>}
                {uploadingOrderId===order.id ? "Mengunggah dan mengirim..." : "Pilih bukti pembayaran"}
                <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={uploadingOrderId===order.id} className="sr-only" onChange={e=>{const file=e.target.files?.[0];void uploadPaymentProof(order,file);e.currentTarget.value="";}}/>
              </label>
              <p className="text-[10px] leading-4 text-slate-400">JPG, PNG, WEBP, atau PDF · Maksimal 5 MB. File disimpan secara privat.</p>
              {proofError[order.id] && <p role="alert" className="rounded-lg border border-red-100 bg-red-50 p-2.5 text-xs leading-5 text-red-700">{proofError[order.id]}</p>}
              {proofSuccess[order.id] && <p role="status" className="rounded-lg border border-emerald-100 bg-emerald-50 p-2.5 text-xs leading-5 text-emerald-700">{proofSuccess[order.id]}</p>}
            </div> : null}
          </div>
        </div>
        {(order.shipping_courier || order.tracking_number) && <div className="mx-5 mb-5 flex items-start gap-3 rounded-xl border border-slate-100 p-4 sm:mx-6"><Truck size={17} className="mt-0.5 text-slate-400"/><div className="min-w-0 text-xs"><b className="text-slate-800">{order.shipping_courier || "Pengiriman"}</b><p className="mt-1 text-slate-500">Nomor resi: <span className="break-all font-semibold text-slate-700">{order.tracking_number || "Belum tersedia"}</span></p>{order.shipped_at && <p className="mt-1 text-slate-400">Dikirim: {new Date(order.shipped_at).toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"short"})}</p>}</div></div>}
        <div className="px-5 pb-5 sm:px-6">
          <a href={"https://wa.me/6281321778081?text="+encodeURIComponent("Halo DiTapAja, saya ingin menanyakan pesanan "+order.id+".")} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">
            <MessageCircle size={15}/> Bantuan terkait pesanan
          </a>
        </div>
        <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6"><div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><Clock3 size={14}/> Riwayat aktivitas</div>
          {(activities[order.id] || []).length===0 ? <p className="text-xs text-slate-400">Belum ada pembaruan aktivitas.</p> : <ol className="ml-2 space-y-4 border-l border-slate-200 pl-5">{activities[order.id].map((a,i)=><li key={a.id} className="relative"><span className={"absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-4 ring-slate-50 "+(i===0?"bg-blue-600":"bg-slate-300")}/><p className="text-xs font-semibold text-slate-800">{a.title}</p>{a.description&&<p className="mt-1 text-xs text-slate-500">{a.description}</p>}<p className="mt-1 text-[10px] text-slate-400">{new Date(a.created_at).toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"short"})}</p></li>)}</ol>}
        </div>
      </article>)}</div>}
      <p className="mt-8 text-center text-[11px] text-slate-400">© 2026 DiTapAja · Informasi pembayaran diperbarui setelah pengecekan manual.</p>
    </div>
    {invoiceOrder && (
      <div className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-5">
        <section role="dialog" aria-modal="true" aria-labelledby="customer-invoice-title" className="w-full max-w-xl rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-8">
          <div className="mb-5 flex items-center justify-between print:hidden">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">DiTapAja</p>
              <h2 id="customer-invoice-title" className="text-lg font-bold text-slate-900">Invoice pesanan</h2>
            </div>
            <button type="button" onClick={() => setInvoiceOrder(null)} aria-label="Tutup invoice" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18}/></button>
          </div>

          <div id="ditapaja-customer-invoice" className="rounded-xl border border-slate-200 p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <p className="text-lg font-black tracking-tight text-slate-900">DiTapAja</p>
                <p className="mt-1 text-xs text-slate-500">NFC Review Card</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Invoice</p>
                <p className="mt-1 text-xs text-slate-500">{new Date(invoiceOrder.created_at).toLocaleDateString("id-ID", { dateStyle: "long" })}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tagihan kepada</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{invoiceOrder.customer_name}</p>
                <p className="mt-1 break-all text-xs text-slate-500">{invoiceOrder.customer_email}</p>
                <p className="mt-1 text-xs text-slate-500">{invoiceOrder.customer_phone}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ID Pesanan</p>
                <p className="mt-1 break-all font-mono text-[10px] text-slate-700">{invoiceOrder.id}</p>
                <p className="mt-1 text-xs font-semibold text-blue-700">{statusNames[invoiceOrder.status] || invoiceOrder.status}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-[1fr_auto] bg-slate-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span>Produk</span><span>Total</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3 px-3 py-4 text-xs">
                <div>
                  <p className="font-semibold text-slate-900">{invoiceOrder.product_name}</p>
                  <p className="mt-1 text-slate-500">{invoiceOrder.quantity} × {money(invoiceOrder.unit_price)}</p>
                </div>
                <p className="font-bold text-slate-900">{money(invoiceOrder.unit_price * invoiceOrder.quantity)}</p>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-xs">
                <span>Ongkos kirim</span><span>{money(invoiceOrder.shipping_cost || 0)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 px-3 py-3">
                <span className="text-xs font-bold text-slate-700">Total pesanan</span>
                <span className="text-base font-black text-slate-900">{money(invoiceOrder.unit_price * invoiceOrder.quantity + (invoiceOrder.shipping_cost || 0))}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pembayaran</p>
                <p className={"mt-1 text-xs font-bold " + (invoiceOrder.payment_status === "paid" ? "text-emerald-700" : invoiceOrder.payment_status === "refunded" ? "text-slate-500" : "text-amber-700")}>{paymentNames[invoiceOrder.payment_status] || "Belum dibayar"}</p>
                {invoiceOrder.paid_at && <p className="mt-1 text-[10px] text-slate-500">Diverifikasi: {new Date(invoiceOrder.paid_at).toLocaleString("id-ID")}</p>}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Metode pembayaran</p>
                <p className="mt-1 text-xs font-semibold text-slate-700">{invoiceOrder.payment_method ? (methodNames[invoiceOrder.payment_method] || invoiceOrder.payment_method) : "Belum diatur"}</p>
                {invoiceOrder.payment_reference && <p className="mt-1 break-all text-[10px] text-slate-500">Referensi: {invoiceOrder.payment_reference}</p>}
              </div>
              <div className="col-span-2 border-t border-slate-200 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pengiriman</p>
                <p className="mt-1 text-xs font-semibold text-slate-700">{invoiceOrder.shipping_courier || "Belum diatur"}</p>
                {invoiceOrder.tracking_number && <p className="mt-1 break-all font-mono text-[10px] text-slate-500">Resi: {invoiceOrder.tracking_number}</p>}
                {invoiceOrder.shipped_at && <p className="mt-1 text-[10px] text-slate-500">Dikirim: {new Date(invoiceOrder.shipped_at).toLocaleString("id-ID")}</p>}
              </div>
            </div>

            <p className="mt-6 border-t border-dashed border-slate-200 pt-4 text-center text-[10px] leading-5 text-slate-400">Dokumen ini merupakan ringkasan pesanan, bukan bukti pembayaran.</p>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end print:hidden">
            <button type="button" onClick={() => setInvoiceOrder(null)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Tutup</button>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"><Printer size={16}/> Cetak / Simpan PDF</button>
          </div>
        </section>
        <style jsx global>{`@page { size: A4; margin: 16mm; } @media print { body * { visibility: hidden !important; } #ditapaja-customer-invoice, #ditapaja-customer-invoice * { visibility: visible !important; } #ditapaja-customer-invoice { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; border: 0 !important; box-shadow: none !important; } }`}</style>
      </div>
    )}
  </main>;
}
