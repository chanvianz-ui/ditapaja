"use client";

import { useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Bell, ChevronDown, CreditCard, LayoutDashboard, Menu, MoreHorizontal, MousePointer2, Package, Plus, Search, Settings, Sparkles, Users, X } from "lucide-react";
import "./prototype.css";

const nav = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "NFC Cards", icon: CreditCard },
  { label: "Orders", icon: Package },
  { label: "Customer Insights", icon: Users },
  { label: "Settings", icon: Settings },
];

const metrics = [
  { label: "Total taps", value: "12,840", delta: "+18.6%", positive: true, note: "vs. previous month" },
  { label: "Review clicks", value: "8,492", delta: "+12.4%", positive: true, note: "vs. previous month" },
  { label: "Active cards", value: "24", delta: "3 inactive", positive: false, note: "across your business" },
  { label: "Orders", value: "08", delta: "2 pending", positive: false, note: "need your attention" },
];

const cards = [
  { name: "Main Counter", code: "DT-8F29A1", taps: "3,248", status: "Active", tone: "black" },
  { name: "Cashier Desk", code: "DT-3B71C4", taps: "2,106", status: "Active", tone: "silver" },
  { name: "Dining Area", code: "DT-9D42E8", taps: "1,842", status: "Inactive", tone: "cream" },
];

const bars = [32, 48, 40, 64, 54, 78, 61, 88, 72, 94, 76, 100, 83, 91];

