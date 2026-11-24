"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight, ChevronRight, Layers3,
  Nfc
} from "lucide-react";

type Product = {
  name: string; label: string; description: string; tone: string;
  price: string; order: string; action: string; mode: string;
};

function FeatureCard({ product }: { product: Product }) {
  return (
    <div className="dt-feature-card-wrap">
      <div className={"dt-feature-card dt-feature-" + product.tone} role="img" aria-label={"Kartu DiTapAja " + product.label}>
        <span className="dt-feature-card-face dt-feature-card-front">
          <span className="dt-feature-card-top"><b>DITAPAJA®</b><Nfc size={21}/></span>
          <span className="dt-feature-card-center">
            <span className="dt-card-signal" aria-hidden="true"><i/><i/><i/><b/></span>
            <strong>{product.label.toUpperCase()}</strong>
            <small>YOUR BUSINESS. ONE TAP AWAY.</small>
          </span>
          <span className="dt-feature-card-bottom"><span>SMART NFC REVIEW CARD</span><span>01 / DTA</span></span>
          <i className="dt-feature-card-shine"/>
          <i className="dt-feature-card-grain"/>
        </span>
      </div>
    </div>
  );
}

export default function ProductCarousel({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState(products[0]?.tone ?? "");
  const product = products.find(p => p.tone === selected) ?? products[0];
  if (!product) return null;
  const choose = (tone: string) => setSelected(tone);

  return (
    <div className="dt-collection-experience">
      <div className="dt-collection-toolbar">
        <span><i/> THE COLLECTION</span>
       </div>

      <div className="dt-collection-stage" key={product.tone}>
        <div className="dt-stage-copy">
          <div className="dt-stage-title">
            <h3>{product.label}<em>.</em></h3>
          </div>
           <div className="dt-stage-price">
            <span>PEMBAYARAN SEKALI</span>
            <strong>{product.price}</strong><small>/ kartu</small>
          </div>
          <div className="dt-stage-actions">
            <Link href={"/pesan?product=" + product.tone} className="dt-stage-primary">
              {product.mode === "preorder" ? "Request pre-order" : "Pilih edisi ini"}<ArrowUpRight size={18}/>
            </Link>
            <Link href={"/products/" + product.tone} className="dt-stage-detail">
              Detail produk<ArrowUpRight size={15}/>
            </Link>
          </div>
        </div>

        <div className="dt-stage-art">
          <div className="dt-art-grid"/>
          <div className="dt-art-glow"/>
          <div className="dt-art-orbit dt-art-orbit-a"/><div className="dt-art-orbit dt-art-orbit-b"/><div className="dt-art-orbit dt-art-orbit-c"/>
          <div className="dt-art-crosshair dt-art-crosshair-a"/><div className="dt-art-crosshair dt-art-crosshair-b"/>
          <FeatureCard product={product}/>
        </div>
      </div>

      <div className="dt-edition-selector">
        <div className="dt-selector-heading">
          <span><Layers3 size={14}/> PILIH KARTU</span>
          <small>Temukan tampilan yang paling pas untuk bisnismu</small>
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
