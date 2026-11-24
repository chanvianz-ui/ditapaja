"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight, ArrowUpRight, ChevronRight, Layers3,
  Nfc, QrCode
} from "lucide-react";

type Product = {
  name: string; label: string; description: string; tone: string;
  price: string; order: string; action: string; mode: string;
};

function FeatureCard({ product, flipped, onFlip }: {
  product: Product; flipped: boolean; onFlip: () => void;
}) {
  return (
    <div className={"dt-feature-card-wrap " + (flipped ? "is-flipped" : "")}
      onPointerMove={(event) => {
        if (event.pointerType === "touch") return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        event.currentTarget.style.setProperty("--tilt-x", (x * 17).toFixed(2) + "deg");
        event.currentTarget.style.setProperty("--tilt-y", (y * -13).toFixed(2) + "deg");
      }}
      onPointerLeave={(event) => {
        event.currentTarget.style.setProperty("--tilt-x", "0deg");
        event.currentTarget.style.setProperty("--tilt-y", "0deg");
      }}>
      <button type="button" className="dt-feature-card" onClick={onFlip}
        aria-label={flipped ? "Lihat sisi depan kartu" : "Balik kartu untuk melihat sisi belakang"} aria-pressed={flipped}>
        <span className={"dt-feature-card-face dt-feature-card-front dt-feature-" + product.tone}>
          <span className="dt-feature-card-top"><b>DITAPAJA®</b><Nfc size={21}/></span>
          <span className="dt-feature-card-center"><small>REVIEW MADE SIMPLE</small><strong>{product.label.toUpperCase()}</strong><i/></span>
          <span className="dt-feature-card-bottom"><span>ONE TAP. MORE REVIEWS.</span></span>
          <i className="dt-feature-card-shine"/>
          <i className="dt-feature-card-grain"/>
        </span>
        <span className="dt-feature-card-face dt-feature-card-back">
          <span className="dt-feature-card-top"><b>DITAPAJA®</b><QrCode size={21}/></span>
          <span className="dt-feature-qr"><QrCode size={82}/><small>SCAN TO REVIEW</small></span>
          <span className="dt-feature-card-bottom"><span>NFC ENABLED</span><span>EST. 2026</span></span>
        </span>
      </button>
    </div>
  );
}

export default function ProductCarousel({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState(products[0]?.tone ?? "");
  const [flipped, setFlipped] = useState(false);
  const [details, setDetails] = useState(false);
  const product = products.find(p => p.tone === selected) ?? products[0];
  if (!product) return null;
  const choose = (tone: string) => { setSelected(tone); setFlipped(false); setDetails(false); };

  return (
    <div className="dt-collection-experience">
      <div className="dt-collection-toolbar">
        <span><i/> THE COLLECTION</span>
       </div>

      <div className="dt-collection-stage" key={product.tone}>
        <div className="dt-stage-copy">
          <div className="dt-stage-title">
            <span className="dt-stage-edition">{product.mode === "preorder" ? "LIMITED RELEASE" : "CORE SERIES"}</span>
            <h3>{product.label}<em>.</em></h3>
          </div>
          <p className="dt-stage-description">{product.description}</p>
           <div className="dt-stage-price">
            <span>PEMBAYARAN SEKALI</span>
            <strong>{product.price}</strong><small>/ kartu</small>
          </div>
          <div className="dt-stage-actions">
            <Link href={"/pesan?product=" + product.tone} className="dt-stage-primary">
              {product.mode === "preorder" ? "Request pre-order" : "Pilih edisi ini"}<ArrowUpRight size={18}/>
            </Link>
            <button type="button" className="dt-stage-detail" onClick={() => setDetails(!details)} aria-expanded={details}>
              {details ? "Tutup detail" : "Detail koleksi"}<ArrowDownRight size={15}/>
            </button>
          </div>
          <div className={"dt-stage-included dt-stage-collection-details " + (details ? "is-open" : "")} aria-hidden={!details} inert={!details}>
            <span><Nfc size={14}/> Kartu NFC siap pakai</span>
            <span><QrCode size={14}/> QR Code cadangan</span>
            <span>Dashboard gratis</span>
          </div>
        </div>

        <div className="dt-stage-art">
          <div className="dt-art-grid"/>
          <div className="dt-art-glow"/>
          <div className="dt-art-orbit dt-art-orbit-a"/><div className="dt-art-orbit dt-art-orbit-b"/><div className="dt-art-orbit dt-art-orbit-c"/>
          <div className="dt-art-crosshair dt-art-crosshair-a"/><div className="dt-art-crosshair dt-art-crosshair-b"/>
          <FeatureCard product={product} flipped={flipped} onFlip={() => setFlipped(!flipped)}/>
          <div className="dt-art-control-dock">
            <span><i/> {flipped ? "REVERSE SIDE" : "FRONT SIDE"}</span>
            <button type="button" onClick={() => setFlipped(!flipped)} aria-pressed={flipped}>
              {flipped ? "Kembali ke depan" : "Lihat sisi belakang"}<span>↗</span>
            </button>
          </div>
        </div>
      </div>

      <div className="dt-edition-selector">
        <div className="dt-selector-heading">
          <span><Layers3 size={14}/> PILIH VARIAN</span>
        </div>
        <div className="dt-selector-options">
          {products.map((p, i) => (
            <button type="button" key={p.tone}
              className={"dt-selector-option " + (p.tone === product.tone ? "is-active" : "")}
              onClick={() => choose(p.tone)} aria-pressed={p.tone === product.tone}>
              <span className={"dt-selector-swatch swatch-" + p.tone}><i/></span>
              <span className="dt-selector-name"><small>{p.mode === "preorder" ? "DIBUAT KHUSUS" : "READY TO ORDER"}</small><b>{p.label}</b><em>{p.mode === "preorder" ? "PRE-ORDER" : "AVAILABLE"}</em></span>
              <strong>{p.price}</strong><ChevronRight size={18}/>
            </button>
          ))}
        </div>
      </div>

     </div>
  );
}
