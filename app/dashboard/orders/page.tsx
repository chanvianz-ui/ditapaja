"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Plus, Loader2, Trash2, RefreshCw, AlertCircle, Search, Clock, CheckCircle2, ChevronDown, Copy, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Order = { id: string; customer_name: string; customer_phone: string; product_name: string; quantity: number; unit_price: number; status: string; created_at: string; notes: string | null };
const statuses = ["pending","confirmed","processing","shipped","completed","cancelled"];
const statusLabels: Record<string,string> = { pending:"Menunggu konfirmasi", confirmed:"Dikonfirmasi", processing:"Sedang diproses", shipped:"Dikirim", completed:"Selesai", cancelled:"Dibatalkan" };

export default function OrdersPage() {
  const router = useRouter();
  const [userId,setUserId]=useState("");
  const [orders,setOrders]=useState<Order[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const [customer,setCustomer]=useState("");
  const [phone,setPhone]=useState("");
  const [product,setProduct]=useState("DiTapAja Noir");
  const [quantity,setQuantity]=useState("1");
  const [notes,setNotes]=useState("");
  const [search,setSearch]=useState("");
  const [statusFilter,setStatusFilter]=useState("all");
  const [expandedOrder,setExpandedOrder]=useState<string|null>(null);
  const [copiedOrder,setCopiedOrder]=useState<string|null>(null);

  async function loadOrders(uid:string) {
    const {data,error:loadError}=await supabase.from("ditapaja_orders").select("id,customer_name,customer_phone,product_name,quantity,unit_price,status,created_at,notes").eq("user_id",uid).order("created_at",{ascending:false});
    if(loadError) {
      console.error("Order loading failed:", loadError);
      setError(`Gagal memuat pesanan (${loadError.code || "UNKNOWN"}): ${loadError.message}. Periksa tabel ditapaja_orders dan kebijakan RLS di Supabase.`);
    } else {
      setError("");
      setOrders((data||[]) as Order[]);
    }
  }
  useEffect(()=>{(async()=>{const {data,error:authError}=await supabase.auth.getUser();if(authError||!data.user){router.replace("/login");return;}setUserId(data.user.id);await loadOrders(data.user.id);setLoading(false);})();},[router]);

  async function createOrder(e:React.FormEvent){
    e.preventDefault();setSaving(true);setError("");setSuccess("");
    const count=Number(quantity);
    if(!customer.trim()||!phone.trim()||!product.trim()||!Number.isInteger(count)||count<1||count>1000){setError("Lengkapi data pesanan dengan benar.");setSaving(false);return;}
    const {data,error:insertError}=await supabase.from("ditapaja_orders").insert({user_id:userId,customer_name:customer.trim(),customer_phone:phone.trim(),product_name:product.trim(),quantity:count,unit_price:product==="DiTapAja Signature"?60000:50000,notes:notes.trim()||null}).select("id,customer_name,customer_phone,product_name,quantity,unit_price,status,created_at,notes").single();
    if(insertError)setError(insertError.message);else{setOrders(current=>[data as Order,...current]);setCustomer("");setPhone("");setQuantity("1");setNotes("");setSuccess("Pesanan berhasil dicatat.");}
    setSaving(false);
  }
  async function updateStatus(id:string,status:string){
    const {error:updateError}=await supabase.from("ditapaja_orders").update({status,updated_at:new Date().toISOString()}).eq("id",id).eq("user_id",userId);
    if(updateError){setError("Status pesanan gagal diperbarui: "+updateError.message);return;}
    setOrders(current=>current.map(order=>order.id===id?{...order,status}:order));
  }
  async function removeOrder(id:string){
    if(!window.confirm("Hapus pesanan ini secara permanen?")) return;
    const {error:deleteError}=await supabase.from("ditapaja_orders").delete().eq("id",id).eq("user_id",userId);
    if(deleteError){setError("Pesanan gagal dihapus.");return;}
    setOrders(current=>current.filter(order=>order.id!==id));
  }
  const filteredOrders = orders.filter(order => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [order.customer_name, order.customer_phone, order.product_name, order.id].some(value => value.toLowerCase().includes(query));
    return matchesSearch && (statusFilter === "all" || order.status === statusFilter);
  });
  const pendingCount = orders.filter(order => order.status === "pending").length;
  const activeCount = orders.filter(order => ["confirmed", "processing", "shipped"].includes(order.status)).length;
  const completedCount = orders.filter(order => order.status === "completed").length;

  if(loading)return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;
  return <main className="min-h-screen bg-[#f7f9fc] px-4 py-6 text-slate-900 sm:px-8 sm:py-9"><div className="mx-auto max-w-5xl">
    <button onClick={()=>router.push("/dashboard")} className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600"><ArrowLeft size={17}/> Dashboard</button>
    <div className="mb-7 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 ring-1 ring-blue-100"><Package/></div><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Sales Workspace</p><h1 className="text-3xl font-bold">Order Management</h1><p className="mt-1 text-sm text-slate-500">Catat dan pantau pesanan kartu DiTapAja.</p></div></div>
    {(error||success)&&<div className={`mb-5 flex gap-2 rounded-xl border p-4 text-sm ${error?"border-red-200 bg-red-50 text-red-700":"border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error?<AlertCircle size={17}/>:<RefreshCw size={17}/>}<span>{error||success}</span></div>}
    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-amber-600"><Clock size={17}/><span className="text-xs font-semibold">Menunggu konfirmasi</span></div><p className="mt-2 text-2xl font-bold">{pendingCount}</p></div>
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-blue-600"><Package size={17}/><span className="text-xs font-semibold">Dalam proses</span></div><p className="mt-2 text-2xl font-bold">{activeCount}</p></div>
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={17}/><span className="text-xs font-semibold">Selesai</span></div><p className="mt-2 text-2xl font-bold">{completedCount}</p></div>
    </div>
    <div className="grid items-start gap-5 lg:grid-cols-[.8fr_1.2fr]">
      <form onSubmit={createOrder} className="h-fit space-y-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-6"><h2 className="font-bold">Catat pesanan</h2>
        <label className="block text-sm font-semibold">Nama pelanggan<input value={customer} onChange={e=>setCustomer(e.target.value)} required maxLength={100} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"/></label>
        <label className="block text-sm font-semibold">Nomor WhatsApp<input value={phone} onChange={e=>setPhone(e.target.value)} required maxLength={30} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"/></label>
        <label className="block text-sm font-semibold">Produk<select value={product} onChange={e=>setProduct(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"><option>DiTapAja Noir</option><option>DiTapAja Blanc</option><option>DiTapAja Signature</option></select></label>
        <label className="block text-sm font-semibold">Jumlah<input type="number" min="1" max="1000" value={quantity} onChange={e=>setQuantity(e.target.value)} required className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"/></label>
        <label className="block text-sm font-semibold">Catatan<textarea value={notes} onChange={e=>setNotes(e.target.value)} maxLength={1000} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"/></label>
        <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={17}/>{saving?"Menyimpan...":"Tambah Pesanan"}</button>
        <p className="text-xs leading-5 text-slate-400">Pencatatan internal. Ini belum memproses pembayaran atau mengirim pesanan ke Shopee.</p>
      </form>
      <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-6"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="font-bold">Daftar pesanan</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{filteredOrders.length} / {orders.length}</span></div>
        <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_160px]">
          <label className="relative block"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama, WhatsApp, produk, atau ID pesanan..." aria-label="Cari pesanan" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-xs outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"/></label>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} aria-label="Filter status pesanan" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-600 outline-none focus:border-blue-400"><option value="all">Semua status</option>{statuses.map(status=><option key={status} value={status}>{statusLabels[status]}</option>)}</select>
        </div>
        {orders.length===0?<div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">Belum ada pesanan.</div>:filteredOrders.length===0?<div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">Tidak ada pesanan yang cocok dengan pencarian.</div>:<div className="space-y-3">{filteredOrders.map(order=><article key={order.id} className="rounded-xl border border-slate-200/90 p-4 transition-colors hover:border-blue-100"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{order.customer_name}</p><p className="mt-1 text-xs text-slate-500">{order.customer_phone} · {order.product_name} × {order.quantity}</p><p className="mt-2 text-sm font-bold">Rp{(order.unit_price*order.quantity).toLocaleString("id-ID")}</p></div><button onClick={()=>removeOrder(order.id)} aria-label="Hapus pesanan" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16}/></button></div><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-slate-400">{new Date(order.created_at).toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"short"})}</span><div className="flex items-center gap-2"><select value={order.status} onChange={e=>updateStatus(order.id,e.target.value)} aria-label="Ubah status pesanan" className="max-w-[175px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">{statuses.map(status=><option key={status} value={status}>{statusLabels[status]}</option>)}</select><button type="button" onClick={()=>setExpandedOrder(expandedOrder===order.id?null:order.id)} aria-expanded={expandedOrder===order.id} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-600">{expandedOrder===order.id?"Tutup":"Detail"}<ChevronDown size={14} className={expandedOrder===order.id?"rotate-180 transition-transform":"transition-transform"}/></button></div></div>{expandedOrder===order.id&&<div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-3"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">ID Pesanan</p><p className="mt-1 break-all font-mono text-xs text-slate-700">{order.id}</p></div><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(order.id);setCopiedOrder(order.id);}catch{setError("Tidak dapat menyalin ID pesanan.");}}} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 hover:text-blue-600"><Copy size={13}/>{copiedOrder===order.id?"Tersalin":"Salin"}</button></div><div className="grid grid-cols-2 gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status</p><p className="mt-1 text-sm font-semibold text-slate-700">{statusLabels[order.status]||order.status}</p></div><div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total</p><p className="mt-1 text-sm font-bold text-slate-900">Rp{(order.unit_price*order.quantity).toLocaleString("id-ID")}</p></div></div><a href={"https://wa.me/"+order.customer_phone.replace(/\\D/g,"")} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"><ExternalLink size={13}/> Hubungi pelanggan via WhatsApp</a>{order.notes&&<div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Catatan pesanan</p><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-600">{order.notes}</p></div>}</div>}</article>)}</div>}
      </section>
    </div>
  </div></main>;
}
