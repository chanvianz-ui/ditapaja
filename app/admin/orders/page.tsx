"use client";
import AdminMenu from "@/app/admin/admin-menu";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, ExternalLink, Loader2, LogOut, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Order = {
  id: string; customer_name: string; customer_email: string | null; customer_phone: string;
  product_name: string; quantity: number; unit_price: number; status: string; payment_status: string;
  payment_method: string | null; payment_reference: string | null; payment_proof_path: string | null;
  shipping_courier: string | null; tracking_number: string | null; shipping_cost: number;
  paid_at: string | null; shipped_at: string | null; created_at: string; notes: string | null;
};
const orderLabels: Record<string,string> = { pending:"Menunggu konfirmasi", confirmed:"Dikonfirmasi", processing:"Diproses", shipped:"Dikirim", completed:"Selesai", cancelled:"Dibatalkan" };
const paymentLabels: Record<string,string> = { unpaid:"Belum dibayar", pending_verification:"Perlu verifikasi", paid:"Lunas", refunded:"Refund" };
const money = (value:number) => "Rp" + Number(value || 0).toLocaleString("id-ID");
const date = (value:string) => new Date(value).toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"short"});

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders,setOrders] = useState<Order[]>([]);
  const [search,setSearch] = useState("");
  const [status,setStatus] = useState("all");
  const [paymentStatus,setPaymentStatus] = useState("all");
  const [page,setPage] = useState(1);
  const [total,setTotal] = useState(0);
  const [loading,setLoading] = useState(true);
  const [refreshing,setRefreshing] = useState(false);
  const [updating,setUpdating] = useState<string | null>(null);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const {data,error:sessionError} = await supabase.auth.getSession();
      if (sessionError || !data.session) { router.replace("/login"); return; }
      const params = new URLSearchParams({page:String(page),search,status,paymentStatus});
      const response = await fetch("/api/admin/orders?"+params.toString(),{headers:{Authorization:"Bearer "+data.session.access_token},cache:"no-store"});
      const result = await response.json();
      if (response.status === 401) { router.replace("/login"); return; }
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal memuat pesanan.");
      setOrders(result.orders || []); setTotal(result.total || 0);
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan."); }
    finally { setLoading(false); setRefreshing(false); }
  },[router,page,search,status,paymentStatus]);

  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, search ? 250 : 0); return () => window.clearTimeout(timer); },[load,search]);
  const pages = Math.max(1,Math.ceil(total/25));
  const pendingPayments = useMemo(()=>orders.filter(o=>o.payment_status==="pending_verification").length,[orders]);

  async function updateOrder(order:Order, field:"status"|"payment_status", value:string) {
    const prompt = field === "payment_status" && value === "paid"
      ? "Konfirmasi bahwa pembayaran pesanan ini benar-benar sudah diterima?"
      : field === "payment_status" && value === "unpaid"
        ? "Tolak bukti pembayaran dan kembalikan status ke belum dibayar?"
        : "";
    if (prompt && !window.confirm(prompt)) return;
    setUpdating(order.id); setError(""); setNotice("");
    try {
      const {data,error:sessionError}=await supabase.auth.getSession();
      if(sessionError || !data.session) { router.replace("/login"); return; }
      const response=await fetch("/api/admin/orders",{method:"PATCH",headers:{Authorization:"Bearer "+data.session.access_token,"Content-Type":"application/json"},body:JSON.stringify({id:order.id,[field]:value})});
      const result=await response.json();
      if(!response.ok || !result.success) throw new Error(result.error || "Perubahan gagal disimpan.");
      setNotice("Pesanan "+order.id.slice(0,8)+" berhasil diperbarui.");
      await load();
    } catch(err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan."); }
    finally { setUpdating(null); }
  }

  async function viewProof(order:Order) {
    if(!order.payment_proof_path) return;
    const {data,error:proofError}=await supabase.storage.from("ditapaja-payment-proofs").createSignedUrl(order.payment_proof_path,60);
    if(proofError || !data?.signedUrl) { setError("Bukti pembayaran tidak dapat dibuka."); return; }
    window.open(data.signedUrl,"_blank","noopener,noreferrer");
  }

  async function logout(){await supabase.auth.signOut();router.replace("/login");}
  return <main className="min-h-screen bg-[#f5f7f2] text-[#20352a]">
    <header className="sticky top-0 z-20 border-b border-[#e4e9e1] bg-[#fbfcf9]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 sm:px-8">
        <div className="flex items-center gap-3"><button onClick={()=>router.push("/admin")} className="rounded-xl border border-[#e2e8df] p-2.5 text-[#587060] hover:bg-[#edf3e9]"><ArrowLeft size={18}/></button><div><p className="text-sm font-bold tracking-tight">DiTapAja</p><p className="text-xs text-[#849487]">Superadmin workspace</p></div></div>
        <div className="flex items-center gap-2"><span className="hidden items-center gap-2 rounded-full bg-[#edf3e9] px-3 py-2 text-xs font-semibold text-[#315b43] sm:flex"><ShieldCheck size={15}/> Superadmin</span><AdminMenu /></div>
      </div>
    </header>
    <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-8 sm:py-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#66806d]">Commerce control</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Manajemen pesanan</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#7b897d]">Pantau semua pesanan masuk, verifikasi pembayaran, dan kendalikan status pemenuhan pesanan.</p></div><button onClick={()=>{setRefreshing(true);void load();}} disabled={refreshing||loading} className="inline-flex items-center gap-2 rounded-xl border border-[#dfe7dc] bg-white px-4 py-3 text-sm font-semibold text-[#45634e] disabled:opacity-50"><RefreshCw size={16} className={refreshing?"animate-spin":""}/> Refresh</button></div>
      <div className="mb-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-[#e3e9e0] bg-white p-5"><p className="text-xs font-medium text-[#829084]">Pesanan di halaman ini</p><p className="mt-2 text-3xl font-semibold">{loading?"—":total.toLocaleString("id-ID")}</p><p className="mt-1 text-xs text-[#9aa69c]">Total sesuai filter</p></div><div className="rounded-2xl border border-[#e3e9e0] bg-white p-5"><p className="text-xs font-medium text-[#829084]">Perlu verifikasi</p><p className="mt-2 text-3xl font-semibold text-[#b87936]">{loading?"—":pendingPayments}</p><p className="mt-1 text-xs text-[#9aa69c]">Di antara 25 pesanan pada halaman ini</p></div><div className="rounded-2xl border border-[#e3e9e0] bg-[#eaf1e7] p-5"><p className="text-xs font-medium text-[#56715d]">Nilai pesanan halaman ini</p><p className="mt-2 text-2xl font-semibold">{loading?"—":money(orders.reduce((sum,o)=>sum+o.unit_price*o.quantity+o.shipping_cost,0))}</p><p className="mt-1 text-xs text-[#718675]">Termasuk ongkos kirim</p></div></div>
      <section className="overflow-hidden rounded-2xl border border-[#e3e9e0] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#edf0eb] p-4 sm:p-5 lg:flex-row"><div className="relative flex-1"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa69c]"/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Cari nama, email, nomor HP, atau produk..." className="w-full rounded-xl border border-[#e4e9e1] bg-[#fbfcf9] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#91a994]"/></div><select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}} className="rounded-xl border border-[#e4e9e1] bg-[#fbfcf9] px-3 py-3 text-sm"><option value="all">Semua status pesanan</option>{Object.entries(orderLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><select value={paymentStatus} onChange={e=>{setPaymentStatus(e.target.value);setPage(1);}} className="rounded-xl border border-[#e4e9e1] bg-[#fbfcf9] px-3 py-3 text-sm"><option value="all">Semua pembayaran</option>{Object.entries(paymentLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
        {error&&<div className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}{notice&&<div className="m-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
        {loading?<div className="p-12 text-center text-sm text-[#89968c]"><Loader2 size={20} className="mx-auto mb-2 animate-spin"/>Memuat pesanan...</div>:orders.length===0?<div className="p-12 text-center"><ClipboardList size={28} className="mx-auto text-[#a6b1a8]"/><p className="mt-3 text-sm font-semibold">Belum ada pesanan yang cocok</p><p className="mt-1 text-xs text-[#89968c]">Coba ubah kata kunci atau filter.</p></div>:<div className="divide-y divide-[#edf0eb]">{orders.map(order=><article key={order.id} className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_220px_250px] xl:items-center">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[11px] text-[#8a998d]">#{order.id.slice(0,8).toUpperCase()}</span><span className="rounded-full bg-[#f1f4ef] px-2.5 py-1 text-[10px] font-semibold text-[#617365]">{orderLabels[order.status]||order.status}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${order.payment_status==="paid"?"bg-emerald-50 text-emerald-700":order.payment_status==="pending_verification"?"bg-amber-50 text-amber-800":order.payment_status==="refunded"?"bg-slate-100 text-slate-600":"bg-rose-50 text-rose-700"}`}>{paymentLabels[order.payment_status]||order.payment_status}</span></div><h3 className="mt-2 truncate text-base font-semibold">{order.customer_name}</h3><p className="mt-1 text-xs text-[#7f8d82]">{order.customer_email||"Email tidak tersedia"} · {order.customer_phone}</p><p className="mt-2 text-sm font-medium">{order.product_name} <span className="text-[#8b988d]">× {order.quantity}</span></p><p className="mt-1 text-xs text-[#9aa69c]">{date(order.created_at)}</p>{order.notes&&<p className="mt-2 line-clamp-2 whitespace-pre-line text-xs text-[#77867a]">{order.notes}</p>}</div>
          <div><p className="text-[10px] font-bold uppercase tracking-wider text-[#98a399]">Total tagihan</p><p className="mt-1 text-lg font-semibold">{money(order.unit_price*order.quantity+order.shipping_cost)}</p><p className="mt-1 text-xs text-[#89968c]">Produk {money(order.unit_price*order.quantity)} · Ongkir {money(order.shipping_cost)}</p>{order.payment_reference&&<p className="mt-2 break-all text-[11px] text-[#748477]">Ref: {order.payment_reference}</p>}</div>
          <div className="flex flex-col gap-2"><select aria-label="Status pesanan" disabled={updating===order.id} value={order.status} onChange={e=>void updateOrder(order,"status",e.target.value)} className="w-full rounded-lg border border-[#e1e8de] bg-[#fbfcf9] px-3 py-2.5 text-xs font-medium">{Object.entries(orderLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><select aria-label="Status pembayaran" disabled={updating===order.id} value={order.payment_status} onChange={e=>void updateOrder(order,"payment_status",e.target.value)} className="w-full rounded-lg border border-[#e1e8de] bg-[#fbfcf9] px-3 py-2.5 text-xs font-medium">{Object.entries(paymentLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><div className="flex gap-2">{order.payment_proof_path&&<button onClick={()=>void viewProof(order)} className="flex-1 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">Lihat bukti</button>}<a href={"https://wa.me/"+order.customer_phone.replace(/\D/g,"")} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-[#dce8dc] bg-[#f3f7f1] px-3 py-2 text-xs font-semibold text-[#45634e]"><ExternalLink size={13}/> WhatsApp</a></div></div>
        </article>)}</div>}
        <div className="flex items-center justify-between border-t border-[#edf0eb] px-4 py-4 sm:px-5"><p className="text-xs text-[#89968c]">Halaman {page} dari {pages} · {total.toLocaleString("id-ID")} pesanan</p><div className="flex gap-2"><button disabled={page<=1||loading} onClick={()=>setPage(p=>p-1)} className="rounded-lg border border-[#e1e8de] p-2.5 disabled:opacity-40"><ArrowLeft size={15}/></button><button disabled={page>=pages||loading} onClick={()=>setPage(p=>p+1)} className="rounded-lg border border-[#e1e8de] p-2.5 disabled:opacity-40"><ArrowRight size={15}/></button></div></div>
      </section>
      <p className="mt-5 text-center text-xs text-[#9aa69c]">Perubahan status dilakukan secara manual oleh Superadmin. Pastikan pembayaran telah diterima sebelum menandai pesanan lunas.</p>
    </div>
  </main>;
}
