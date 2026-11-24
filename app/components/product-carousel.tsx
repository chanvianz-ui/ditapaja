"use client";

import { useState, type CSSProperties, type PointerEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, Layers3, Nfc, Sparkles } from "lucide-react";

type Product = {
  name: string;
  label: string;
  description: string;
  tone: string;
  price: string;
  order: string;
  action: string;
  mode: string;
};

function FeatureCard({ product }: { product: Product }) {
  const [nfcActive, setNfcActive] = useState(false);

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    event.currentTarget.style.setProperty("--tilt-x", ((0.5 - y) * 13).toFixed(2) + "deg");
    event.currentTarget.style.setProperty("--tilt-y", ((x - 0.5) * 16).toFixed(2) + "deg");
    event.currentTarget.style.setProperty("--shine-x", (x * 100).toFixed(1) + "%");
    event.currentTarget.style.setProperty("--shine-y", (y * 100).toFixed(1) + "%");
  };

  const resetPointer = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.style.setProperty("--tilt-x", "0deg");
    event.currentTarget.style.setProperty("--tilt-y", "0deg");
    event.currentTarget.style.setProperty("--shine-x", "50%");
    event.currentTarget.style.setProperty("--shine-y", "50%");
  };

  return (
    <div className="dt-feature-card-wrap">
      <button
        type="button"
        className={"dt-feature-card dt-feature-" + product.tone + (nfcActive ? " is-nfc-active" : "")}
        onClick={() => setNfcActive(value => !value)}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointer}
        aria-pressed={nfcActive}
        aria-label={(nfcActive ? "Matikan" : "Aktifkan") + " simulasi NFC kartu " + product.label}
        style={{ "--tilt-x": "0deg", "--tilt-y": "0deg", "--shine-x": "50%", "--shine-y": "50%" } as CSSProperties}
      >
        <span className="dt-card-edge" aria-hidden="true"/>
        <span className="dt-feature-card-face dt-feature-card-front">
          <span className="dt-card-material-line" aria-hidden="true"/>
          <span className="dt-feature-card-top">
            <b>DITAPAJA<span>®</span></b>
            <span className="dt-card-chip"><Nfc size={19}/><small>CONTACTLESS</small></span>
          </span>
          <span className="dt-feature-card-center">
            <span className="dt-card-signal" aria-hidden="true"><i/><i/><i/><b/></span>
            <strong>{product.label.toUpperCase()}</strong>
            <small>YOUR BUSINESS. ONE TAP AWAY.</small>
          </span>
          <span className="dt-feature-card-bottom"><span>SMART NFC REVIEW CARD</span><span>01 / DTA</span></span>
          <span className="dt-card-live-status"><i/>{nfcActive ? "FIELD ACTIVATED" : "NFC READY"}</span>
          <i className="dt-feature-card-shine" aria-hidden="true"/>
          <i className="dt-feature-card-grain" aria-hidden="true"/>
          <i className="dt-card-scanline" aria-hidden="true"/>
          <span className="dt-card-tap-hint">{nfcActive ? "TAP AGAIN TO RESET" : "TAP CARD TO TEST NFC"}</span>
          <span className="dt-card-corner-mark" aria-hidden="true"><Sparkles size={14}/></span>
        </span>
      </button>
    </div>
  );
}

export default function ProductCarousel({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState(products[0]?.tone ?? "");
  const product = products.find(p => p.tone === selected) ?? products[0];
  if (!product) return null;

  return (
    <div className="dt-collection-experience">
      <div className="dt-collection-toolbar">
        <span><i/> THE COLLECTION</span>
      </div>

      <div className="dt-collection-stage" data-tone={product.tone} key={product.tone}>
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

        <div className="dt-stage-art" data-tone={product.tone}>
          <div className="dt-art-grid"/>
          <div className="dt-art-glow"/>
          <div className="dt-art-orbit dt-art-orbit-a"/><div className="dt-art-orbit dt-art-orbit-b"/><div className="dt-art-orbit dt-art-orbit-c"/>
          <div className="dt-art-crosshair dt-art-crosshair-a"/><div className="dt-art-crosshair dt-art-crosshair-b"/>
          <FeatureCard product={product}/>
          <span className="dt-art-edition-index">EDITION / 0{products.findIndex(p => p.tone === product.tone) + 1}</span>
        </div>
      </div>

      <div className="dt-edition-selector">
        <div className="dt-selector-heading">
          <span><Layers3 size={14}/> PILIH KARTU</span>
          <small>Setiap edisi punya karakter visual berbeda</small>
        </div>
        <div className="dt-selector-options">
          {products.map((p) => (
            <button type="button" key={p.tone}
              className={"dt-selector-option " + (p.tone === product.tone ? "is-active" : "")}
              onClick={() => setSelected(p.tone)} aria-pressed={p.tone === product.tone}>
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
