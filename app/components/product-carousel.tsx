"use client";
import Link from "next/link";
import {ArrowUpRight,BarChart3,Nfc,QrCode} from "lucide-react";
type Product={name:string;label:string;description:string;tone:string;price:string;order:string;action:string;mode:string};
function CardMock({tone}:{tone:string}){return <div className={`simple-card ${tone}`}><div className="simple-card-top"><b>DiTapAja<span>.</span></b><Nfc size={23}/></div><div className="simple-card-center"><span>YOUR BUSINESS</span><strong>MAKE EVERY<br/>TAP COUNT.</strong></div></div>}
export default function ProductCarousel({products}:{products:Product[]}){
 return <div className="catalog-slider dt-collection-grid">
  {products.map((p,i)=><article className={`concept-product ${i===0?"is-featured":"is-compact"}`} key={p.tone}>
   <div className={`concept-product-art ${p.tone}`}><CardMock tone={p.tone}/></div>
   <div className="concept-product-body"><h3><Link href={`/products/${p.tone}`} aria-label={`Lihat detail ${p.name}`}>{p.name}</Link></h3><p>{p.description}</p><div className="concept-product-includes"><span><Nfc size={13}/> NFC</span><span><QrCode size={13}/> QR Code</span><span><BarChart3 size={13}/> Dashboard</span></div><div className="concept-product-buy"><div><strong>{p.price}</strong><span>/ kartu</span></div><Link href={`/pesan?product=${p.tone}`} className="catalog-order-link" aria-label={`${p.mode==="preorder"?"Pre-order":"Pesan"} ${p.name}`}>{p.mode==="preorder"?"Pre-order":"Pesan sekarang"}<ArrowUpRight size={16}/></Link></div><Link className="concept-product-detail-link" href={`/products/${p.tone}`}>Lihat detail produk <ArrowUpRight size={14}/></Link></div>
  </article>)}
 </div>
}
