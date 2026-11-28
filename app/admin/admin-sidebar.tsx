"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Users, KeyRound, ShieldCheck, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

const items = [
  { id: "overview", label: "Ringkasan", href: "/admin", icon: LayoutDashboard },
  { id: "orders", label: "Manajemen pesanan", href: "/admin/orders", icon: ShoppingBag },
  { id: "users", label: "Manajemen pengguna", href: "/admin/users", icon: Users },
  { id: "pins", label: "PIN aktivasi", href: "/admin/pins", icon: KeyRound },
] as const;

export default function AdminSidebar({ active }: { active: "overview" | "orders" | "users" | "pins" | "notifications" }) {
  const router = useRouter();
  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }
  return (
    <aside className="dt-admin-sidebar">
      <Link href="/admin" className="dt-admin-sidebar-brand">
        <span className="dt-admin-sidebar-mark"><LayoutDashboard size={19}/></span>
        <span><b>DiTapAja</b><small>KONTROL PLATFORM</small></span>
      </Link>
      <div className="dt-admin-sidebar-label">RUANG KERJA</div>
      <nav aria-label="Navigasi Superadmin" className="dt-admin-sidebar-nav">
        {items.map(({ id, label, href, icon: Icon }) => (
          <Link key={id} href={href} aria-current={active === id ? "page" : undefined} className={active === id ? "is-active" : ""}>
            <Icon size={17} strokeWidth={1.8}/><span>{label}</span>
            {active === id && <i aria-hidden="true"/>}
          </Link>
        ))}
      </nav>
      <div className="dt-admin-sidebar-bottom">
        <div className="dt-admin-access">
          <ShieldCheck size={17}/>
          <span><b>Akses Superadmin</b><small>Kelola operasional platform DiTapAja.</small></span>
        </div>
        <button type="button" onClick={logout}><LogOut size={17}/> Keluar</button>
      </div>
    </aside>
  );
}
