"use client";
import Link from "next/link";
import {ArrowUpRight,Check,Nfc,ShieldCheck} from "lucide-react";

type Product={name:string;label:string;description:string;tone:string;price:string;order:string;action:string;mode:string};

function CardMock({tone,label}:{tone:string;label:string}){
 return <div className={`dt-showcase-card dt-showcase-${tone}`} aria-label={`Kartu NFC edisi ${label}`}>
  <div className="dt-showcase-card-top"><span className="dt-showcase-edition">LIMITED EDITION</span><Nfc size={20}/></div>
  <div className="dt-showcase-card-main"><span>THE REVIEW CARD</span><strong>{label.toUpperCase()}</strong><i/></div>
  <div className="dt-showcase-card-bottom"><span>ONE TAP. MORE REVIEWS.</span><span>NFC / QR</span></div>
 </div>
}

export default function ProductCarousel({products}:{products:Product[]}){
 return <div className="catalog-slider dt-collection-grid">
  {products.map((p,i)=>(
   <article className={`dt-edition-card dt-edition-${p.tone}`} key={p.tone}>
    <div className="dt-edition-topline"><span>0{i+1} / THE EDITIONS</span><span className={`dt-edition-status ${p.mode==="preorder"?"is-preorder":""}`}>{p.mode==="preorder"?"MADE TO ORDER":"IN STOCK"}</span></div>
    <Link href={`/products/${p.tone}`} className={`dt-edition-visual dt-edition-visual-${p.tone}`} aria-label={`Lihat kartu edisi ${p.label}`}>
     <span className="dt-edition-backdrop-word">{p.label.toUpperCase()}</span>
     <span className="dt-edition-light"/>
     <CardMock tone={p.tone} label={p.label}/>
     <span className="dt-edition-visual-caption">NFC REVIEW CARD · {String(i+1).padStart(2,"0")}</span>
    </Link>
    <div className="dt-edition-content">
     <div className="dt-edition-title-row"><div><span className="dt-edition-kicker">THE {p.label.toUpperCase()} EDITION</span><h3>{p.label}</h3></div><span className="dt-edition-number">0{i+1}</span></div>
     <p className="dt-edition-description">{p.description}</p>
     <div className="dt-edition-benefits"><span><Check size={14}/> NFC & QR dalam satu kartu</span><span><Check size={14}/> Dashboard gratis, selamanya</span></div>
     <div className="dt-edition-purchase">
      <div className="dt-edition-price"><strong>{p.price}</strong><span>per kartu</span></div>
      <Link href={`/pesan?product=${p.tone}`} className="dt-edition-cta">{p.mode==="preorder"?"Pesan custom":"Pilih edisi"}<ArrowUpRight size={17}/></Link>
     </div>
     <div className="dt-edition-assurance"><ShieldCheck size={14}/> Tanpa biaya bulanan</div>
     <Link className="dt-edition-details" href={`/products/${p.tone}`}>Kenali edisi ini <ArrowUpRight size={14}/></Link>
    </div>
   </article>
  ))}
 </div>
}
