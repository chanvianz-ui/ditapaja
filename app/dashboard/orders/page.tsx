"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Plus, Loader2, Trash2, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Order = { id: string; customer_name: string; customer_phone: string; product_name: string; quantity: number; unit_price: number; status: string; created_at: string; notes: string | null };
const statuses = ["pending","confirmed","processing","shipped","completed","cancelled"];

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

  async function loadOrders(uid:string) {
    const {data,error:loadError}=await supabase.from("ditapaja_orders").select("id,customer_name,customer_phone,product_name,quantity,unit_price,status,created_at,notes").eq("user_id",uid).order("created_at",{ascending:false});
    if(loadError) setError("Data pesanan belum tersedia. Jalankan migration platform di Supabase.");
    else setOrders((data||[]) as Order[]);
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
    const {error:deleteError}=await supabase.from("ditapaja_orders").delete().eq("id",id).eq("user_id",userId);
    if(deleteError){setError("Pesanan gagal dihapus.");return;}
    setOrders(current=>current.filter(order=>order.id!==id));
  }
  if(loading)return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;
  return <main className="min-h-screen bg-[#f7f9fc] px-5 py-8 text-slate-900 sm:px-8"><div className="mx-auto max-w-5xl">
    <button onClick={()=>router.push("/dashboard")} className="mb-7 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"><ArrowLeft size={17}/> Dashboard</button>
    <div className="mb-8 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Package/></div><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Sales Workspace</p><h1 className="text-3xl font-bold">Order Management</h1><p className="mt-1 text-sm text-slate-500">Catat dan pantau pesanan kartu DiTapAja.</p></div></div>
    {(error||success)&&<div className={`mb-5 flex gap-2 rounded-xl border p-4 text-sm ${error?"border-red-200 bg-red-50 text-red-700":"border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error?<AlertCircle size={17}/>:<RefreshCw size={17}/>}<span>{error||success}</span></div>}
    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <form onSubmit={createOrder} className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-bold">Catat pesanan</h2>
        <label className="block text-sm font-semibold">Nama pelanggan<input value={customer} onChange={e=>setCustomer(e.target.value)} required maxLength={100} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label>
        <label className="block text-sm font-semibold">Nomor WhatsApp<input value={phone} onChange={e=>setPhone(e.target.value)} required maxLength={30} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label>
        <label className="block text-sm font-semibold">Produk<select value={product} onChange={e=>setProduct(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"><option>DiTapAja Noir</option><option>DiTapAja Blanc</option><option>DiTapAja Signature</option></select></label>
        <label className="block text-sm font-semibold">Jumlah<input type="number" min="1" max="1000" value={quantity} onChange={e=>setQuantity(e.target.value)} required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label>
        <label className="block text-sm font-semibold">Catatan<textarea value={notes} onChange={e=>setNotes(e.target.value)} maxLength={1000} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label>
        <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><Plus size={17}/>{saving?"Menyimpan...":"Tambah Pesanan"}</button>
        <p className="text-xs leading-5 text-slate-400">Pencatatan internal. Ini belum memproses pembayaran atau mengirim pesanan ke Shopee.</p>
      </form>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><h2 className="font-bold">Daftar pesanan</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{orders.length} pesanan</span></div>
        {orders.length===0?<div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">Belum ada pesanan.</div>:<div className="space-y-3">{orders.map(order=><article key={order.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{order.customer_name}</p><p className="mt-1 text-xs text-slate-500">{order.customer_phone} · {order.product_name} × {order.quantity}</p><p className="mt-2 text-sm font-bold">Rp{(order.unit_price*order.quantity).toLocaleString("id-ID")}</p></div><button onClick={()=>removeOrder(order.id)} aria-label="Hapus pesanan" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16}/></button></div><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString("id-ID")}</span><select value={order.status} onChange={e=>updateStatus(order.id,e.target.value)} className="max-w-[160px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold capitalize">{statuses.map(status=><option key={status} value={status}>{status}</option>)}</select></div>{order.notes&&<p className="mt-3 text-xs text-slate-500">{order.notes}</p>}</article>)}</div>}
      </section>
    </div>
  </div></main>;
}
