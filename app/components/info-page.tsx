import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, MessageCircle, Sparkles } from "lucide-react";
import SiteHeader from "./site-header";
import styles from "./info-page-cards.module.css";

export default function InfoPage({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lead: string;
  children: ReactNode;
}) {
  return (
    <main className="info-page info-page-v3">
      <SiteHeader />
      <section className="info-hero info-hero-v3">
        <div className="info-hero-grid" aria-hidden="true" />
        <div className="info-wrap info-hero-layout">
          <div className="info-hero-copy">
            <div className="info-eyebrow"><Sparkles size={13} /> {eyebrow}</div>
            <h1>{title}</h1>
            <p>{lead}</p>
            <div className="info-hero-actions">
              <Link href="/koleksi">Jelajahi koleksi <ArrowUpRight size={16} /></Link>
              <span><i /> NFC + QR / DASHBOARD GRATIS</span>
            </div>
          </div>
          <div className="info-hero-object" aria-hidden="true">
            <div className="info-object-orbit info-object-orbit-a" />
            <div className="info-object-orbit info-object-orbit-b" />
            <div className="info-object-card">
              <span>DITAPAJA / OBJECT 001</span>
              <strong>Make every<br /><em>tap count.</em></strong>
              <small><i /> NFC + QR READY</small>
            </div>
            <span className="info-object-caption">ONE TAP. BETTER CONNECTION.</span>
          </div>
        </div>
        <div className="info-hero-foot"><span>DITAPAJA / KNOWLEDGE BASE</span><span>01 — 04</span></div>
      </section>
      <section className="info-content info-content-v3">
        <div className="info-wrap">
          <div className="info-content-heading">
            <span>INFORMASI DITAPAJA</span>
            <span>DIRANCANG UNTUK JELAS & PRAKTIS</span>
          </div>
          <div className={`info-content-body ${styles.contentCards}`}>{children}</div>
          <div className="info-contact-strip">
            <div className="info-contact-icon"><MessageCircle size={20} /></div>
            <div className="info-contact-copy">
              <small>MASIH ADA YANG INGIN DITANYAKAN?</small>
              <strong>Kami siap membantu.</strong>
            </div>
            <a href="https://wa.me/6281321778081" target="_blank" rel="noopener noreferrer">Hubungi DiTapAja <ArrowUpRight size={16} /></a>
          </div>
        </div>
      </section>
      <footer className="info-footer info-footer-v3">
        <Link href="/" className="info-footer-brand">DiTap<span>Aja.</span></Link>
        <span>© 2026 DiTapAja · NFC + QR / NO MONTHLY FEE</span>
        <div><Link href="/kebijakan-privasi">Privasi</Link><Link href="/syarat-ketentuan">Ketentuan</Link><Link href="/kontak">Kontak</Link></div>
      </footer>
    </main>
  );
}
