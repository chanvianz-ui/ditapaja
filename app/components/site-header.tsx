"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, ShoppingBag, X, Nfc, LayoutDashboard } from "lucide-react";

function Brand() {
  return <a href="/" className="brand" aria-label="DiTapAja beranda">
    <span className="brand-symbol"><i/><i/><i/></span>
    <span>DiTap<span className="blue-word">Aja</span></span>
  </a>;
}

const links = [
  ["01", "Beranda", "/#top"],
  ["02", "Koleksi kartu", "/#koleksi"],
  ["03", "Dashboard", "/#dashboard"],
  ["04", "Cara kerja", "/#cara-kerja"],
  ["05", "FAQ", "/faq"]
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
          <button className="dt-menu-close" type="button" onClick={() => setOpen(false)} aria-label="Tutup menu"><span>TUTUP</span><X size={18}/></button>
        </div>
        <div className="dt-menu-content">
          <div className="dt-menu-label"><span>JELAJAHI DITAPAJA</span><span>MENU / 01—05</span></div>
          <div className="dt-menu-grid">
            <nav className="dt-menu-links" aria-label="Menu halaman">
              {links.map(([number, label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>
                <span>{number}</span><strong>{label}</strong><ArrowUpRight size={18}/>
              </a>)}
            </nav>
            <aside className="dt-menu-quick">
              <span className="dt-menu-quick-label">AKSES CEPAT</span>
              <a className="dt-menu-action-card dt-menu-activate" href="/activate" onClick={() => setOpen(false)}>
                <span className="dt-menu-action-icon"><Nfc size={20}/></span>
                <span className="dt-menu-action-copy"><small>SUDAH PUNYA KARTU?</small><strong>Aktivasi kartu</strong><em>Hubungkan kartu NFC ke bisnismu</em></span>
                <ArrowUpRight className="dt-menu-action-arrow" size={19}/>
              </a>
              <a className="dt-menu-action-card dt-menu-login" href="/login" onClick={() => setOpen(false)}>
                <span className="dt-menu-action-icon"><LayoutDashboard size={19}/></span>
                <span className="dt-menu-action-copy"><small>AREA PENGGUNA</small><strong>Login dashboard</strong><em>Kelola kartu dan pantau performa</em></span>
                <ArrowUpRight className="dt-menu-action-arrow" size={19}/>
              </a>
              <a className="dt-menu-contact" href="https://wa.me/6281321778081" onClick={() => setOpen(false)}>Butuh bantuan? Hubungi kami <ArrowUpRight size={13}/></a>
            </aside>
          </div>
        </div>
        <div className="dt-menu-foot"><span>© 2026 DITAPAJA</span><span>ONE CARD. MORE CONNECTIONS.</span></div>
      </section>
    </div>, document.body)}
  </>;
}
