"use client";
import Link from "next/link";
import {ArrowUpRight,Check,Nfc} from "lucide-react";

type Product={name:string;label:string;description:string;tone:string;price:string;order:string;action:string;mode:string};

function CardMock({tone,label}:{tone:string;label:string}){
 return <div className={`dt-showcase-card dt-showcase-${tone}`} aria-label={`Kartu NFC edisi ${label}`}>
  <div className="dt-showcase-card-top"><span>REVIEW CARD</span><Nfc size={18}/></div>
  <div className="dt-showcase-card-main"><strong>{label.toUpperCase()}</strong><i/></div>
  <div className="dt-showcase-card-bottom"><span>ONE TAP. MORE REVIEWS.</span><span>NFC · QR</span></div>
 </div>
}

export default function ProductCarousel({products}:{products:Product[]}){
 return <div className="catalog-slider dt-collection-grid">
  {products.map((p,i)=>(
   <article className={`dt-edition-card dt-edition-${p.tone}`} key={p.tone}>
    <div className="dt-edition-visual">
     <div className="dt-edition-visual-glow"/>
     <CardMock tone={p.tone} label={p.label}/>
     <span className={`dt-edition-status ${p.mode==="preorder"?"is-preorder":""}`}>{p.mode==="preorder"?"PRE-ORDER":"READY TO ORDER"}</span>
    </div>
    <div className="dt-edition-content">
     <div className="dt-edition-heading"><div><span className="dt-edition-kicker">THE COLLECTION / 0{i+1}</span><h3>{p.label}</h3></div><Link href={`/products/${p.tone}`} className="dt-edition-more" aria-label={`Detail ${p.label}`}><ArrowUpRight size={18}/></Link></div>
     <p className="dt-edition-description">{p.description}</p>
     <div className="dt-edition-benefits"><span><Check size={13}/> NFC + QR Code</span><span><Check size={13}/> Dashboard gratis</span></div>
     <div className="dt-edition-purchase">
      <div className="dt-edition-price"><strong>{p.price}</strong><span>/ kartu</span></div>
      <Link href={`/pesan?product=${p.tone}`} className="dt-edition-cta">{p.mode==="preorder"?"Pesan sekarang":"Pilih kartu"}<ArrowUpRight size={16}/></Link>
     </div>
     <div className="dt-edition-footnote">Tanpa biaya bulanan</div>
    </div>
   </article>
  ))}
 </div>
}
