"use client";
import Link from "next/link";
import {ArrowUpRight,Check,Nfc,ShieldCheck,Sparkles} from "lucide-react";

type Product={name:string;label:string;description:string;tone:string;price:string;order:string;action:string;mode:string};

function CardMock({tone,label}:{tone:string;label:string}){
 return <div className={`dt-physical-card dt-card-${tone}`} aria-label={`Kartu NFC edisi ${label}`}>
  <div className="dt-physical-card-top">
   <span className="dt-card-brandmark">D<span>.</span></span>
   <span className="dt-card-nfc"><Nfc size={19}/></span>
  </div>
  <div className="dt-physical-card-center">
   <span>THE REVIEW CARD</span>
   <strong>{label.toUpperCase()}</strong>
   <i/>
  </div>
  <div className="dt-physical-card-bottom">
   <span>ONE TAP. ONE BETTER CONNECTION.</span>
   <span>01 / NFC</span>
  </div>
 </div>
}

export default function ProductCarousel({products}:{products:Product[]}){
 return <div className="catalog-slider dt-collection-grid">
  {products.map((p,i)=>(
   <article className={`concept-product dt-product-card dt-product-${p.tone}`} key={p.tone}>
    <div className="dt-product-card-head">
     <span className="dt-product-index">0{i+1} <i/> THE COLLECTION</span>
     <span className={`dt-product-availability ${p.mode==="preorder"?"is-preorder":""}`}>{p.mode==="preorder"?"MADE TO ORDER":"AVAILABLE NOW"}</span>
    </div>
    <Link href={`/products/${p.tone}`} className={`concept-product-art dt-product-object ${p.tone}`} aria-label={`Lihat kartu undefined`}>
     <div className="dt-product-art-glow"/>
     <div className="dt-product-stage-shadow"/>
     <CardMock tone={p.tone} label={p.label}/>
     <span className="dt-product-art-caption">NFC + QR REVIEW CARD</span>
    </Link>
    <div className="concept-product-body">
     <div className="dt-product-title-row">
      <div><span className="dt-product-overline">DITAPAJA COLLECTION</span><h3><Link href={`/products/${p.tone}`}>{p.label}</Link></h3></div>
      <span className="dt-product-arrow"><ArrowUpRight size={18}/></span>
     </div>
     <p>{p.description}</p>
     <div className="dt-product-value-line"><Sparkles size={14}/><span>Semua yang kamu butuhkan untuk mengumpulkan review.</span></div>
     <div className="dt-product-includes">
      <span><Check size={13}/> Kartu NFC</span><span><Check size={13}/> QR Code</span><span><Check size={13}/> Dashboard gratis</span>
     </div>
     <div className="dt-product-buy">
      <div className="dt-product-price"><strong>{p.price}</strong><span>Harga per kartu</span></div>
      <Link href={`/pesan?product=${p.tone}`} className="catalog-order-link">{p.mode==="preorder"?"Pesan custom":"Pilih edisi"}<ArrowUpRight size={16}/></Link>
     </div>
     <div className="dt-product-trust"><ShieldCheck size={13}/><span>Tanpa biaya langganan bulanan</span></div>
     <Link className="concept-product-detail-link" href={`/products/${p.tone}`}>Lihat detail produk <ArrowUpRight size={14}/></Link>
    </div>
   </article>
  ))}
 </div>
}
