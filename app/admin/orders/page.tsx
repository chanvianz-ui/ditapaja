"use client";

import AdminMenu from "@/app/admin/admin-menu";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, ExternalLink,
  Loader2, LogOut, RefreshCw, Search, ShieldCheck, LayoutDashboard,
  Users, CreditCard, KeyRound, Clock3, Wallet, PackageCheck, AlertCircle,
} from "lucide-react";
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
  const paidOrders = useMemo(()=>orders.filter(o=>o.payment_status==="paid").length,[orders]);
  const pageValue = useMemo(()=>orders.reduce((sum,o)=>sum+o.unit_price*o.quantity+o.shipping_cost,0),[orders]);

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
  return (
    <main className="dt-admin-shell min-h-screen bg-[#f4f5f2] text-[#20251f]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col bg-[#202720] px-5 py-6 text-white lg:flex">
        <div className="flex items-center gap-3 px-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d8e5d2] text-[#26372a]"><LayoutDashboard size={20}/></div><div><p className="text-[15px] font-bold tracking-tight">DiTapAja</p><p className="mt-0.5 text-[10px] font-medium uppercase tracking-[.18em] text-[#9eaa9d]">Control center</p></div></div>
        <div className="mt-12"><p className="px-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#829083]">Workspace</p>
          <button onClick={()=>router.push("/admin")} className="mt-4 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm text-[#b7c1b5] transition hover:bg-white/5 hover:text-white"><LayoutDashboard size={17}/> Overview</button>
          <div className="mt-1.5 flex items-center gap-3 rounded-xl bg-[#354337] px-3.5 py-3 text-sm font-semibold text-[#e5efe2]"><CreditCard size={17}/> Order management <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c3d9b9]"/></div>
          <button onClick={()=>router.push("/admin/users")} className="mt-1.5 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm text-[#b7c1b5] transition hover:bg-white/5 hover:text-white"><Users size={17}/> User management</button>
          <button onClick={()=>router.push("/admin/pins")} className="mt-1.5 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm text-[#b7c1b5] transition hover:bg-white/5 hover:text-white"><KeyRound size={17}/> Activation PINs</button>
        </div>
        <div className="mt-auto"><div className="rounded-2xl border border-white/10 bg-white/[.045] p-4"><div className="flex items-center gap-2 text-[#d5e3d0]"><ShieldCheck size={16}/><span className="text-xs font-semibold">Superadmin access</span></div><p className="mt-2 text-[11px] leading-5 text-[#9eaa9d]">Verifikasi dan kelola seluruh pesanan DiTapAja.</p></div><button onClick={logout} className="mt-4 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-[#b7c1b5] transition hover:bg-rose-500/10 hover:text-rose-200"><LogOut size={17}/> Sign out</button></div>
      </aside>

      <section className="min-h-screen lg:ml-[264px]">
        <header className="sticky top-0 z-20 border-b border-[#e7e9e3] bg-[#f8f9f6]/90 backdrop-blur-xl"><div className="flex items-center justify-between px-4 py-4 sm:px-8 lg:px-10"><div><p className="text-[11px] font-medium text-[#899187]">DiTapAja <span className="mx-1.5 text-[#c0c6bd]">/</span> Workspace</p><h1 className="mt-1 text-base font-semibold tracking-tight sm:text-lg">Order management</h1></div><div className="flex items-center gap-2"><button onClick={()=>{setRefreshing(true);void load();}} disabled={refreshing||loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e1e5dc] bg-white px-3.5 text-xs font-semibold text-[#536052] transition hover:border-[#b9c8b5] disabled:opacity-50"><RefreshCw size={14} className={refreshing?"animate-spin":""}/><span className="hidden sm:inline">Refresh data</span></button><div className="lg:hidden"><AdminMenu/></div></div></div></header>

        <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-8 sm:py-9 lg:px-10">
          <div className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div><button onClick={()=>router.push("/admin")} className="mb-5 inline-flex items-center gap-2 text-[11px] font-medium text-[#879184] transition hover:text-[#526b4e]"><ArrowLeft size={14}/> Kembali ke overview</button><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#dce5d7] bg-[#edf3e9] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-[#526b4e]"><ClipboardList size={12}/> Commerce operations</div><h2 className="text-[30px] font-semibold leading-tight tracking-[-.045em] sm:text-[38px]">Pesanan masuk.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#7d877b]">Kelola proses pesanan dari pembayaran sampai pengiriman dalam satu ruang kerja.</p></div><div className="rounded-2xl border border-[#e2e7df] bg-white px-5 py-4 xl:min-w-[220px]"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#929b90]">Total hasil pencarian</p><p className="mt-1 text-2xl font-semibold tracking-tight">{loading?"—":total.toLocaleString("id-ID")} <span className="text-xs font-medium text-[#929b90]">pesanan</span></p></div></div>

          {error&&<div className="mb-5 flex items-start gap-3 rounded-xl border border-[#f0c9c4] bg-[#fff4f1] p-4 text-sm text-[#a3453a]"><AlertCircle size={17} className="mt-0.5 shrink-0"/><div><p className="font-semibold">Ada kendala</p><p className="mt-1">{error}</p></div></div>}
          {notice&&<div className="mb-5 flex items-center gap-2 rounded-xl border border-[#dce8d8] bg-[#edf5e9] p-4 text-sm text-[#526b4e]"><CheckCircle2 size={17}/>{notice}</div>}

          <section className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-[#e5e8e1] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><p className="text-xs font-medium text-[#7e887c]">Perlu verifikasi</p><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fbf1e3] text-[#a8793d]"><Clock3 size={17}/></span></div><p className="mt-5 text-[32px] font-semibold leading-none tracking-[-.04em]">{loading?"—":pendingPayments}</p><p className="mt-3 text-[11px] text-[#9aa296]">Pada halaman yang sedang dibuka</p></article>
            <article className="rounded-2xl border border-[#e5e8e1] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><p className="text-xs font-medium text-[#7e887c]">Pembayaran lunas</p><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf3e9] text-[#668060]"><CheckCircle2 size={17}/></span></div><p className="mt-5 text-[32px] font-semibold leading-none tracking-[-.04em]">{loading?"—":paidOrders}</p><p className="mt-3 text-[11px] text-[#9aa296]">Pada halaman yang sedang dibuka</p></article>
            <article className="rounded-2xl border border-[#e5e8e1] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><p className="text-xs font-medium text-[#7e887c]">Nilai pesanan halaman ini</p><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1eef6] text-[#796a9c]"><Wallet size={17}/></span></div><p className="mt-5 text-[25px] font-semibold leading-none tracking-[-.04em]">{loading?"—":money(pageValue)}</p><p className="mt-3 text-[11px] text-[#9aa296]">Termasuk ongkos kirim</p></article>
          </section>

          <section className="mt-7 overflow-hidden rounded-2xl border border-[#e2e7df] bg-white">
            <div className="border-b border-[#edf0eb] px-5 py-5 sm:px-6"><div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8b9887]">Order directory</p><h3 className="mt-2 text-lg font-semibold tracking-tight">Daftar pesanan</h3><p className="mt-1 text-xs text-[#929b90]">Cari transaksi dan gunakan filter untuk mempersempit hasil.</p></div><div className="grid gap-2 lg:grid-cols-[minmax(220px,1fr)_220px_220px]"><div className="relative"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa296]"/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Nama, email, HP, atau produk..." className="h-11 w-full rounded-xl border border-[#e5e9e2] bg-[#f8f9f6] pl-10 pr-4 text-xs text-[#394338] outline-none transition placeholder:text-[#a1a99e] focus:border-[#aebfa7] focus:bg-white focus:ring-4 focus:ring-[#edf3e9]"/></div><select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}} className="h-11 rounded-xl border border-[#e5e9e2] bg-[#f8f9f6] px-3 text-xs text-[#536052] outline-none focus:border-[#aebfa7]"><option value="all">Semua status pesanan</option>{Object.entries(orderLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><select value={paymentStatus} onChange={e=>{setPaymentStatus(e.target.value);setPage(1);}} className="h-11 rounded-xl border border-[#e5e9e2] bg-[#f8f9f6] px-3 text-xs text-[#536052] outline-none focus:border-[#aebfa7]"><option value="all">Semua pembayaran</option>{Object.entries(paymentLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div></div>

            {loading?<div className="p-16 text-center text-xs text-[#929b90]"><Loader2 size={20} className="mx-auto mb-3 animate-spin"/>Memuat pesanan...</div>:orders.length===0?<div className="p-16 text-center"><ClipboardList size={28} className="mx-auto text-[#c3cbc0]"/><p className="mt-3 text-sm font-semibold text-[#687365]">Belum ada pesanan yang cocok</p><p className="mt-1 text-xs text-[#a0a89d]">Coba ubah kata kunci atau filter.</p></div>:<div className="divide-y divide-[#edf0eb]">{orders.map(order=><article key={order.id} className="grid gap-5 px-5 py-5 transition hover:bg-[#fcfdfb] sm:px-6 xl:grid-cols-[minmax(0,1fr)_190px_240px] xl:items-center">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] font-semibold tracking-wide text-[#929b90]">#{order.id.slice(0,8).toUpperCase()}</span><span className={"rounded-full px-2.5 py-1 text-[10px] font-semibold "+(order.status==="completed"?"bg-[#edf3e9] text-[#63805c]":order.status==="cancelled"?"bg-[#fceeed] text-[#a65b50]":"bg-[#f1f3ef] text-[#647060]")}>{orderLabels[order.status]||order.status}</span><span className={"rounded-full px-2.5 py-1 text-[10px] font-semibold "+(order.payment_status==="paid"?"bg-[#edf3e9] text-[#63805c]":order.payment_status==="pending_verification"?"bg-[#fbf1e3] text-[#a17b3e]":order.payment_status==="refunded"?"bg-[#f1eef6] text-[#796a9c]":"bg-[#fceeed] text-[#a65b50]")}>{paymentLabels[order.payment_status]||order.payment_status}</span></div><h4 className="mt-3 truncate text-sm font-semibold text-[#394338]">{order.customer_name}</h4><p className="mt-1 truncate text-[11px] text-[#929b90]">{order.customer_email||"Email tidak tersedia"} <span className="mx-1">·</span> {order.customer_phone}</p><p className="mt-3 text-xs font-semibold text-[#536052]">{order.product_name} <span className="font-normal text-[#929b90]">× {order.quantity}</span></p><div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#9aa296]"><span>{date(order.created_at)}</span>{order.payment_reference&&<span className="break-all">Ref: {order.payment_reference}</span>}</div>{order.notes&&<p className="mt-2 line-clamp-2 whitespace-pre-line text-[11px] text-[#77867a]">{order.notes}</p>}</div>
              <div className="rounded-xl bg-[#f8f9f6] px-4 py-3 xl:bg-transparent xl:px-0"><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#98a399]">Total tagihan</p><p className="mt-1 text-lg font-semibold tracking-tight text-[#303a30]">{money(order.unit_price*order.quantity+order.shipping_cost)}</p><p className="mt-1 text-[10px] text-[#929b90]">Produk {money(order.unit_price*order.quantity)} · Ongkir {money(order.shipping_cost)}</p></div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1"><select aria-label="Status pesanan" disabled={updating===order.id} value={order.status} onChange={e=>void updateOrder(order,"status",e.target.value)} className="h-10 w-full rounded-lg border border-[#e1e8de] bg-white px-3 text-[11px] font-medium text-[#536052] disabled:opacity-50">{Object.entries(orderLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><select aria-label="Status pembayaran" disabled={updating===order.id} value={order.payment_status} onChange={e=>void updateOrder(order,"payment_status",e.target.value)} className="h-10 w-full rounded-lg border border-[#e1e8de] bg-white px-3 text-[11px] font-medium text-[#536052] disabled:opacity-50">{Object.entries(paymentLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><div className="flex gap-2 sm:col-span-2 xl:col-span-1">{order.payment_proof_path&&<button onClick={()=>void viewProof(order)} className="flex-1 rounded-lg border border-[#e5dff0] bg-[#f7f4fb] px-3 py-2.5 text-[11px] font-semibold text-[#796a9c] transition hover:bg-[#f0eaf8]">Lihat bukti</button>}<a href={"https://wa.me/"+order.customer_phone.replace(/\D/g,"")} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#dce8dc] bg-[#f3f7f1] px-3 py-2.5 text-[11px] font-semibold text-[#45634e] transition hover:bg-[#eaf2e7]"><ExternalLink size={13}/> WhatsApp</a></div></div>
            </article>)}</div>}
            <div className="flex flex-col justify-between gap-3 border-t border-[#edf0eb] px-5 py-4 sm:flex-row sm:items-center sm:px-6"><p className="text-[10px] text-[#9aa296]">Halaman {page} dari {pages} <span className="mx-1.5">·</span> {total.toLocaleString("id-ID")} pesanan</p><div className="flex items-center gap-2"><button disabled={page<=1||loading} onClick={()=>setPage(p=>p-1)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#e1e5dc] px-3.5 text-[11px] font-semibold text-[#647060] transition hover:bg-[#f8f9f6] disabled:opacity-40"><ArrowLeft size={13}/> Sebelumnya</button><button disabled={page>=pages||loading} onClick={()=>setPage(p=>p+1)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#29382b] px-3.5 text-[11px] font-semibold text-white transition hover:bg-[#3a4b3b] disabled:opacity-40">Berikutnya <ArrowRight size={13}/></button></div></div>
          </section>
          <footer className="mt-10 flex flex-col gap-2 border-t border-[#e2e7df] py-6 text-[10px] text-[#9aa296] sm:flex-row sm:items-center sm:justify-between"><span>DiTapAja · Superadmin Control Center</span><span>Pastikan dana diterima sebelum menandai pembayaran lunas.</span></footer>
        </div>
      </section>
    </main>
  );
}
