"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, ChevronRight, Nfc } from "lucide-react";
import type { ProductConfig } from "../lib/product-catalog";

type Product = ProductConfig;

function ProductObject({ product }: { product: Product }) {
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

        </span>
        <span className="dt-neo-main">
          <span className="dt-neo-index" aria-hidden="true">{serial}</span>
          <span className="dt-neo-copy">
            <small>NFC REVIEW CARD</small>
            <strong>{product.label}</strong>
            <em>ONE TAP. A BETTER CONNECTION.</em>
          </span>
          <span className="dt-neo-emblem" aria-hidden="true">
            <i/><i/><i/>
            <Nfc size={27} strokeWidth={1.25}/>
          </span>
        </span>
        <span className="dt-neo-bottom">
          <span className="dt-neo-material">{product.tone === "noir" ? "OBSIDIAN MATTE" : product.tone === "blanc" ? "PORCELAIN SATIN" : "BRONZE SIGNATURE"}</span>
          <span className="dt-neo-signal"><i/>NFC AND QR READY</span>
        </span>
        <span className="dt-neo-scan" aria-hidden="true"/>
      </div>
      <div className="dt-neo-caption">
        <span>DITAPAJA PHYSICAL COLLECTION</span>
      </div>
    </div>
  );
}

export default function ProductCarousel({ products }: { products: readonly Product[] }) {
  const [selected, setSelected] = useState(products[0]?.tone ?? "");
  const product = products.find(item => item.tone === selected) ?? products[0];
  if (!product) return null;

  return (
    <div className="dt-collection-experience dt-collection-editorial dt-neo-collection">
      <div className="dt-collection-toolbar">
        <span>CHOOSE YOUR FINISH</span>
      </div>

      <div className="dt-collection-stage" data-tone={product.tone} key={product.tone}>
        <div className="dt-stage-copy">
          <div className="dt-stage-title">
            <span className="dt-editorial-kicker">MADE FOR EVERYDAY BUSINESS</span>
            <h3>{product.label}<em>.</em></h3>
            <p className="dt-stage-description">{product.description}</p>
          </div>
          <div className="dt-stage-price">
            <span>PEMBAYARAN SEKALI</span>
            <strong>{product.price}</strong><small> per kartu</small>
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

          <ProductObject product={product}/>

        </div>
      </div>

      <div className="dt-edition-selector dt-neo-selector">
        <div className="dt-selector-heading">
          <span>CHOOSE YOUR FINISH</span>
          <small>Pilih tampilan kartu yang kamu suka</small>
        </div>
        <div className="dt-selector-options">
          {products.map((item) => (
            <button
              type="button"
              key={item.tone}
              className={"dt-neo-option dt-neo-option-" + item.tone + (item.tone === product.tone ? " is-active" : "")}
              onClick={() => setSelected(item.tone)}
              aria-pressed={item.tone === product.tone}
            >
              <span className="dt-neo-option-preview"><i/><i/></span>
              <span className="dt-neo-option-copy">
                <small>{item.mode === "preorder" ? "MADE TO ORDER" : "READY TO ORDER"}</small>
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
