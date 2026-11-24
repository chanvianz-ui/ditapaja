"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, ChevronRight, Layers3, Nfc } from "lucide-react";

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

  return (
    <div className={"dt-object-display dt-object-" + product.tone}>
      <button
        type="button"
        className={"dt-object-card" + (nfcActive ? " is-active" : "")}
        onClick={() => setNfcActive(value => !value)}
        aria-pressed={nfcActive}
        aria-label={(nfcActive ? "Matikan" : "Aktifkan") + " simulasi NFC kartu " + product.label}
      >
        <span className="dt-object-card-inner">
          <span className="dt-object-topline">
            <b>DITAPAJA<span>®</span></b>
            <span className="dt-object-edition">OBJECT / 0{product.tone === "noir" ? "1" : product.tone === "blanc" ? "2" : "3"}</span>
          </span>
          <span className="dt-object-center">
            <span className="dt-object-nfc"><Nfc size={27}/></span>
            <strong>{product.label}</strong>
            <small>YOUR BUSINESS. ONE TAP AWAY.</small>
          </span>
          <span className="dt-object-bottom">
            <span>SMART REVIEW SYSTEM</span>
            <span className="dt-object-status"><i/>{nfcActive ? "CONNECTED" : "READY TO TAP"}</span>
          </span>
          <span className="dt-object-active-label">{nfcActive ? "NFC FIELD ACTIVE" : "TAP TO INTERACT"}</span>
        </span>
      </button>
      <div className="dt-object-caption">
        <span><i/> MATERIAL STUDY / {product.label.toUpperCase()}</span>
        <span>01 — 03</span>
      </div>
    </div>
  );
}

export default function ProductCarousel({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState(products[0]?.tone ?? "");
  const product = products.find(p => p.tone === selected) ?? products[0];
  if (!product) return null;

  return (
    <div className="dt-collection-experience dt-collection-editorial">
      <div className="dt-collection-toolbar">
        <span><i/> THE COLLECTION</span>
        <small>DESIGNED TO BE REMEMBERED</small>
      </div>

      <div className="dt-collection-stage" data-tone={product.tone} key={product.tone}>
        <div className="dt-stage-copy">
          <div className="dt-stage-title">
            <span className="dt-editorial-kicker">THE NFC OBJECT / 2026</span>
            <h3>{product.label}<em>.</em></h3>
          </div>
          <div className="dt-editorial-description">
            <span>AN OBJECT WITH A PURPOSE</span>
            <p>{product.description}</p>
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

      <div className="dt-edition-selector dt-editorial-selector">
        <div className="dt-selector-heading">
          <span><Layers3 size={14}/> SELECT YOUR OBJECT</span>
          <small>THREE FINISHES. ONE SMART EXPERIENCE.</small>
        </div>
        <div className="dt-selector-options">
          {products.map((p, index) => (
            <button type="button" key={p.tone}
              className={"dt-selector-option dt-editorial-option " + (p.tone === product.tone ? "is-active" : "")}
              onClick={() => setSelected(p.tone)} aria-pressed={p.tone === product.tone}>
              <span className={"dt-editorial-swatch swatch-" + p.tone}><i/></span>
              <span className="dt-selector-name"><small>0{index + 1} / {p.mode === "preorder" ? "MADE TO ORDER" : "IN STOCK"}</small><b>{p.label}</b><em>{p.mode === "preorder" ? "PRE-ORDER" : "AVAILABLE NOW"}</em></span>
              <strong>{p.price}</strong>
              <span className="dt-option-check">{p.tone === product.tone ? <Check size={15}/> : <ChevronRight size={17}/>}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
