"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, CreditCard, Eye, LayoutDashboard, LogOut, Menu, Settings, Users, X, ArrowUpRight, ChevronDown, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, group: "Workspace" },
  { href: "/dashboard?view=cards", label: "Kartu NFC", icon: CreditCard, group: "Workspace" },
  { href: "/dashboard/customers", label: "Customer Insights", icon: Users, group: "Insights" },
  { href: "/dashboard/business", label: "Bisnis", icon: Building2, group: "Workspace" },
  { href: "/dashboard/landing-page", label: "Page Studio", icon: Eye, group: "Workspace" },
  { href: "/dashboard/settings", label: "Pengaturan", icon: Settings, group: "Account" },
];
const groups = ["Workspace", "Insights", "Account"];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("Akun");

  useEffect(() => {
    let alive = true;
    (async () => {
      const expiry = Number(localStorage.getItem("ditapaja_login_expires_at") || 0);
      if (expiry && Date.now() > expiry) {
        localStorage.removeItem("ditapaja_login_expires_at");
        await supabase.auth.signOut();
        if (alive) router.replace("/login");
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (!alive || !data.user) return;
      setEmail(data.user.email || "");
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", data.user.id).maybeSingle();
      if (!alive) return;
      setDisplayName(profile?.full_name || data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Akun");
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); };
  }, [menuOpen]);

  function active(href: string) {
    const path = href.split("?")[0];
    if (path === "/dashboard") {
      const cardsView = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("view") === "cards";
      return pathname === path && (href.includes("view=cards") ? cardsView : !cardsView);
    }
    return pathname === path || pathname.startsWith(path + "/");
  }

  function navigate(item: typeof items[number], event: React.MouseEvent<HTMLAnchorElement>) {
    if (item.href.includes("?")) {
      event.preventDefault();
      window.location.assign(item.href);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="dt-app-shell">
      <header className="dt-app-header">
        <Link href="/" className="dt-app-brand" aria-label="DiTapAja beranda">
          <span className="dt-app-brand-symbol"><i/><i/><i/></span>
          <span>DiTap<span className="dt-app-brand-accent">Aja</span></span>
        </Link>
        <button className={menuOpen ? "dt-app-menu-button is-open" : "dt-app-menu-button"} type="button" onClick={() => setMenuOpen(value => !value)} aria-label={menuOpen ? "Tutup navigasi" : "Buka navigasi"} aria-expanded={menuOpen} aria-controls="dt-workspace-navigation">
          {menuOpen ? <X size={20}/> : <Menu size={20}/>}<span>{menuOpen ? "Tutup" : "Menu"}</span>
        </button>
      </header>

      {menuOpen && (
        <div className="dt-app-menu-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setMenuOpen(false); }}>
          <section id="dt-workspace-navigation" className="dt-app-menu-panel" role="dialog" aria-modal="true" aria-label="Navigasi workspace">
            <div className="dt-menu-orbit dt-menu-orbit-a"/><div className="dt-menu-orbit dt-menu-orbit-b"/>
            <button className="dt-menu-close" type="button" onClick={() => setMenuOpen(false)} aria-label="Tutup menu"><X size={18}/></button>

            <nav className="dt-app-menu-links" aria-label="Halaman workspace">
              {groups.map(group => {
                const groupItems = items.filter(item => item.group === group);
                const isCollapsed = collapsed.includes(group);
                return <div className={"dt-menu-group" + (isCollapsed ? " is-collapsed" : "")} key={group}>
                  <button className="dt-menu-group-title" type="button" onClick={() => setCollapsed(current => current.includes(group) ? current.filter(value => value !== group) : [...current, group])} aria-expanded={!isCollapsed}>
                    <span>{group}</span><i/><span className="dt-group-chevron"><ChevronDown size={15}/></span>
                  </button>
                  {!isCollapsed && <div className="dt-menu-group-items">
                    {groupItems.map(item => {
                      const Icon = item.icon;
                      const selected = active(item.href);
                      return <Link key={item.href} href={item.href} className={selected ? "is-active" : ""} aria-current={selected ? "page" : undefined} onClick={event => { setMenuOpen(false); navigate(item, event); }}>
                        <span className="dt-menu-link-icon"><Icon size={21}/></span>
                        <span className="dt-menu-link-copy"><b>{item.label}</b></span>
                        <ArrowUpRight className="dt-menu-link-arrow" size={17}/>
                        <span className="dt-menu-link-glow"/>
                      </Link>;
                    })}
                  </div>}
                </div>;
              })}

            </nav>

            <div className="dt-app-menu-bottom">
              <div className="dt-app-menu-account">
                <span className="dt-app-profile-avatar">{displayName.slice(0, 1).toUpperCase()}</span>
                <span className="dt-app-profile-copy"><b>{displayName}</b><small>{email || "Akun DiTapAja"}</small></span>
              </div>
              <button type="button" onClick={logout} aria-label="Sign out"><LogOut size={17}/><span>Sign out</span></button>
            </div>
          </section>
        </div>
      )}

      <div className="dt-app-content">{children}</div>
      <nav className="dt-floating-nav" aria-label="Navigasi utama">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = active(item.href);
          return <Link key={item.href} href={item.href} aria-current={isActive ? "page" : undefined} className={isActive ? "is-active" : ""} onClick={event => navigate(item, event)}>
            <Icon size={18} strokeWidth={1.9}/><span>{item.label}</span>
          </Link>;
        })}
      </nav>
    </div>
  );
}
