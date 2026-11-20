"use client";

import "./dashboard-reset.css";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Activity, ArrowUpRight, Building2, ChevronDown, CreditCard, LayoutDashboard,
  LogOut, Menu, Package, PanelsTopLeft, Settings2, Users, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, group: "WORKSPACE" },
  { href: "/dashboard#cards", label: "NFC Cards", icon: CreditCard, group: "WORKSPACE" },
  { href: "/dashboard/customers", label: "Customer Insights", icon: Users, group: "WORKSPACE" },
  { href: "/dashboard/orders", label: "Orders", icon: Package, group: "MANAGE" },
  { href: "/dashboard/business", label: "Business Profile", icon: Building2, group: "MANAGE" },
  { href: "/dashboard/landing-page", label: "Page Studio", icon: PanelsTopLeft, group: "MANAGE" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings2, group: "PREFERENCES" },
];

const titles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/customers": "Customer Insights",
  "/dashboard/orders": "Orders",
  "/dashboard/business": "Business Profile",
  "/dashboard/landing-page": "Page Studio",
  "/dashboard/settings": "Settings",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = titles[pathname] || "Workspace";

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function active(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href;
  }

  return (
    <div className="dt-reset-app">
      <aside className="dt-reset-sidebar">
        <Link href="/dashboard" className="dt-reset-brand">
          <span className="dt-reset-brand-mark">D.</span>
          <span><strong>DiTapAja</strong><small>BUSINESS CONSOLE</small></span>
        </Link>
        <div className="dt-reset-workspace">
          <span className="dt-reset-workspace-icon">W</span>
          <span><small>WORKSPACE</small><strong>My business</strong></span>
          <ChevronDown size={15} />
        </div>
        {["WORKSPACE", "MANAGE", "PREFERENCES"].map((group) => (
          <div className="dt-reset-nav-group" key={group}>
            <p>{group}</p>
            {items.filter((item) => item.group === group).map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={active(href) ? "active" : ""}>
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
                {active(href) && <i />}
              </Link>
            ))}
          </div>
        ))}
        <div className="dt-reset-sidebar-bottom">
          <div className="dt-reset-help"><Activity size={17}/><span><b>Everything in sync</b><small>Your workspace is up to date</small></span></div>
          <button type="button" onClick={logout}><LogOut size={17}/> Sign out</button>
        </div>
      </aside>

      {mobileOpen && <button className="dt-reset-scrim" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
      <div className="dt-reset-main">
        <header className="dt-reset-topbar">
          <div className="dt-reset-topbar-left">
            <button className="dt-reset-menu" aria-label="Open navigation" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={20}/> : <Menu size={20}/>}
            </button>
            <div><p>DITAPAJA <span>/</span> WORKSPACE</p><h1>{title}</h1></div>
          </div>
          <div className="dt-reset-topbar-right">
            <span className="dt-reset-live"><i/> SYSTEM LIVE</span>
            <Link href="/dashboard/settings" className="dt-reset-avatar" aria-label="Account settings">A</Link>
          </div>
        </header>
        <div className="dt-reset-content">{children}</div>
      </div>

      <nav className="dt-reset-mobile-nav" aria-label="Mobile navigation">
        {items.filter((item) => ["/dashboard", "/dashboard/customers", "/dashboard/orders", "/dashboard/landing-page", "/dashboard/settings"].includes(item.href)).map(({href,label,icon:Icon}) => (
          <Link key={href} href={href} className={active(href) ? "active" : ""}><Icon size={19}/><span>{label === "Customer Insights" ? "Insights" : label === "Page Studio" ? "Studio" : label}</span></Link>
        ))}
      </nav>
    </div>
  );
}
