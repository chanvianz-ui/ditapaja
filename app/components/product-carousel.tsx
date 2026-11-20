"use client";
import Link from "next/link";
import {ArrowUpRight,BarChart3,Nfc,QrCode,Check} from "lucide-react";

type Product={name:string;label:string;description:string;tone:string;price:string;order:string;action:string;mode:string};

function CardMock({tone,label}:{tone:string;label:string}){
 return <div className={`simple-card ${tone}`} aria-label={`Preview kartu ${label}`}>
  <div className="simple-card-top"><b>DiTapAja<span>.</span></b><Nfc size={20}/></div>
  <div className="simple-card-center"><span>YOUR BUSINESS, ONE TAP AWAY</span><strong>MAKE EVERY<br/>TAP COUNT.</strong></div>
  <div className="simple-card-bottom"><span>{label.toUpperCase()}</span><span>NFC · QR</span></div>
 </div>
}

export default function ProductCarousel({products}:{products:Product[]}){
 return <div className="catalog-slider dt-collection-grid">
  {products.map((p,i)=>(
   <article className={`concept-product dt-product-card dt-product-${p.tone}`} key={p.tone}>
    <div className="dt-product-card-head">
     <span className="dt-product-index">0{i+1} <i/> COLLECTION</span>
     <span className={`dt-product-availability ${p.mode==="preorder"?"is-preorder":""}`}>{p.order}</span>
    </div>
    <Link href={`/products/${p.tone}`} className={`concept-product-art dt-product-object ${p.tone}`} aria-label={`Lihat detail ${p.name}`}>
     <div className="dt-product-art-glow"/>
     <CardMock tone={p.tone} label={p.label}/>
     <span className="dt-product-art-caption">NFC REVIEW CARD</span>
    </Link>
    <div className="concept-product-body">
     <div className="dt-product-title-row"><div><span className="dt-product-overline">THE {p.label.toUpperCase()} EDITION</span><h3><Link href={`/products/${p.tone}`}>{p.name}</Link></h3></div><span className="dt-product-arrow"><ArrowUpRight size={18}/></span></div>
     <p>{p.description}</p>
     <div className="dt-product-includes"><span><Check size={13}/> Kartu NFC</span><span><Check size={13}/> QR Code</span><span><Check size={13}/> Dashboard gratis</span></div>
     <div className="dt-product-buy">
      <div className="dt-product-price"><strong>{p.price}</strong><span>per kartu</span></div>
      <Link href={`/pesan?product=${p.tone}`} className="catalog-order-link">{p.mode==="preorder"?"Pre-order sekarang":"Pilih kartu"}<ArrowUpRight size={16}/></Link>
     </div>
     <Link className="concept-product-detail-link" href={`/products/${p.tone}`}>Lihat detail & spesifikasi <ArrowUpRight size={14}/></Link>
    </div>
   </article>
  ))}
 </div>
}
