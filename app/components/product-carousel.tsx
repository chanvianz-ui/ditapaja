"use client";
import {useRef,useState} from "react";
import Link from "next/link";
import {ArrowLeft,ArrowRight,ArrowUpRight,BarChart3,Nfc,QrCode} from "lucide-react";
type Product={name:string;label:string;description:string;tone:string;price:string;before:string;discount:string;order:string;action:string;mode:string};
function CardMock({tone}:{tone:string}){return <div className={`simple-card ${tone}`}><div className="simple-card-top"><b>DiTapAja<span>.</span></b><Nfc size={23}/></div><div className="simple-card-center"><span>YOUR BUSINESS</span><strong>MAKE EVERY<br/>TAP COUNT.</strong></div><div className="simple-card-bottom"><span>NFC · QR CODE</span><span>10 × 10 CM</span></div></div>}
function orderLink(p:Product){
 const unitPrice=Number(p.price.replace(/[^0-9]/g,""))||0;
 const minimum=p.mode==="preorder"?10:1;
 const message=[
  "Halo DiTapAja, saya tertarik untuk memesan kartu.",
  "",
  `Produk: ${p.name}`,
  `Jenis pesanan: ${p.mode==="preorder"?"Pre-order custom":"Pembelian langsung"}`,
  `Harga per kartu: ${p.price}`,
  `Jumlah: ${minimum} kartu (minimum ${minimum} kartu)`,
  `Estimasi subtotal: Rp${(unitPrice*minimum).toLocaleString("id-ID")}`,
  "",
  "Nama bisnis:",
  "Nama pemesan:",
  "Alamat pengiriman:",
  "",
  "Mohon informasikan ketersediaan, ongkir, dan langkah pembayaran. Terima kasih."
 ].join("\n");
 return `https://wa.me/6281321778081?text=${encodeURIComponent(message)}`;
}
export default function ProductCarousel({products}:{products:Product[]}){
 const SHOPEE_STORE_URL="https://shopee.co.id/bekasidigicam";
 const track=useRef<HTMLDivElement>(null);const [progress,setProgress]=useState(0);
 const move=(direction:number)=>{const el=track.current;if(!el)return;const card=el.querySelector<HTMLElement>(".concept-product");const gap=18;el.scrollBy({left:direction*((card?.getBoundingClientRect().width||el.clientWidth)+gap),behavior:"smooth"});};
 const onScroll=()=>{const el=track.current;if(!el)return;const max=el.scrollWidth-el.clientWidth;setProgress(max>0?el.scrollLeft/max:0)};
 return <div className="catalog-slider">
  <div className="catalog-slider-controls"><span>Pilih desain kartu</span><div><button type="button" aria-label="Produk sebelumnya" onClick={()=>move(-1)}><ArrowLeft size={17}/></button><button type="button" aria-label="Produk berikutnya" onClick={()=>move(1)}><ArrowRight size={17}/></button></div></div>
  <div className="catalog-track" ref={track} onScroll={onScroll}>
   {products.map((p,i)=><article className="concept-product" key={p.tone}><div className={`concept-product-art ${p.tone}`}><div className="concept-product-art-top"><span>{p.label}</span><span>{p.discount}</span></div><CardMock tone={p.tone}/><div className="concept-product-art-bottom"><span>DITAPAJA®</span><span>10 × 10 CM</span></div></div><div className="concept-product-body"><div className="concept-product-meta"><span>{p.order}</span><span>0{i+1} / 03</span></div><h3><Link href={`/products/${p.tone}`}>{p.name}</Link></h3><p>{p.description}</p><div className="concept-product-includes"><span><Nfc size={13}/> NFC</span><span><QrCode size={13}/> QR Code</span><span><BarChart3 size={13}/> Dashboard</span></div><div className="concept-product-buy"><div><small>{p.before}</small><strong>{p.price}</strong><span>/ kartu</span></div><a href={p.mode==="preorder"?orderLink(p):SHOPEE_STORE_URL} target="_blank" rel="noopener noreferrer">{p.mode==="preorder"?p.action:"Beli di Shopee"}<ArrowUpRight size={16}/></a></div><Link className="concept-product-detail-link" href={`/products/${p.tone}`}>Lihat detail produk <ArrowUpRight size={14}/></Link></div></article>)}
  </div>
  <div className="catalog-slider-progress"><span style={{transform:`translateX(${progress*194}%)`}}/></div>
 </div>
}
