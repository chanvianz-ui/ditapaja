"use client";
import Link from "next/link";
import {ArrowUpRight,BarChart3,Nfc,QrCode} from "lucide-react";

type Product={name:string;label:string;description:string;tone:string;price:string;order:string;action:string;mode:string};

function CardMock({tone}:{tone:string}){
 return <div className={`simple-card ${tone}`} aria-label={`Preview kartu ${tone}`}>
  <div className="simple-card-top"><b>DITAPAJA / NFC</b><Nfc size={22}/></div>
  <div className="simple-card-center"><span>YOUR BUSINESS</span><strong>MAKE EVERY<br/>TAP COUNT.</strong></div>
  <div className="simple-card-bottom"><span>CONTACTLESS REVIEW</span><span> NFC · QR</span></div>
 </div>
}

export default function ProductCarousel({products}:{products:Product[]}){
 return <div className="catalog-slider dt-collection-grid">
  {products.map((p,i)=>(
   <article className={`concept-product dt-product-card ${i===0?"is-featured":"is-compact"}`} key={p.tone}>
    <div className="dt-product-card-head">
     <span className="dt-product-family">DITAPAJA / COLLECTION</span>
     <span className="dt-product-availability">{p.mode==="preorder"?"MADE TO ORDER":"AVAILABLE"}</span>
    </div>
    <Link href={`/products/${p.tone}`} className={`concept-product-art dt-product-object ${p.tone}`} aria-label={`Lihat detail ${p.name}`}>
     <CardMock tone={p.tone}/>
     <span className="dt-product-object-caption">NFC REVIEW CARD</span>
    </Link>
    <div className="concept-product-body">
     <div className="dt-product-title-row"><h3><Link href={`/products/${p.tone}`}>{p.name}</Link></h3><span className="dt-product-index">{String(i+1).padStart(2,"0")}</span></div>
     <p>{p.description}</p>
     <div className="concept-product-includes"><span><Nfc size={13}/> NFC</span><span><QrCode size={13}/> QR Code</span><span><BarChart3 size={13}/> Dashboard</span></div>
     <div className="concept-product-buy"><div><strong>{p.price}</strong><span> / kartu</span></div><Link href={`/pesan?product=${p.tone}`} className="catalog-order-link">{p.mode==="preorder"?"Pre-order":"Pesan kartu"}<ArrowUpRight size={16}/></Link></div>
     <Link className="concept-product-detail-link" href={`/products/${p.tone}`}>Spesifikasi produk <ArrowUpRight size={14}/></Link>
    </div>
   </article>
  ))}
 </div>
}
