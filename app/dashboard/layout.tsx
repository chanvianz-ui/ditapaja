"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Building2, CreditCard, Eye, LayoutDashboard, LogOut, Menu, Settings, ShoppingBag, Users, X, ChevronRight, Command } from "lucide-react";
import { supabase } from "@/lib/supabase";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, group: "Workspace", description: "Ringkasan performa dan aktivitas" },
  { href: "/dashboard?view=cards", label: "Kartu NFC", icon: CreditCard, group: "Workspace", description: "Kelola kartu dan status aktif" },
  { href: "/dashboard/customers", label: "Customer Insights", icon: Users, group: "Insights", description: "Kenali aktivitas pelanggan" },
  { href: "/dashboard/orders", label: "Pesanan", icon: ShoppingBag, group: "Insights", description: "Pantau transaksi masuk" },
  { href: "/dashboard/business", label: "Bisnis", icon: Building2, group: "Workspace", description: "Informasi dan profil bisnis" },
  { href: "/dashboard/landing-page", label: "Page Studio", icon: Eye, group: "Workspace", description: "Atur tampilan halaman publik" },
  { href: "/dashboard/settings", label: "Pengaturan", icon: Settings, group: "Account", description: "Preferensi dan keamanan akun" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("Akun");

  useEffect(() => {
    let alive = true;
    (async () => {
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
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
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
        <button
          className={menuOpen ? "dt-app-menu-button is-open" : "dt-app-menu-button"}
          type="button"
          onClick={() => setMenuOpen(value => !value)}
          aria-label={menuOpen ? "Tutup navigasi" : "Buka navigasi"}
          aria-expanded={menuOpen}
          aria-controls="dt-workspace-navigation"
        >
          {menuOpen ? <X size={20}/> : <Menu size={20}/>}
          <span>{menuOpen ? "Tutup" : "Menu"}</span>
        </button>
      </header>

      {menuOpen && (
        <div className="dt-app-menu-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setMenuOpen(false); }}>
          <section id="dt-workspace-navigation" className="dt-app-menu-panel" role="dialog" aria-modal="true" aria-label="Navigasi workspace">
            <div className="dt-app-menu-heading">
              <div>
                <span className="dt-menu-kicker"><Command size={12}/> DITAPAJA WORKSPACE</span>
                <h2>Menu utama</h2>
                <p>Semua area kerja, tersusun dalam satu tempat.</p>
              </div>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Tutup menu"><X size={20}/></button>
            </div>

            <nav className="dt-app-menu-links" aria-label="Halaman workspace">
              {["Workspace", "Insights", "Account"].map(group => <div className="dt-menu-group" key={group}>
                <div className="dt-menu-group-title">{group}<span>{items.filter(item => item.group === group).length.toString().padStart(2, "0")}</span></div>
                <div className="dt-menu-group-items">
              {items.map((item, index) => { if (item.group !== group) return null;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className={active(item.href) ? "is-active" : ""} aria-current={active(item.href) ? "page" : undefined} onClick={event => { setMenuOpen(false); navigate(item, event); }}>
                    <span className="dt-app-menu-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="dt-menu-link-icon"><Icon size={18}/></span>
                    <span className="dt-menu-link-copy"><b>{item.label}</b><small>{item.description}</small></span>
                    <ChevronRight size={16}/>
                  </Link>
                );
              })}
                </div>
              </div>)}
            </nav>

            <div className="dt-app-menu-bottom">
              <div className="dt-app-menu-account">
                <span className="dt-app-profile-avatar">{displayName.slice(0, 1).toUpperCase()}</span>
                <span className="dt-app-profile-copy"><small>SEDANG MASUK SEBAGAI</small><b>{displayName}</b><small>{email || "Akun DiTapAja"}</small></span>
              </div>
              <button type="button" onClick={logout}><LogOut size={16}/><span>Keluar</span></button>
            </div>
          </section>
        </div>
      )}

      <div className="dt-app-content">{children}</div>

      <nav className="dt-floating-nav" aria-label="Navigasi utama">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = active(item.href);
          return (
            <Link key={item.href} href={item.href} aria-current={isActive ? "page" : undefined} className={isActive ? "is-active" : ""} onClick={event => navigate(item, event)}>
              <Icon size={18} strokeWidth={1.9}/>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
