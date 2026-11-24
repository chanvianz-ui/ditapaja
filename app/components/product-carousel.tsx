"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, ChevronDown, Nfc, QrCode, Sparkles } from "lucide-react";

type Product={name:string;label:string;description:string;tone:string;price:string;order:string;action:string;mode:string};

function CardMock({tone,label}:{tone:string;label:string}){
 return <div className={"dt-showcase-card dt-showcase-"+tone} aria-label={"Kartu NFC edisi "+label}>
  <div className="dt-showcase-card-top"><span>DITAPAJA / NFC CARD</span><Nfc size={18}/></div>
  <div className="dt-showcase-card-main"><div><small>REVIEW MADE SIMPLE</small><strong>{label.toUpperCase()}</strong></div><i/></div>
  <div className="dt-showcase-card-bottom"><span>ONE TAP. MORE REVIEWS.</span><span>NFC · QR</span></div>
  <span className="dt-showcase-card-orbit orbit-one"/><span className="dt-showcase-card-orbit orbit-two"/>
 </div>
}

export default function ProductCarousel({products}:{products:Product[]}){
 const [active,setActive]=useState<string|null>(null);
 return <div className="catalog-slider dt-collection-grid">
  {products.map((p,i)=>{
   const expanded=active===p.tone;
   return <article className={"dt-edition-card dt-edition-"+p.tone+(expanded?" is-expanded":"")} key={p.tone}>
    <div className="dt-edition-visual">
     <div className="dt-edition-visual-grid"/>
     <div className="dt-edition-visual-glow"/>
     <span className="dt-edition-index">0{i+1} <i/> 03</span>
     <CardMock tone={p.tone} label={p.label}/>
     <span className={"dt-edition-status "+(p.mode==="preorder"?"is-preorder":"")}><i/>{p.mode==="preorder"?"PRE-ORDER":"READY TO ORDER"}</span>
     <span className="dt-edition-visual-caption">TAP TO CONNECT <Sparkles size={11}/></span>
    </div>
    <div className="dt-edition-content">
     <div className="dt-edition-heading"><div><span className="dt-edition-kicker">THE COLLECTION / 0{i+1}</span><h3>{p.label}</h3></div><span className="dt-edition-price"><strong>{p.price}</strong><small>/ kartu</small></span></div>
     <p className="dt-edition-description">{p.description}</p>
     <div className="dt-edition-benefits"><span><Check size={13}/> NFC + QR Code</span><span><Check size={13}/> Dashboard gratis</span></div>
     <button type="button" className="dt-edition-expand" aria-expanded={expanded} onClick={()=>setActive(expanded?null:p.tone)}>{expanded?"Tutup detail":"Lihat detail edisi"}<ChevronDown size={14}/></button>
     <div className="dt-edition-extra" hidden={!expanded}>
      <div><Nfc size={15}/><span><b>Tap & scan</b><small>Siap digunakan dengan NFC dan QR</small></span></div>
      <div><QrCode size={15}/><span><b>Dashboard gratis</b><small>Kelola tujuan review dari satu tempat</small></span></div>
     </div>
     <div className="dt-edition-purchase">
      <Link href={"/pesan?product="+p.tone} className="dt-edition-cta">{p.mode==="preorder"?"Pre-order sekarang":"Pilih edisi"}<ArrowUpRight size={16}/></Link>
      <Link href={"/products/"+p.tone} className="dt-edition-more" aria-label={"Detail "+p.label}>Detail produk <ArrowUpRight size={14}/></Link>
     </div>
     <div className="dt-edition-footnote">Tanpa biaya bulanan <span>·</span> {p.mode==="preorder"?"Minimal 10 kartu":"Siap dipesan"}</div>
    </div>
   </article>
  })}
 </div>
}
