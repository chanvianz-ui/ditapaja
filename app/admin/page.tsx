"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowUpRight, CreditCard, KeyRound, LayoutDashboard, LogOut, MousePointerClick, RefreshCw, ShieldCheck, Users, Wallet, AlertCircle, Menu, X, ChevronRight, TrendingUp, CircleDollarSign, UserRound, ShoppingBag } from "lucide-react";
import { supabase } from "@/lib/supabase";

type AdminStats = { totalUsers:number; totalCards:number; activeCards:number; totalTaps:number; totalReviewClicks:number; totalOrders:number; paidOrders:number; pendingOrders:number; paidRevenue:number; monthlyRevenue:number; topProducts:{name:string;quantity:number;revenue:number}[] };
type AdminOverviewResponse = {success:true;stats:AdminStats}|{success:false;error?:string};
const initialStats:AdminStats={totalUsers:0,totalCards:0,activeCards:0,totalTaps:0,totalReviewClicks:0,totalOrders:0,paidOrders:0,pendingOrders:0,paidRevenue:0,monthlyRevenue:0,topProducts:[]};
const number=(v:number)=>Number(v||0).toLocaleString("id-ID");
const rupiah=(v:number)=>"Rp"+number(v);
const nav=[{label:"Ringkasan",href:"/admin",icon:LayoutDashboard},{label:"Manajemen pesanan",href:"/admin/orders",icon:ShoppingBag},{label:"Manajemen pengguna",href:"/admin/users",icon:Users},{label:"PIN aktivasi",href:"/admin/pins",icon:KeyRound}];

