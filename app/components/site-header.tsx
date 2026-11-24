"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, X, Nfc, LayoutDashboard, MessageCircle, Sparkles } from "lucide-react";

function Brand() {
  return (
    <a href="/" className="dt-brand" aria-label="DiTapAja — Beranda">
      <span className="dt-brand-symbol" aria-hidden="true"><i /><i /><i /><b /></span>
      <span className="dt-brand-word">
        <span className="dt-brand-word-top">DI<span>TAP</span>AJA</span>
        <small>MAKE EVERY TAP COUNT</small>
      </span>
    </a>
  );
}

const links = [
  ["01", "Koleksi", "/koleksi"],
  ["02", "Cara kerja", "/cara-kerja"],
  ["03", "FAQ", "/faq"],
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      triggerRef.current?.focus();
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <>
      <header className="dt-site-header dt-header-modern dt-header-signature">
        <div className="dt-header-shell">
          <Brand />
          <nav className="dt-header-nav" aria-label="Navigasi utama">
            {links.map(([number, label, href]) => (
              <a key={href} href={href}>
                <span className="dt-header-nav-number">{number}</span>
                <strong>{label}</strong>
              </a>
            ))}
          </nav>
          <div className="dt-header-actions">
            <a className="dt-header-login" href="/login">Masuk</a>
            <a className="dt-header-cta" href="/koleksi">
              <span className="dt-header-cta-copy"><small>SIAP MULAI?</small><strong>Temukan kartu</strong></span>
              <span className="dt-header-cta-icon"><ArrowUpRight size={17} aria-hidden="true" /></span>
            </a>
          </div>
          <div className="dt-header-mobile">
            <a className="dt-header-mobile-cta" href="/koleksi">Koleksi <ArrowUpRight size={14} aria-hidden="true" /></a>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Buka navigasi"
              aria-expanded={open}
              aria-controls="dt-mobile-menu"
            >
              <span className="dt-header-menu-icon" aria-hidden="true"><i /><i /></span>
            </button>
          </div>
        </div>
      </header>

      {open && createPortal(
        <div
          className="dt-menu-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeMenu();
          }}
        >
          <section
            ref={panelRef}
            className="dt-menu-panel dt-menu-redesign"
            id="dt-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigasi DiTapAja"
          >
            <div className="dt-menu-top">
              <Brand />
              <button ref={closeRef} className="dt-menu-close" type="button" onClick={closeMenu} aria-label="Tutup menu">
                <span>TUTUP</span><X size={18} />
              </button>
            </div>
            <div className="dt-menu-content">
              <div className="dt-menu-intro">
                <span><Sparkles size={12} aria-hidden="true" /> DITAPAJA / NAVIGASI</span>
                <p>Semua yang kamu<br /><em>butuhkan, satu tap.</em></p>
              </div>
              <div className="dt-menu-grid">
                <nav className="dt-menu-links" aria-label="Halaman utama">
                  {links.map(([number, label, href]) => (
                    <a key={href} href={href} onClick={closeMenu}>
                      <span className="dt-menu-link-number">{number}</span>
                      <strong>{label}</strong>
                      <ArrowUpRight size={20} aria-hidden="true" />
                    </a>
                  ))}
                </nav>
                <aside className="dt-menu-quick">
                  <span className="dt-menu-quick-label">AKSES CEPAT</span>
                  <a className="dt-menu-action-card" href="/activate" onClick={closeMenu}>
                    <span className="dt-menu-action-icon"><Nfc size={20} /></span>
                    <span className="dt-menu-action-copy"><small>SUDAH PUNYA KARTU?</small><strong>Aktivasi kartu</strong><em>Hubungkan kartu ke bisnismu</em></span>
                    <ArrowUpRight className="dt-menu-action-arrow" size={18} />
                  </a>
                  <a className="dt-menu-action-card" href="/login" onClick={closeMenu}>
                    <span className="dt-menu-action-icon"><LayoutDashboard size={19} /></span>
                    <span className="dt-menu-action-copy"><small>AREA PENGELOLAAN</small><strong>Dashboard</strong><em>Kelola kartu dan aktivitas</em></span>
                    <ArrowUpRight className="dt-menu-action-arrow" size={18} />
                  </a>
                </aside>
              </div>
            </div>
            <div className="dt-menu-foot">
              <span>© 2026 DITAPAJA</span>
              <a href="https://wa.me/6281321778081" target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> HUBUNGI KAMI</a>
              <span>NFC · QR · TANPA BIAYA BULANAN</span>
            </div>
          </section>
        </div>,
        document.body
      )}
    </>
  );
}
