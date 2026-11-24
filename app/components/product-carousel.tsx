"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Check, ChevronRight, FlipHorizontal2, Nfc, QrCode, Sparkles } from "lucide-react";

type Product={name:string;label:string;description:string;tone:string;price:string;order:string;action:string;mode:string};

function FeatureCard({product,flipped,onFlip}:{product:Product;flipped:boolean;onFlip:()=>void}){
 return <div className={"dt-feature-card-wrap "+(flipped?"is-flipped":"")}>
  <button type="button" className="dt-feature-card" onClick={onFlip} aria-label="Balik tampilan kartu">
   <span className={"dt-feature-card-face dt-feature-card-front dt-feature-"+product.tone}>
    <span className="dt-feature-card-top"><b>DITAPAJA®</b><Nfc size={20}/></span>
    <span className="dt-feature-card-center"><small>REVIEW MADE SIMPLE</small><strong>{product.label.toUpperCase()}</strong><i/></span>
    <span className="dt-feature-card-bottom"><span>ONE TAP. MORE REVIEWS.</span><span>01 / 03</span></span>
    <i className="dt-feature-card-shine"/>
   </span>
   <span className="dt-feature-card-face dt-feature-card-back">
    <span className="dt-feature-card-top"><b>DITAPAJA®</b><QrCode size={21}/></span>
    <span className="dt-feature-qr"><QrCode size={76}/><small>SCAN TO REVIEW</small></span>
    <span className="dt-feature-card-bottom"><span>NFC ENABLED</span><span>EST. 2026</span></span>
   </span>
  </button>
 </div>
}

export default function ProductCarousel({products}:{products:Product[]}){
 const [selected,setSelected]=useState(products[0]?.tone??"");
 const [flipped,setFlipped]=useState(false);
 const [details,setDetails]=useState(false);
 const product=products.find(p=>p.tone===selected)??products[0];
 if(!product)return null;
 const index=products.findIndex(p=>p.tone===product.tone);
 return <div className="dt-collection-experience">
  <div className="dt-collection-stage">
   <div className="dt-stage-copy">
    <div className="dt-stage-overline"><span>THE OBJECTS / 0{index+1}</span><i/> <span>DITAPAJA COLLECTION</span></div>
    <div className="dt-stage-title"><span className="dt-stage-edition">EDITION 0{index+1}</span><h3>{product.label}<em>.</em></h3></div>
    <p className="dt-stage-description">{product.description}</p>
    <div className="dt-stage-specs"><span><Nfc size={15}/> NFC TECHNOLOGY</span><span><QrCode size={15}/> QR BACKUP</span><span><Check size={15}/> FREE DASHBOARD</span></div>
    <div className="dt-stage-price"><span>INVEST IN BETTER CONNECTION</span><strong>{product.price}</strong><small>/ kartu</small></div>
    <div className="dt-stage-actions">
     <Link href={"/pesan?product="+product.tone} className="dt-stage-primary">{product.mode==="preorder"?"Request pre-order":"Pilih edisi ini"}<ArrowUpRight size={17}/></Link>
     <button type="button" className="dt-stage-detail" onClick={()=>setDetails(!details)}>{details?"Tutup detail":"What's included"}<ArrowDownRight size={15}/></button>
    </div>
    <div className={"dt-stage-included "+(details?"is-open":"")} aria-hidden={!details}>
     <span><Check size={14}/> Kartu NFC siap pakai</span><span><Check size={14}/> QR Code cadangan</span><span><Check size={14}/> Dashboard tanpa biaya bulanan</span>
    </div>
   </div>
   <div className="dt-stage-art">
    <div className="dt-art-orbit dt-art-orbit-a"/><div className="dt-art-orbit dt-art-orbit-b"/>
    <span className="dt-art-index">0{index+1}<i/>03</span>
    <span className="dt-art-edition">{product.mode==="preorder"?"MADE TO ORDER":"THE CORE EDITION"}</span>
    <FeatureCard product={product} flipped={flipped} onFlip={()=>setFlipped(!flipped)}/>
    <button type="button" className="dt-flip-hint" onClick={()=>setFlipped(!flipped)}><FlipHorizontal2 size={14}/> {flipped?"Lihat sisi depan":"Balik kartu"}</button>
    <span className="dt-art-caption">A SMALL OBJECT. A BETTER EXPERIENCE.</span>
   </div>
  </div>
  <div className="dt-edition-selector">
   <div className="dt-selector-heading"><span>CHOOSE YOUR EDITION</span><span>{String(index+1).padStart(2,"0")} / {String(products.length).padStart(2,"0")}</span></div>
   <div className="dt-selector-options">
    {products.map((p,i)=><button type="button" key={p.tone} className={"dt-selector-option "+(p.tone===product.tone?"is-active":"")} onClick={()=>{setSelected(p.tone);setFlipped(false);setDetails(false)}} aria-pressed={p.tone===product.tone}>
     <span className={"dt-selector-swatch swatch-"+p.tone}><i/></span><span className="dt-selector-name"><small>0{i+1} / EDITION</small><b>{p.label}</b><em>{p.mode==="preorder"?"PRE-ORDER":"AVAILABLE"}</em></span><strong>{p.price}</strong><ChevronRight size={17}/>
    </button>)}
   </div>
  </div>
  <div className="dt-collection-signoff"><Sparkles size={15}/><span>THOUGHTFULLY DESIGNED. READY TO BE YOURS.</span><i/> <span>NO MONTHLY FEE</span></div>
 </div>
}