export default function AdminPage(){
 const router=useRouter(); const [stats,setStats]=useState<AdminStats>(initialStats); const [loading,setLoading]=useState(true); const [refreshing,setRefreshing]=useState(false); const [error,setError]=useState(""); const [menuOpen,setMenuOpen]=useState(false);
 async function loadStats(){setError("");try{const {data,error:sessionError}=await supabase.auth.getSession();if(sessionError||!data.session){router.replace("/login");return;}const response=await fetch("/api/admin/overview",{headers:{Authorization:"Bearer "+data.session.access_token},cache:"no-store"});const result=(await response.json()) as AdminOverviewResponse;if(response.status===401){router.replace("/login");return;}if(!response.ok||result.success===false)throw new Error(result.success===false?result.error||"Gagal mengambil data Admin":"Gagal mengambil data Admin");setStats(result.stats);}catch(err){setError(err instanceof Error?err.message:"Terjadi kesalahan saat mengambil data.");}finally{setLoading(false);setRefreshing(false);}}
 useEffect(()=>{void loadStats();},[]);
 useEffect(()=>{
  if(!menuOpen)return;
  const panel=document.getElementById("admin-overview-mobile-menu");
  const trigger=document.querySelector<HTMLButtonElement>(".dt-control-menu-trigger");
  const previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  const getFocusable=()=>Array.from(panel?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')??[]).filter(el=>el.offsetWidth>0||el.offsetHeight>0);
  getFocusable()[0]?.focus();
  const onKeyDown=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){event.preventDefault();setMenuOpen(false);return;}
   if(event.key!=="Tab")return;
   const focusable=getFocusable();if(!focusable.length)return;
   const first=focusable[0],last=focusable[focusable.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };
  window.addEventListener("keydown",onKeyDown);
  return()=>{document.body.style.overflow=previousOverflow;window.removeEventListener("keydown",onKeyDown);if(previousFocus?.isConnected)trigger?.focus();};
 },[menuOpen]);
 async function logout(){await supabase.auth.signOut();router.replace("/login");}
 const metrics=[{label:"Pengguna terdaftar",value:stats.totalUsers,detail:"Akun di platform",icon:Users},{label:"Kartu NFC",value:stats.totalCards,detail:number(stats.activeCards)+" aktif",icon:CreditCard},{label:"Total interaksi",value:stats.totalTaps,detail:"Tap NFC tercatat",icon:MousePointerClick},{label:"Pesanan masuk",value:stats.totalOrders,detail:number(stats.paidOrders)+" sudah lunas",icon:ShoppingBag}];
 return <main className="dt-control">
  <aside className="dt-control-rail"><a className="dt-control-brand" href="/admin"><span className="dt-control-symbol">D</span><span><b>DiTapAja</b><small>KONTROL PLATFORM</small></span></a><div className="dt-control-nav-label">RUANG KERJA</div><nav>{nav.map(item=>{const Icon=item.icon;return <button type="button" key={item.href} onClick={()=>router.push(item.href)} aria-current={item.href==="/admin"?"page":undefined} className={item.href==="/admin"?"active":""}><Icon size={17}/><span>{item.label}</span>{item.href==="/admin"&&<i/>}</button>;})}</nav><div className="dt-control-rail-bottom"><div className="dt-control-access"><ShieldCheck size={17}/><span><b>Superadmin</b><small>Akses penuh platform</small></span></div><button onClick={logout}><LogOut size={17}/>Keluar</button></div></aside>
  {menuOpen&&<div id="admin-overview-mobile-menu" className="dt-control-mobile-menu" role="dialog" aria-modal="true" aria-label="Navigasi Superadmin"><div className="dt-control-mobile-head"><b>DiTapAja Control</b><button type="button" onClick={()=>setMenuOpen(false)} aria-label="Tutup menu"><X/></button></div>{nav.map(item=>{const Icon=item.icon;return <button type="button" key={item.href} onClick={()=>{setMenuOpen(false);router.push(item.href);}} aria-current={item.href==="/admin"?"page":undefined}><Icon size={18}/>{item.label}<ChevronRight size={16}/></button>;})}<button type="button" onClick={logout}><LogOut size={18}/>Keluar</button></div>}
  <section className="dt-control-main"><header className="dt-control-top"><div><span>PUSAT KONTROL</span><b>Ringkasan <i>/</i> Kontrol platform</b></div><div className="dt-control-top-actions"><span className="dt-control-live"><i/> Sistem terpantau</span><button onClick={()=>{setRefreshing(true);void loadStats();}} disabled={loading||refreshing}><RefreshCw size={15} className={refreshing?"animate-spin":""}/><span>Perbarui</span></button><button type="button" className="dt-control-menu-trigger" onClick={()=>setMenuOpen(true)} aria-label="Buka menu" aria-controls="admin-overview-mobile-menu" aria-expanded={menuOpen}><Menu/></button></div></header>
   <div className="dt-control-content">
    <section className="dt-control-intro"><div className="dt-control-intro-copyblock"><h1>CONTROL<br/><em>THE FLOW.</em></h1></div><div className="dt-control-hero-art" aria-hidden="true"><div className="dt-control-orbit orbit-one"/><div className="dt-control-orbit orbit-two"/><div className="dt-control-orbit orbit-three"/><div className="dt-control-orbit-core"><span>D</span><small>CONTROL<br/>CENTER</small></div><div className="orbit-cross cross-one"/><div className="orbit-cross cross-two"/></div></section>
    {error&&<div className="dt-control-error"><AlertCircle size={18}/><span>{error}</span></div>}
    <section className="dt-control-metrics"><div className="dt-control-metrics-heading"><b>Ringkasan platform</b></div>{metrics.map((m,i)=>{const Icon=m.icon;return <article className={i===0?"metric-featured":""} key={m.label}><div className="metric-top"><span>{m.label}</span><Icon size={18}/></div><strong>{loading?"—":number(m.value)}</strong><small>{m.detail}</small><div className="metric-index">0{i+1}</div></article>;})}</section>
    <section className="dt-control-workgrid">
     <article className="dt-control-revenue"><div className="panel-heading"><div><h2>Performa pendapatan</h2></div><CircleDollarSign size={21}/></div><div className="revenue-primary"><small>Total pendapatan terkonfirmasi</small><strong>{loading?"—":rupiah(stats.paidRevenue)}</strong><span><TrendingUp size={14}/> Akumulasi pesanan lunas</span></div><div className="revenue-secondary"><div><small>Pendapatan bulan ini</small><b>{loading?"—":rupiah(stats.monthlyRevenue)}</b></div><div><small>Pesanan lunas</small><b>{loading?"—":number(stats.paidOrders)}</b></div></div><button onClick={()=>router.push("/admin/orders")}>Buka laporan pesanan <ArrowUpRight size={16}/></button></article>
     <article className="dt-control-engagement"><div className="panel-heading"><div><h2>Interaksi pelanggan</h2></div><Activity size={20}/></div><div className="engagement-total"><strong>{loading?"—":number(stats.totalTaps)}</strong><small>Total tap NFC</small></div><div className="engagement-gauge" style={{"--engagement-progress":stats.totalTaps?Math.max(8,Math.min(100,stats.totalReviewClicks/stats.totalTaps*100)):0} as React.CSSProperties}><div><b>{loading?"—":Math.round(stats.totalTaps?stats.totalReviewClicks/stats.totalTaps*100:0)}%</b><small>REVIEW RATE</small></div></div><div className="engagement-track"><i style={{width:stats.totalTaps?Math.max(8,Math.min(100,stats.totalReviewClicks/stats.totalTaps*100))+"%":"0%"}}/></div><div className="engagement-foot"><span>Klik Google Review</span><b>{loading?"—":number(stats.totalReviewClicks)}</b></div><p>Konversi interaksi ke halaman ulasan pelanggan.</p></article>
    </section>
    <section className="dt-control-lower"><article className="dt-control-status"><div className="panel-heading"><div><h2>Kondisi platform</h2></div></div><div className="status-list"><div><span>Kartu aktif</span><b>{loading?"—":number(stats.activeCards)}</b></div><div><span>Menunggu pembayaran</span><b className="status-warn">{loading?"—":number(stats.pendingOrders)}</b></div><div><span>Klik Google Review</span><b>{loading?"—":number(stats.totalReviewClicks)}</b></div><div><span>Pesanan lunas</span><b>{loading?"—":number(stats.paidOrders)}</b></div></div></article>
     <article className="dt-control-products"><div className="panel-heading"><div><h2>Produk terjual</h2></div><CreditCard size={20}/></div>{loading?<p className="empty-state">Memuat data…</p>:stats.topProducts.length===0?<p className="empty-state">Belum ada transaksi terkonfirmasi.</p>:stats.topProducts.map(product=><div className="product-line" key={product.name}><div><b>{product.name}</b><small>{number(product.quantity)} unit terjual</small></div><strong>{rupiah(product.revenue)}</strong></div>)}</article></section>
    <section className="dt-control-shortcuts"><div><h2>Kelola platform</h2></div>{nav.slice(1).map(item=>{const Icon=item.icon;return <button key={item.href} onClick={()=>router.push(item.href)}><Icon size={19}/><span>{item.label}</span><ArrowUpRight size={16}/></button>;})}</section>
    <footer className="dt-control-footer">DiTapAja <span>·</span> Ruang kerja Superadmin</footer>
   </div>
  </section>
 </main>;
}
