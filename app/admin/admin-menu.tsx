"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ClipboardList, Users, KeyRound, LogOut, Menu, X, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import styles from "./admin-menu.module.css";

const items = [
  { href: "/admin", label: "Ringkasan", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Manajemen pesanan", icon: ClipboardList },
  { href: "/admin/users", label: "Manajemen pengguna", icon: Users },
  { href: "/admin/pins", label: "PIN aktivasi", icon: KeyRound },
];

export default function AdminMenu() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) triggerRef.current?.focus();
      wasOpenRef.current = false;
      return;
    }
    wasOpenRef.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const getFocusable = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])') || [])
      .filter(element => element.offsetWidth > 0 || element.offsetHeight > 0);
    getFocusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); return; }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka menu admin"
        aria-controls="admin-navigation-dialog"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={styles.trigger}
      >
        <Menu size={18} strokeWidth={1.9}/>
      </button>

      {open && (
        <div className={styles.overlay}>
          <button type="button" className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent" aria-label="Tutup menu admin" onClick={() => setOpen(false)} />
          <section id="admin-navigation-dialog" ref={panelRef} role="dialog" aria-modal="true" aria-label="Navigasi admin" className={styles.panel}>
            <div className={styles.top}>
              <div className={styles.brand}>
                <span className={styles.brandMark}><ShieldCheck size={19}/></span>
                <span className={styles.brandCopy}>
                  <b>DiTapAja</b>
                  <small>PLATFORM CONTROL</small>
                </span>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Tutup menu" className={styles.close}>
                <X size={18}/>
              </button>
            </div>

            <p className={styles.label}>Ruang kerja Superadmin</p>
            <nav className={styles.nav} aria-label="Halaman admin">
              {items.map(item => {
                const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => { setOpen(false); router.push(item.href); }}
                    aria-current={active ? "page" : undefined}
                    className={active ? `${styles.navLink} ${styles.navActive}` : styles.navLink}
                  >
                    <Icon className={styles.navIcon} strokeWidth={1.8}/>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className={styles.spacer}/>
            <div className={styles.access}>
              <span className={styles.accessIcon}><ShieldCheck size={17}/></span>
              <span className={styles.accessCopy}>
                <b>Akses Superadmin</b>
                <small>Kelola operasional platform DiTapAja.</small>
              </span>
            </div>
            <button type="button" onClick={logout} className={styles.logout}>
              <LogOut size={16}/> Keluar
            </button>
          </section>
        </div>
      )}
    </>
  );
}
