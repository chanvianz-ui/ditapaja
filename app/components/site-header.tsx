"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowUpRight, Menu, X, Nfc, LayoutDashboard, MessageCircle } from "lucide-react";

const links = [
  { label: "Beranda", href: "/" },
  { label: "Koleksi", href: "/koleksi" },
  { label: "Cara kerja", href: "/cara-kerja" },
  { label: "Fitur", href: "/fitur" },
  { label: "FAQ", href: "/faq" },
];

function Brand() {
  return (
    <Link href="/" className="dt-v3-brand" aria-label="DiTapAja — Beranda">
      <span className="dt-v3-brand-mark" aria-hidden="true"><i/><i/><i/></span>
      <span className="dt-v3-brand-word"><b>DiTap<span>Aja</span><i>.</i></b><small>MAKE EVERY TAP COUNT</small></span>
    </Link>
  );
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); return; }
      if (event.key !== "Tab") return;
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])');
      if (!nodes?.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
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

  return (
    <>
      <header className="dt-v3-header">
        <div className="dt-v3-header-inner">
          <Brand />
          <nav className="dt-v3-nav" aria-label="Navigasi utama">
            {links.map((item, index) => (
              <Link href={item.href} key={item.href}>
                <small>0{index + 1}</small>{item.label}
              </Link>
            ))}
          </nav>
          <div className="dt-v3-header-actions">
            <Link href="/login" className="dt-v3-login"><LayoutDashboard size={15}/> Masuk</Link>
            <Link href="/koleksi" className="dt-v3-header-cta">Pilih kartu <ArrowUpRight size={16}/></Link>
          </div>
          <div className="dt-v3-mobile-actions">
            <Link href="/koleksi" className="dt-v3-mobile-shop">Koleksi <ArrowUpRight size={14}/></Link>
            <button ref={triggerRef} type="button" onClick={() => setOpen(true)} aria-label="Buka navigasi" aria-expanded={open} aria-controls="dt-v3-mobile-menu"><Menu size={20}/></button>
          </div>
        </div>
      </header>
      {open && createPortal(
        <div className="dt-v3-menu-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section ref={panelRef} id="dt-v3-mobile-menu" className="dt-v3-menu-panel" role="dialog" aria-modal="true" aria-label="Navigasi DiTapAja">
            <div className="dt-v3-menu-head"><Brand/><button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Tutup navigasi"><X size={19}/></button></div>
            <div className="dt-v3-menu-intro"><small>DITAPAJA / NAVIGATION</small><h2>Everything<br/><em>starts with a tap.</em></h2></div>
            <nav className="dt-v3-menu-links" aria-label="Halaman utama">
              {links.map((item,index)=><Link key={item.href} href={item.href} onClick={()=>setOpen(false)}><small>0{index+1}</small><strong>{item.label}</strong><ArrowUpRight size={18}/></Link>)}
            </nav>
            <div className="dt-v3-menu-quick">
              <Link href="/activate" onClick={()=>setOpen(false)}><Nfc size={18}/><span><small>SUDAH PUNYA KARTU?</small><b>Aktivasi kartu</b></span><ArrowUpRight size={16}/></Link>
              <Link href="/login" onClick={()=>setOpen(false)}><LayoutDashboard size={18}/><span><small>AREA PENGELOLAAN</small><b>Dashboard</b></span><ArrowUpRight size={16}/></Link>
            </div>
            <a className="dt-v3-menu-contact" href="https://wa.me/6281321778081" target="_blank" rel="noopener noreferrer"><MessageCircle size={15}/> Hubungi tim DiTapAja</a>
          </section>
        </div>,
        document.body
      )}
    </>
  );
}
