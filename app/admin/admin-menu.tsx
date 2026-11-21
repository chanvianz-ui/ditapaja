"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ClipboardList, Users, KeyRound, LogOut, Menu, X, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import styles from "./admin-menu.module.css";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Order Management", icon: ClipboardList },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/pins", label: "Activation PINs", icon: KeyRound },
];

export default function AdminMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open admin menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={styles.trigger}
      >
        <Menu size={18} strokeWidth={1.9}/>
      </button>

      {open && (
        <div className={styles.overlay}>
          <button type="button" className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent" aria-label="Close admin menu" onClick={() => setOpen(false)} />
          <section role="dialog" aria-modal="true" aria-label="Admin navigation" className={styles.panel}>
            <div className={styles.top}>
              <div className={styles.brand}>
                <span className={styles.brandMark}><ShieldCheck size={19}/></span>
                <span className={styles.brandCopy}>
                  <b>DiTapAja</b>
                  <small>PLATFORM CONTROL</small>
                </span>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className={styles.close}>
                <X size={18}/>
              </button>
            </div>

            <p className={styles.label}>Superadmin workspace</p>
            <nav className={styles.nav} aria-label="Admin pages">
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
                <b>Superadmin access</b>
                <small>Manage DiTapAja platform operations.</small>
              </span>
            </div>
            <button type="button" onClick={logout} className={styles.logout}>
              <LogOut size={16}/> Sign out
            </button>
          </section>
        </div>
      )}
    </>
  );
}
