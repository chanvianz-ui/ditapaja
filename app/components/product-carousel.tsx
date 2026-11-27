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

function ProductObject({ product }: { product: Product }) {
  const serial = product.tone === "noir" ? "01" : product.tone === "blanc" ? "02" : "03";

  return (
    <div
      className={"dt-neo-display dt-neo-" + product.tone}
      role="img"
      aria-label={"Visualisasi kartu DiTapAja " + product.label}
    >
      <div className="dt-neo-card">
        <span className="dt-neo-grain" aria-hidden="true"/>
        <span className="dt-neo-rail" aria-hidden="true"/>
        <span className="dt-neo-top">
          <span className="dt-neo-brand"><i/>DITAPAJA<span>®</span></span>
          <span className="dt-neo-serial">COLLECTION / {serial}</span>
        </span>
        <span className="dt-neo-main">
          <span className="dt-neo-index" aria-hidden="true">{serial}</span>
          <span className="dt-neo-copy">
            <small>SMART REVIEW OBJECT</small>
            <strong>{product.label}</strong>
            <em>ONE TAP. A BETTER CONNECTION.</em>
          </span>
          <span className="dt-neo-emblem" aria-hidden="true">
            <i/><i/><i/>
            <Nfc size={27} strokeWidth={1.25}/>
          </span>
        </span>
        <span className="dt-neo-bottom">
          <span className="dt-neo-material">{product.tone === "noir" ? "OBSIDIAN / MATTE" : product.tone === "blanc" ? "PORCELAIN / SATIN" : "BRONZE / SIGNATURE"}</span>
          <span className="dt-neo-signal"><i/>NFC + QR READY</span>
        </span>
        <span className="dt-neo-scan" aria-hidden="true"/>
      </div>
      <div className="dt-neo-caption">
        <span><i/> DITAPAJA / PHYSICAL COLLECTION</span>
        <span>0{serial} — 03</span>
      </div>
    </div>
  );
}

export default function ProductCarousel({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState(products[0]?.tone ?? "");
  const product = products.find(item => item.tone === selected) ?? products[0];
  if (!product) return null;

  return (
    <div className="dt-collection-experience dt-collection-editorial dt-neo-collection">
      <div className="dt-collection-toolbar">
        <span><i/> THE COLLECTION</span>
        <small>THREE FINISHES / ONE PURPOSE</small>
      </div>

      <div className="dt-collection-stage" data-tone={product.tone} key={product.tone}>
        <div className="dt-stage-copy">
          <div className="dt-stage-title">
            <span className="dt-editorial-kicker">THE NFC OBJECT / 2026</span>
            <h3>{product.label}<em>.</em></h3>
            <p className="dt-stage-description">{product.description}</p>
          </div>
          <div className="dt-stage-price">
            <span>PEMBAYARAN SEKALI</span>
            <strong>{product.price}</strong><small>/ kartu</small>
            <span className="dt-stage-availability">{product.order}</span>
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
          <ProductObject product={product}/>
          <span className="dt-art-edition-index">EDITION / 0{products.findIndex(item => item.tone === product.tone) + 1}</span>
        </div>
      </div>

      <div className="dt-edition-selector dt-neo-selector">
        <div className="dt-selector-heading">
          <span><Layers3 size={14}/> CHOOSE YOUR FINISH</span>
          <small>PILIH EDISI UNTUK MELIHAT DETAIL</small>
        </div>
        <div className="dt-selector-options">
          {products.map((item, index) => (
            <button
              type="button"
              key={item.tone}
              className={"dt-neo-option dt-neo-option-" + item.tone + (item.tone === product.tone ? " is-active" : "")}
              onClick={() => setSelected(item.tone)}
              aria-pressed={item.tone === product.tone}
            >
              <span className="dt-neo-option-preview"><i/><i/></span>
              <span className="dt-neo-option-copy">
                <small>0{index + 1} / {item.mode === "preorder" ? "MADE TO ORDER" : "IN STOCK"}</small>
                <b>{item.label}</b>
                <em>{item.price}</em>
              </span>
              <span className="dt-neo-option-state">{item.tone === product.tone ? <Check size={15}/> : <ChevronRight size={16}/>}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
