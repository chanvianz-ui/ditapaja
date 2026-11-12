"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Clock3, Package, CheckCircle2, CreditCard, Truck, RefreshCw } from "lucide-react";

type Order = {
  id: string; customer_name: string; customer_email: string; customer_phone: string;
  product_name: string; quantity: number; unit_price: number; status: string;
  payment_status: "unpaid" | "paid" | "refunded"; payment_method: string | null;
  payment_reference: string | null; shipping_courier: string | null;
  tracking_number: string | null; shipping_cost: number; paid_at: string | null;
  shipped_at: string | null; created_at: string; notes: string | null;
};
type Activity = { id: string; order_id: string; title: string; description: string | null; created_at: string };
const statusNames: Record<string,string> = { pending:"Menunggu konfirmasi", confirmed:"Dikonfirmasi", processing:"Sedang diproses", shipped:"Dalam pengiriman", completed:"Selesai", cancelled:"Dibatalkan" };
const paymentNames: Record<string,string> = { unpaid:"Belum dibayar", paid:"Pembayaran berhasil", refunded:"Dana dikembalikan" };
const methodNames: Record<string,string> = { bank_transfer:"Transfer bank", qris:"QRIS", cash:"Tunai / COD", other:"Lainnya" };
const money = (n:number) => "Rp" + n.toLocaleString("id-ID");

export default function CustomerOrdersPage() {
  const router = useRouter();
  const [orders,setOrders] = useState<Order[]>([]);
  const [activities,setActivities] = useState<Record<string,Activity[]>>({});
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [email,setEmail] = useState("");

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
      .select("id,customer_name,customer_email,customer_phone,product_name,quantity,unit_price,status,payment_status,payment_method,payment_reference,shipping_courier,tracking_number,shipping_cost,paid_at,shipped_at,created_at,notes")
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

  useEffect(()=>{ void load(); },[router]);

  return <main className="min-h-screen bg-[#f7f9fc] px-4 py-8 sm:px-6">
    <div className="mx-auto max-w-4xl">
      <header className="mb-8 flex items-center justify-between gap-3">
        <Link href="/" className="text-xl font-black tracking-tight text-slate-900">DiTap<span className="text-blue-600">Aja.</span></Link>
        <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-blue-600">Dashboard <span aria-hidden>↗</span></Link>
      </header>
      <div className="mb-7">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-700"><ArrowLeft size={14}/> Kembali ke beranda</Link>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[.2em] text-blue-600">CUSTOMER ACCOUNT</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Detail pesanan</h1>
        <p className="mt-2 text-sm text-slate-500">Riwayat transaksi dan perkembangan pesanan untuk {email}.</p>
      </div>
      {error && <div role="alert" className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">{error}</div>}
      {loading ? <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-12 text-sm text-slate-500"><RefreshCw size={16} className="animate-spin"/> Memuat transaksi...</div>
      : orders.length === 0 ? <section className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm"><Package size={32} className="mx-auto text-slate-300"/><h2 className="mt-4 text-lg font-bold text-slate-900">Belum ada pesanan</h2><p className="mt-2 text-sm text-slate-500">Pastikan kamu login menggunakan email yang sama dengan email saat checkout.</p><Link href="/koleksi" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Lihat koleksi kartu</Link></section>
      : <div className="space-y-5">{orders.map(order=><article key={order.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ORDER · {order.id.slice(0,8).toUpperCase()}</p><h2 className="mt-2 text-lg font-bold text-slate-900">{order.product_name}</h2><p className="mt-1 text-xs text-slate-500">{new Date(order.created_at).toLocaleString("id-ID",{dateStyle:"long",timeStyle:"short"})}</p></div>
          <span className={"rounded-full px-3 py-1.5 text-xs font-bold "+(order.status==="completed"?"bg-emerald-50 text-emerald-700":order.status==="cancelled"?"bg-slate-100 text-slate-500":"bg-blue-50 text-blue-700")}>{statusNames[order.status] || order.status}</span>
        </div>
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
            <p className="mt-1 text-xs leading-5 text-slate-500">{order.payment_status==="paid" ? "Pembayaran telah diperiksa dan dikonfirmasi oleh tim DiTapAja." : order.payment_status==="refunded" ? "Transaksi ini telah ditandai sebagai pengembalian dana." : "Pembayaran akan diperiksa secara manual oleh tim DiTapAja. Status akan diperbarui setelah verifikasi."}</p>
            {order.payment_method && <p className="mt-3 text-xs text-slate-600">Metode: {methodNames[order.payment_method] || order.payment_method}</p>}
            {order.payment_reference && <p className="mt-1 break-all text-xs text-slate-500">Referensi: {order.payment_reference}</p>}
            {order.paid_at && <p className="mt-1 text-xs text-slate-500">Diverifikasi: {new Date(order.paid_at).toLocaleString("id-ID")}</p>}
          </div>
        </div>
        {(order.shipping_courier || order.tracking_number) && <div className="mx-5 mb-5 flex items-start gap-3 rounded-xl border border-slate-100 p-4 sm:mx-6"><Truck size={17} className="mt-0.5 text-slate-400"/><div className="text-xs"><b className="text-slate-800">{order.shipping_courier || "Pengiriman"}</b><p className="mt-1 text-slate-500">Nomor resi: {order.tracking_number || "Belum tersedia"}</p></div></div>}
        <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6"><div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><Clock3 size={14}/> Riwayat aktivitas</div>
          {(activities[order.id] || []).length===0 ? <p className="text-xs text-slate-400">Belum ada pembaruan aktivitas.</p> : <ol className="ml-2 space-y-4 border-l border-slate-200 pl-5">{activities[order.id].map((a,i)=><li key={a.id} className="relative"><span className={"absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-4 ring-slate-50 "+(i===0?"bg-blue-600":"bg-slate-300")}/><p className="text-xs font-semibold text-slate-800">{a.title}</p>{a.description&&<p className="mt-1 text-xs text-slate-500">{a.description}</p>}<p className="mt-1 text-[10px] text-slate-400">{new Date(a.created_at).toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"short"})}</p></li>)}</ol>}
        </div>
      </article>)}</div>}
      <p className="mt-8 text-center text-[11px] text-slate-400">© 2026 DiTapAja · Informasi pembayaran diperbarui setelah pengecekan manual.</p>
    </div>
  </main>;
}