export default function PrototypePage() {
  const [active, setActive] = useState("Overview");
  const [period, setPeriod] = useState("Last 7 days");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotice, setShowNotice] = useState(true);

  return (
    <main className="dt-prototype">
      <aside className={`dt-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="dt-brand"><span className="dt-brand-mark"><i/><i/><i/></span><span>DiTap<span>Aja</span></span><small>STUDIO</small></div>
        <div className="dt-workspace"><div className="dt-workspace-avatar">K</div><div><b>Kopi Kecil Studio</b><small>Business workspace</small></div><ChevronDown size={15}/></div>
        <div className="dt-nav-label">WORKSPACE</div>
        <nav>{nav.map(item => { const Icon = item.icon; return <button key={item.label} className={active === item.label ? "active" : ""} onClick={() => { setActive(item.label); setMobileOpen(false); }}><Icon size={18}/><span>{item.label}</span>{item.label === "Orders" && <em>2</em>}</button>; })}</nav>
        <div className="dt-sidebar-bottom"><div className="dt-help-card"><div className="dt-help-icon"><Sparkles size={16}/></div><b>Make every tap count.</b><p>Your cards are working. See what customers do next.</p><button onClick={() => setActive("Customer Insights")}>Explore insights <ArrowUpRight size={14}/></button></div><div className="dt-user"><div className="dt-user-avatar">CI</div><div><b>Chandra Irawan</b><small>Administrator</small></div><MoreHorizontal size={18}/></div></div>
      </aside>

      <section className="dt-main">
        <header className="dt-topbar"><button className="dt-mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">{mobileOpen ? <X/> : <Menu/>}</button><div className="dt-breadcrumb">Workspace <span>/</span> <b>{active}</b></div><div className="dt-top-actions"><button className="dt-search"><Search size={16}/><span>Search anything</span><kbd>⌘ K</kbd></button><button className="dt-icon-button"><Bell size={18}/><i/></button><div className="dt-top-avatar">CI</div></div></header>

        <div className="dt-content">
          <div className="dt-page-heading"><div><div className="dt-eyebrow"><span/> WEDNESDAY, 18 NOVEMBER 2026</div><h1>{active === "Overview" ? "Good evening, Chandra." : active}</h1><p>{active === "Overview" ? "Here’s what’s happening across your DiTapAja cards." : `A clearer view of your ${active.toLowerCase()}.`}</p></div><div className="dt-heading-actions"><button className="dt-period" onClick={() => setPeriod(period === "Last 7 days" ? "Last 30 days" : "Last 7 days")}>{period}<ChevronDown size={15}/></button><button className="dt-primary" onClick={() => setActive("NFC Cards")}><Plus size={16}/> New card</button></div></div>

          {showNotice && <div className="dt-notice"><div className="dt-notice-symbol"><Activity size={17}/></div><div><b>Your cards are collecting useful signals.</b><span>Review clicks are up 12.4% this month. Take a look at what’s working.</span></div><button onClick={() => setActive("Customer Insights")}>View insights <ArrowUpRight size={15}/></button><button className="dt-notice-close" onClick={() => setShowNotice(false)} aria-label="Dismiss"><X size={16}/></button></div>}

          {active === "Overview" ? <>
            <div className="dt-metrics">{metrics.map((m, i) => <article className="dt-metric" key={m.label}><div className="dt-metric-top"><span>{m.label}</span><button><MoreHorizontal size={18}/></button></div><div className="dt-metric-value">{m.value}</div><div className="dt-metric-foot"><span className={m.positive ? "dt-positive" : "dt-neutral"}>{m.positive ? <ArrowUpRight size={14}/> : null}{m.delta}</span><small>{m.note}</small></div><div className={`dt-metric-index idx-${i}`}/></article>)}</div>
            <div className="dt-dashboard-grid">
              <article className="dt-panel dt-chart-panel"><div className="dt-panel-heading"><div><span className="dt-panel-kicker">PERFORMANCE</span><h2>Engagement overview</h2><p>Tap activity and review intent over time</p></div><button className="dt-chart-filter">Daily <ChevronDown size={14}/></button></div><div className="dt-chart-legend"><span><i className="legend-taps"/> Total taps <b>12,840</b></span><span><i className="legend-clicks"/> Review clicks <b>8,492</b></span></div><div className="dt-chart"><div className="dt-chart-y"><span>1.2k</span><span>900</span><span>600</span><span>300</span><span>0</span></div><div className="dt-chart-plot"><div className="dt-grid-lines"><i/><i/><i/><i/><i/></div><svg viewBox="0 0 700 190" preserveAspectRatio="none" aria-label="Engagement chart"><defs><linearGradient id="tapFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#b8c8ad" stopOpacity=".28"/><stop offset="100%" stopColor="#b8c8ad" stopOpacity="0"/></linearGradient></defs><path d="M0 150 C35 140 40 116 80 122 S130 148 160 112 S220 105 250 94 S290 126 330 88 S380 98 410 72 S465 94 500 58 S550 75 580 42 S640 54 700 18 L700 190 L0 190Z" fill="url(#tapFill)"/><path d="M0 150 C35 140 40 116 80 122 S130 148 160 112 S220 105 250 94 S290 126 330 88 S380 98 410 72 S465 94 500 58 S550 75 580 42 S640 54 700 18" fill="none" stroke="#b8c8ad" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/><path d="M0 174 C45 166 55 154 80 160 S130 164 160 148 S220 153 250 140 S290 153 330 132 S380 146 410 118 S465 130 500 112 S550 122 580 95 S640 106 700 82" fill="none" stroke="#b4aaa0" strokeWidth="2" strokeDasharray="5 5" vectorEffect="non-scaling-stroke"/></svg><div className="dt-chart-x"><span>12 Nov</span><span>13 Nov</span><span>14 Nov</span><span>15 Nov</span><span>16 Nov</span><span>17 Nov</span><span>18 Nov</span></div></div></div></article>
              <article className="dt-panel dt-top-cards"><div className="dt-panel-heading"><div><span className="dt-panel-kicker">YOUR NETWORK</span><h2>Top performing cards</h2><p>By total NFC taps</p></div><button className="dt-more"><MoreHorizontal size={19}/></button></div><div className="dt-card-list">{cards.map((card, i) => <div className="dt-card-row" key={card.code}><div className={`dt-mini-card ${card.tone}`}><span>DiTapAja</span><b>{i === 1 ? "D." : "D"}</b><small>NFC REVIEW</small></div><div className="dt-card-info"><b>{card.name}</b><small>{card.code}</small><span className={card.status === "Active" ? "status-active" : "status-inactive"}><i/>{card.status}</span></div><div className="dt-card-taps"><b>{card.taps}</b><small>taps</small></div></div>)}</div><button className="dt-text-link" onClick={() => setActive("NFC Cards")}>View all cards <ArrowUpRight size={15}/></button></article>
            </div>
            <div className="dt-bottom-grid"><article className="dt-panel dt-activity"><div className="dt-panel-heading"><div><span className="dt-panel-kicker">LIVE FEED</span><h2>Recent activity</h2></div><button className="dt-more"><MoreHorizontal size={19}/></button></div><div className="dt-activity-list"><div><span className="activity-dot tap"><MousePointer2 size={14}/></span><p><b>Main Counter</b> received a new NFC tap<small>Just now · NFC interaction</small></p><strong>+1 tap</strong></div><div><span className="activity-dot click"><ArrowUpRight size={14}/></span><p><b>Cashier Desk</b> opened Google Review<small>12 minutes ago · Review click</small></p><strong>+1 click</strong></div><div><span className="activity-dot order"><Package size={14}/></span><p><b>New order</b> #DT-2026-008 has been submitted<small>1 hour ago · Order received</small></p><strong>Review</strong></div></div></article><article className="dt-panel dt-quick-panel"><span className="dt-panel-kicker">QUICK ACTIONS</span><h2>Keep things moving.</h2><p>Shortcuts to the things you do most.</p><div className="dt-quick-actions"><button onClick={() => setActive("NFC Cards")}><span><Plus size={17}/></span><b>Create a card</b><ArrowUpRight size={15}/></button><button onClick={() => setActive("Orders")}><span><Package size={17}/></span><b>Check orders</b><ArrowUpRight size={15}/></button><button onClick={() => setActive("Customer Insights")}><span><Users size={17}/></span><b>Explore insights</b><ArrowUpRight size={15}/></button></div></article></div>
          </> : <div className="dt-placeholder-panel"><div className="dt-placeholder-icon">{(() => { const Icon = nav.find(n => n.label === active)?.icon || LayoutDashboard; return <Icon size={25}/>; })()}</div><span className="dt-panel-kicker">INTERACTIVE CONCEPT</span><h2>{active} workspace</h2><p>This is a visual prototype. The navigation is clickable; live account data and actions are intentionally not connected.</p><button className="dt-primary" onClick={() => setActive("Overview")}>Back to overview <ArrowUpRight size={15}/></button></div>}
          <footer className="dt-footer"><span>DiTapAja Studio <i/> Dashboard concept 2026</span><span>Designed for better connections.</span></footer>
        </div>
      </section>
    </main>
  );
}
