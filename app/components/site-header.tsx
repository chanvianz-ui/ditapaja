"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X, ShoppingBag } from "lucide-react";

function Brand(){return <a href="/" className="brand" aria-label="DiTapAja beranda"><span className="brand-symbol"><i/><i/><i/></span><span>DiTap<span className="blue-word">Aja</span></span></a>}

const links=[["Beranda","#top"],["Koleksi","#koleksi"],["Cara kerja","#experience"],["Dashboard","#dashboard"],["FAQ","#faq"]];

export default function SiteHeader(){
 const [open,setOpen]=useState(false);
 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false)};
  window.addEventListener("keydown",onKey);
  document.body.style.overflow=open?"hidden":"";
  return ()=>{window.removeEventListener("keydown",onKey);document.body.style.overflow=""};
 },[open]);
 return <>
  <header className="concept-header"><div className="concept-nav">
   <Brand/>
   <nav aria-label="Navigasi utama">{links.slice(1).map(([label,href])=><a key={href} href={href}>{label}</a>)}</nav>
   <div className="concept-nav-actions"><a href="/login">Masuk</a><a className="concept-nav-cta" href="#koleksi">Temukan kartumu <ArrowUpRight size={15}/></a></div>
   <div className="concept-mobile-actions"><a href="#koleksi" aria-label="Lihat koleksi"><ShoppingBag size={19}/></a><button type="button" onClick={()=>setOpen(true)} aria-label="Buka menu"><Menu size={23}/></button></div>
  </div></header>
  {open&&<div className="mobile-drawer-backdrop" onClick={()=>setOpen(false)}>
   <aside className="mobile-drawer" onClick={e=>e.stopPropagation()} aria-label="Menu navigasi">
    <div className="mobile-drawer-head"><Brand/><button type="button" onClick={()=>setOpen(false)} aria-label="Tutup menu"><X size={23}/></button></div>
    <div className="mobile-drawer-kicker">JELAJAHI DITAPAJA</div>
    <nav>{links.map(([label,href])=><a key={href} href={href} onClick={()=>setOpen(false)}><strong>{label}</strong><ArrowUpRight size={19}/></a>)}</nav>
    <div className="mobile-drawer-bottom"><p>Make every customer interaction count.</p><a href="/login" onClick={()=>setOpen(false)}>Masuk ke akun <ArrowUpRight size={17}/></a><small>© 2026 DiTapAja · Made for better connections</small></div>
   </aside>
  </div>}
 </>;
}
