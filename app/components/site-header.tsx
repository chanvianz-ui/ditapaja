"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, X, Nfc, LayoutDashboard, MessageCircle } from "lucide-react";

function Brand() {
  return <a href="/" className="dt-brand" aria-label="DiTapAja — Beranda">
    <span className="dt-brand-symbol" aria-hidden="true"><i/><i/><i/></span>
    <span className="dt-brand-word">DiTap<span>Aja</span><small>REVIEW, MADE SIMPLE</small></span>
  </a>;
}

const links = [
  ["Koleksi", "/koleksi", "01"],
  ["Cara kerja", "/cara-kerja", "02"],
  ["FAQ", "/faq", "03"]
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
    <header className="dt-site-header">
      <div className="dt-header-shell">
        <Brand />
        <nav className="dt-header-nav" aria-label="Navigasi utama">
          {links.map(([label, href]) => <a key={href} href={href}>{label}<span/></a>)}
        </nav>
        <div className="dt-header-actions">
          <a className="dt-header-login" href="/login">Masuk</a>
          <a className="dt-header-cta" href="/koleksi">Temukan kartu <ArrowUpRight size={15}/></a>
        </div>
        <div className="dt-header-mobile">
          <a className="dt-header-mobile-cta" href="/koleksi" aria-label="Lihat koleksi kartu">Kartu <ArrowUpRight size={14}/></a>
          <button type="button" onClick={() => setOpen(true)} aria-label="Buka navigasi" aria-expanded={open} aria-controls="dt-mobile-menu">
            <span className="dt-header-menu-icon"><i/><i/></span>
          </button>
        </div>
      </div>
    </header>

    {open && createPortal(<div className="dt-menu-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) closeMenu(); }}>
      <section className="dt-menu-panel dt-menu-redesign" id="dt-mobile-menu" role="dialog" aria-modal="true" aria-label="Navigasi DiTapAja">
        <div className="dt-menu-top">
          <Brand />
          <button className="dt-menu-close" type="button" onClick={closeMenu} aria-label="Tutup menu"><span>ESC</span><X size={18}/></button>
        </div>
        <div className="dt-menu-content">
          <div className="dt-menu-intro"><span>DITAPAJA / NAVIGATION</span><p>Temukan cara yang lebih mudah untuk mengumpulkan review.</p></div>
          <div className="dt-menu-grid">
            <nav className="dt-menu-links" aria-label="Halaman utama">
              {links.map(([label, href, number]) => <a key={href} href={href} onClick={closeMenu}>
                <span className="dt-menu-link-number">{number}</span><strong>{label}</strong><ArrowUpRight size={20}/>
              </a>)}
            </nav>
            <aside className="dt-menu-quick">
              <span className="dt-menu-quick-label">AKSES CEPAT</span>
              <a className="dt-menu-action-card" href="/activate" onClick={closeMenu}>
                <span className="dt-menu-action-icon"><Nfc size={20}/></span>
                <span className="dt-menu-action-copy"><small>SUDAH PUNYA KARTU?</small><strong>Aktivasi kartu</strong><em>Hubungkan kartu ke bisnismu</em></span>
                <ArrowUpRight className="dt-menu-action-arrow" size={18}/>
              </a>
              <a className="dt-menu-action-card" href="/login" onClick={closeMenu}>
                <span className="dt-menu-action-icon"><LayoutDashboard size={19}/></span>
                <span className="dt-menu-action-copy"><small>AREA PENGGUNA</small><strong>Dashboard</strong><em>Kelola kartu dan aktivitas</em></span>
                <ArrowUpRight className="dt-menu-action-arrow" size={18}/>
              </a>
            </aside>
          </div>
        </div>
        <div className="dt-menu-foot"><span>© 2026 DITAPAJA</span><a href="https://wa.me/6281321778081" target="_blank" rel="noopener noreferrer"><MessageCircle size={14}/> HUBUNGI KAMI</a><span>NFC · QR · NO MONTHLY FEE</span></div>
      </section>
    </div>, document.body)}
  </>;
}
