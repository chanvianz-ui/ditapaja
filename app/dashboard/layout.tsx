"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3, Building2, CreditCard, Eye, LayoutDashboard, LogOut,
  Menu, Settings, ShoppingBag, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import styles from "./dashboard-shell.module.css";
import "./workspace-v3.css";

const items = [
  { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard, group: "Ruang kerja", view: "overview" },
  { href: "/dashboard?view=cards", label: "Kartu NFC", icon: CreditCard, group: "Ruang kerja", view: "cards" },
  { href: "/dashboard/business", label: "Lokasi bisnis", icon: Building2, group: "Ruang kerja" },
  { href: "/dashboard/landing-page", label: "Page Studio", icon: Eye, group: "Ruang kerja" },
  { href: "/dashboard/customers", label: "Analitik pelanggan", icon: BarChart3, group: "Analitik" },
  { href: "/pesanan", label: "Pesanan saya", icon: ShoppingBag, group: "Akun" },
  { href: "/dashboard/settings", label: "Pengaturan", icon: Settings, group: "Akun" },
] as const;

const groups = ["Ruang kerja", "Analitik", "Akun"] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cardsView, setCardsView] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("Ruang kerja Anda");
  const [authChecked, setAuthChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuWasOpenRef = useRef(false);

  useEffect(() => {
    const syncCardsView = () => {
      setCardsView(new URLSearchParams(window.location.search).get("view") === "cards");
    };
    syncCardsView();
    window.addEventListener("popstate", syncCardsView);
    return () => window.removeEventListener("popstate", syncCardsView);
  }, [pathname]);

  useEffect(() => {
    let alive = true;
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setAuthorized(false);
        setAuthChecked(true);
        router.replace("/login");
      }
    });

    async function loadAccount() {
      const mode = localStorage.getItem("ditapaja_auth_storage_mode") || "session";
      const expiry = Number(localStorage.getItem("ditapaja_login_expires_at") || 0);
      if (mode === "persistent" && (!expiry || Date.now() >= expiry)) {
        localStorage.removeItem("ditapaja_login_expires_at");
        localStorage.setItem("ditapaja_auth_storage_mode", "session");
        await supabase.auth.signOut({ scope: "local" });
        if (alive) {
          setAuthorized(false);
          setAuthChecked(true);
          router.replace("/login");
        }
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (!alive) return;
      if (error || !data.user) {
        setAuthorized(false);
        setAuthChecked(true);
        router.replace("/login?next=" + encodeURIComponent(window.location.pathname + window.location.search));
        return;
      }

      setEmail(data.user.email || "");
      setAuthorized(true);
      setAuthChecked(true);
      const { data: profile } = await supabase.from("profiles")
        .select("full_name").eq("id", data.user.id).maybeSingle();
      if (!alive) return;
      setDisplayName(profile?.full_name || data.user.user_metadata?.full_name ||
        data.user.email?.split("@")[0] || "Your workspace");
    }

    void loadAccount();
    return () => {
      alive = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      if (menuWasOpenRef.current) menuTriggerRef.current?.focus();
      menuWasOpenRef.current = false;
      return;
    }
    menuWasOpenRef.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const sidebar = sidebarRef.current;
    const getFocusable = () => Array.from(sidebar?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])') || [])
      .filter(element => element.offsetWidth > 0 || element.offsetHeight > 0);
    getFocusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setMenuOpen(false); return; }
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
  }, [menuOpen]);

  function isActive(item: typeof items[number]) {
    const itemPath = item.href.split("?")[0];
    if (itemPath === "/dashboard") {
      const isCardsView = item.href.includes("view=cards");
      return pathname === itemPath && (isCardsView ? cardsView : !cardsView);
    }
    return pathname === itemPath || pathname.startsWith(itemPath + "/");
  }

  function navigate(item: typeof items[number]) {
    setMenuOpen(false);
    if (item.href === "/dashboard?view=cards") setCardsView(true);
    else if (item.href === "/dashboard") setCardsView(false);
    router.push(item.href);
  }

  async function logout() {
    await supabase.auth.signOut({ scope: "local" });
    localStorage.removeItem("ditapaja_login_expires_at");
    localStorage.setItem("ditapaja_auth_storage_mode", "session");
    router.replace("/login");
  }

  const brand = (
    <Link href="/" className={styles.brand} aria-label="Beranda DiTapAja">
      <span className={styles.brandMark} aria-hidden="true"><i/><i/><i/></span>
      <span>DiTap<span className={styles.brandAccent}>Aja</span></span>
    </Link>
  );

  if (!authChecked || !authorized) {
    return (
      <main className="dt-auth-guard" aria-live="polite">
        <div className="dt-auth-guard-card">
          <span className="dt-auth-guard-mark" aria-hidden="true" />
          <p>{authChecked ? "Mengarahkan ke halaman login..." : "Memeriksa sesi akun..."}</p>
        </div>
      </main>
    );
  }

  return (
    <div className={styles.shell}>
      {menuOpen && <button className={styles.mobileBackdrop} type="button" aria-label="Tutup navigasi" onClick={() => setMenuOpen(false)} />}
      <aside ref={sidebarRef} id="workspace-navigation" className={menuOpen ? `${styles.sidebar} ${styles.sidebarOpen}` : styles.sidebar} aria-label="Navigasi ruang kerja">
        {brand}
        <div className={styles.workspaceLabel}>Ruang kerja</div>
        <nav className={styles.nav}>
          {groups.map((group, index) => {
            const groupItems = items.filter(item => item.group === group);
            return (
              <div key={group}>
                {index > 0 && <div className={styles.navDivider} />}
                {index > 0 && <div className={styles.navCaption}>{group}</div>}
                {groupItems.map(item => {
                  const Icon = item.icon;
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={active ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
                      aria-current={active ? "page" : undefined}
                      onClick={event => {
                        event.preventDefault();
                        navigate(item);
                      }}
                    >
                      <Icon className={styles.navIcon} strokeWidth={1.8}/>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.account}>
            <span className={styles.avatar}>{displayName.slice(0, 1).toUpperCase()}</span>
            <span className={styles.accountCopy}>
              <span className={styles.accountName}>{displayName}</span>
              <span className={styles.accountEmail}>{email || "Akun DiTapAja"}</span>
            </span>
          </div>
          <button className={styles.logout} type="button" onClick={logout}>
            <LogOut size={16}/><span>Keluar</span>
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.mobileHeader}>
          {brand}
          <button ref={menuTriggerRef} className={styles.mobileMenu} type="button" onClick={() => setMenuOpen(value => !value)} aria-label={menuOpen ? "Tutup navigasi" : "Buka navigasi"} aria-expanded={menuOpen} aria-controls="workspace-navigation">
            {menuOpen ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
