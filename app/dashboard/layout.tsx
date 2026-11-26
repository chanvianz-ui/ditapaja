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

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, group: "Workspace", view: "overview" },
  { href: "/dashboard?view=cards", label: "NFC Cards", icon: CreditCard, group: "Workspace", view: "cards" },
  { href: "/dashboard/business", label: "Business locations", icon: Building2, group: "Workspace" },
  { href: "/dashboard/landing-page", label: "Page Studio", icon: Eye, group: "Workspace" },
  { href: "/dashboard/customers", label: "Customer insights", icon: BarChart3, group: "Insights" },
  { href: "/pesanan", label: "My orders", icon: ShoppingBag, group: "Account" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, group: "Account" },
] as const;

const groups = ["Workspace", "Insights", "Account"] as const;

function itemPathIsDashboard(href: string) {
  return href === "/dashboard" || href === "/dashboard?view=cards";
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cardsView, setCardsView] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("Your workspace");
  const sidebarRef = useRef<HTMLElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuWasOpenRef = useRef(false);

  useEffect(() => {
    setCardsView(new URLSearchParams(window.location.search).get("view") === "cards");
  }, [pathname]);

  useEffect(() => {
    let alive = true;
    async function loadAccount() {
      const expiry = Number(localStorage.getItem("ditapaja_login_expires_at") || 0);
      if (expiry && Date.now() > expiry) {
        localStorage.removeItem("ditapaja_login_expires_at");
        await supabase.auth.signOut();
        if (alive) router.replace("/login");
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setEmail(data.user.email || "");
      const { data: profile } = await supabase.from("profiles")
        .select("full_name").eq("id", data.user.id).maybeSingle();
      if (!alive) return;
      setDisplayName(profile?.full_name || data.user.user_metadata?.full_name ||
        data.user.email?.split("@")[0] || "Your workspace");
    }
    void loadAccount();
    return () => { alive = false; };
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
    return () => window.removeEventListener("keydown", onKeyDown);
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
    if (itemPathIsDashboard(item.href) && pathname === "/dashboard") {
      window.location.assign(item.href);
      return;
    }
    if (item.href === "/dashboard?view=cards") setCardsView(true);
    else if (item.href === "/dashboard") setCardsView(false);
    router.push(item.href);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const brand = (
    <Link href="/" className={styles.brand} aria-label="DiTapAja home">
      <span className={styles.brandMark} aria-hidden="true"><i/><i/><i/></span>
      <span>DiTap<span className={styles.brandAccent}>Aja</span></span>
    </Link>
  );

  return (
    <div className={styles.shell}>
      {menuOpen && <button className={styles.mobileBackdrop} type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <aside ref={sidebarRef} id="workspace-navigation" className={menuOpen ? `${styles.sidebar} ${styles.sidebarOpen}` : styles.sidebar} aria-label="Workspace navigation">
        {brand}
        <div className={styles.workspaceLabel}>Workspace</div>
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
              <span className={styles.accountEmail}>{email || "DiTapAja account"}</span>
            </span>
          </div>
          <button className={styles.logout} type="button" onClick={logout}>
            <LogOut size={16}/><span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.mobileHeader}>
          {brand}
          <button ref={menuTriggerRef} className={styles.mobileMenu} type="button" onClick={() => setMenuOpen(value => !value)} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="workspace-navigation">
            {menuOpen ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
