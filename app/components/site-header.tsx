"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, ShoppingBag, X } from "lucide-react";

function Brand() {
  return <a href="/" className="brand" aria-label="DiTapAja beranda">
    <span className="brand-symbol"><i/><i/><i/></span>
    <span>DiTap<span className="blue-word">Aja</span></span>
  </a>;
}

const links = [
  ["01", "Beranda", "/"],
  ["02", "Koleksi", "/koleksi"],
  ["03", "Fitur", "/fitur"],
  ["04", "Cara kerja", "/cara-kerja"],
  ["05", "Panduan", "/panduan"],
  ["06", "Tentang", "/tentang"],
  ["07", "FAQ", "/faq"],
  ["08", "Kontak", "/kontak"]
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return <>
    <header className="concept-header">
      <div className="concept-nav">
        <Brand />
        <nav aria-label="Navigasi utama">{links.slice(1, 5).map(([number, label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
        <div className="concept-nav-actions">
          <a href="/activate">Aktivasi kartu</a>
          <a href="/login">Masuk</a>
          <a className="concept-nav-cta" href="/koleksi">Pilih kartu <ArrowUpRight size={15}/></a>
        </div>
        <div className="concept-mobile-actions">
          <a href="/koleksi" aria-label="Lihat koleksi"><ShoppingBag size={18}/></a>
          <button className={open ? "is-active" : ""} type="button" onClick={() => setOpen(true)} aria-label="Buka menu" aria-expanded={open} aria-haspopup="dialog">
            <span className="dt-menu-glyph"><i/><i/></span>
            <small>MENU</small>
          </button>
        </div>
      </div>
    </header>

    {open && createPortal(<div className="dt-menu-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="dt-menu-panel" role="dialog" aria-modal="true" aria-label="Menu utama DiTapAja">
        <div className="dt-menu-top">
          <Brand />
          <span className="dt-menu-coordinate">NAVIGATION INDEX <i/> 2026</span>
          <button className="dt-menu-close" type="button" onClick={() => setOpen(false)} aria-label="Tutup menu"><span>TUTUP</span><X size={19}/></button>
        </div>
        <div className="dt-menu-layout">
          <div className="dt-menu-intro">
            <div className="dt-menu-eyebrow"><i/> THE DITAPAJA INDEX</div>
            <h2>Make every<br/><em>tap</em> count.</h2>
            <p>Temukan cara yang lebih sederhana untuk menghubungkan pelanggan dengan bisnismu.</p>
            <div className="dt-menu-orbit" aria-hidden="true"><span/><i/><b>NFC<br/>+ QR</b></div>
            <div className="dt-menu-intro-foot"><span>DESIGNED FOR BETTER CONNECTIONS</span><span>01 — 08</span></div>
          </div>
          <div className="dt-menu-directory">
            <div className="dt-menu-directory-head"><span>JELAJAHI</span><span>SELECT A DESTINATION</span></div>
            <nav aria-label="Menu halaman">
              {links.map(([number, label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>
                <span className="dt-menu-link-number">{number}</span><strong>{label}</strong><ArrowUpRight size={18}/>
              </a>)}
            </nav>
            <div className="dt-menu-actions">
              <a href="/activate" onClick={() => setOpen(false)}>Aktivasi kartu <ArrowUpRight size={15}/></a>
              <a href="/login" onClick={() => setOpen(false)}>Masuk ke dashboard <ArrowUpRight size={15}/></a>
            </div>
          </div>
        </div>
        <div className="dt-menu-bottom"><span>© 2026 DITAPAJA</span><span>ONE CARD. MORE CONNECTIONS.</span><a href="https://wa.me/6281321778081">LET'S TALK <ArrowUpRight size={13}/></a></div>
      </section>
    </div>, document.body)}
  </>;
}
