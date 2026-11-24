"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, X, Nfc, LayoutDashboard, MessageCircle, Plus } from "lucide-react";

function Brand() {
  return <a href="/" className="dt-brand" aria-label="DiTapAja — Beranda">
    <span className="dt-brand-symbol" aria-hidden="true"><i/><i/><i/><b>®</b></span>
    <span className="dt-brand-word"><span className="dt-brand-word-top">DI<span>TAP</span>AJA</span><small>THE REVIEW OBJECT / 001</small></span>
  </a>;
}

const links = [
  ["01", "Koleksi", "/koleksi"],
  ["02", "Cara kerja", "/cara-kerja"],
  ["03", "FAQ", "/faq"]
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  return <>
    <header className="dt-site-header dt-header-experimental">
      <div className="dt-header-shell">
        <div className="dt-header-brand-zone">
          <span className="dt-header-side-index">OBJECT<br/>NO. 001</span>
          <Brand />
        </div>
        <nav className="dt-header-nav" aria-label="Navigasi utama">
          <span className="dt-header-nav-cap">INDEX /</span>
          {links.map(([number, label, href]) => <a key={href} href={href}>
            <span className="dt-header-nav-number">{number}</span><strong>{label}</strong><i/>
          </a>)}
        </nav>
        <div className="dt-header-actions">
          <a className="dt-header-login" href="/login">Masuk <span>↗</span></a>
          <a className="dt-header-cta" href="/koleksi" aria-label="Jelajahi koleksi kartu">
            <span className="dt-header-cta-ring"><ArrowUpRight size={19}/></span>
            <span className="dt-header-cta-copy"><small>YOUR NEXT MOVE</small><strong>Get a card</strong></span>
          </a>
        </div>
        <div className="dt-header-mobile">
          <span className="dt-header-mobile-code">DTA—001</span>
          <a className="dt-header-mobile-cta" href="/koleksi">Kartu <ArrowUpRight size={14}/></a>
          <button type="button" onClick={() => setOpen(true)} aria-label="Buka navigasi" aria-expanded={open} aria-controls="dt-mobile-menu">
            <span className="dt-header-menu-icon"><i/><i/><i/></span><small>MENU</small>
          </button>
        </div>
      </div>
      <div className="dt-header-bottomline"><span>MAKE THE FIRST TAP COUNT</span><span className="dt-header-bottomline-center"><i/> NFC ENABLED <i/></span><span>EST. FOR BETTER REVIEWS — 2026</span></div>
    </header>

    {open && createPortal(<div className="dt-menu-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) closeMenu(); }}>
      <section className="dt-menu-panel dt-menu-redesign" id="dt-mobile-menu" role="dialog" aria-modal="true" aria-label="Navigasi DiTapAja">
        <div className="dt-menu-top">
          <Brand />
          <button className="dt-menu-close" type="button" onClick={closeMenu} aria-label="Tutup menu"><span>ESC / CLOSE</span><X size={18}/></button>
        </div>
        <div className="dt-menu-content">
          <div className="dt-menu-intro"><span>DITAPAJA / NAVIGATION INDEX</span><p>Small object.<br/><em>Better connections.</em></p></div>
          <div className="dt-menu-grid">
            <nav className="dt-menu-links" aria-label="Halaman utama">
              {links.map(([number, label, href]) => <a key={href} href={href} onClick={closeMenu}>
                <span className="dt-menu-link-number">{number}</span><strong>{label}</strong><ArrowUpRight size={20}/>
              </a>)}
            </nav>
            <aside className="dt-menu-quick">
              <span className="dt-menu-quick-label">QUICK ACCESS /</span>
              <a className="dt-menu-action-card" href="/activate" onClick={closeMenu}>
                <span className="dt-menu-action-icon"><Nfc size={20}/></span>
                <span className="dt-menu-action-copy"><small>ALREADY HAVE ONE?</small><strong>Aktivasi kartu</strong><em>Hubungkan kartu ke bisnismu</em></span>
                <ArrowUpRight className="dt-menu-action-arrow" size={18}/>
              </a>
              <a className="dt-menu-action-card" href="/login" onClick={closeMenu}>
                <span className="dt-menu-action-icon"><LayoutDashboard size={19}/></span>
                <span className="dt-menu-action-copy"><small>YOUR CONTROL ROOM</small><strong>Dashboard</strong><em>Kelola kartu dan aktivitas</em></span>
                <ArrowUpRight className="dt-menu-action-arrow" size={18}/>
              </a>
            </aside>
          </div>
        </div>
        <div className="dt-menu-foot"><span>© 2026 DITAPAJA</span><a href="https://wa.me/6281321778081" target="_blank" rel="noopener noreferrer"><MessageCircle size={14}/> CONTACT / WHATSAPP</a><span>NFC · QR · NO MONTHLY FEE</span></div>
      </section>
    </div>, document.body)}
  </>;
}
