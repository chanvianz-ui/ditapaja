"use client";

import AdminMenu from "@/app/admin/admin-menu";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, Ban, Check, Copy, CreditCard, KeyRound, LayoutDashboard, Pencil, X,
  Loader2, LogOut, Plus, RefreshCw, Search, ShieldCheck, Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type PinRow = { id: string; pin_hint: string; status: "available" | "claimed" | "revoked"; created_at: string; claimed_at: string | null; card_id: string | null; card: { id: string; card_name: string | null; public_code: string; destination_url: string; user_id: string | null; active: boolean | null; created_at: string | null; archived_at: string | null } | null; owner: { full_name: string | null; username: string | null } | null };

export default function AdminPinsPage() {
  const router = useRouter();
  const [pins, setPins] = useState<PinRow[]>([]);
    const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState("");
  const [filter, setFilter] = useState<"all" | "available" | "claimed" | "revoked" | "archived">("all");
  const [search, setSearch] = useState("");
  const [inventoryName, setInventoryName] = useState("");
  const [inventoryUrl, setInventoryUrl] = useState("");
  const [inventoryCreating, setInventoryCreating] = useState(false);
  // Hasil pembuatan kartu hanya ditampilkan sekali setelah berhasil dibuat.
  const [inventoryResult, setInventoryResult] = useState<{pin:string;cardUrl:string;cardName:string}|null>(null);
  const [editingCard, setEditingCard] = useState<{id:string;cardName:string;destinationUrl:string}|null>(null);
  const [savingCard, setSavingCard] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const token = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) { router.replace("/login"); throw new Error("Sesi login tidak ditemukan."); }
    return data.session.access_token;
  }, [router]);

  const loadPins = useCallback(async () => {
    setError("");
    try {
      const accessToken = await token();
      const response = await fetch("/api/admin/pins", { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal memuat PIN.");
      setPins(result.pins);
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan."); }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { void loadPins(); }, [loadPins]);

  async function createCardInventory() {
    setError(""); setMessage(""); setInventoryResult(null);
    if (!inventoryName.trim() || !inventoryUrl.trim()) { setError("Nama kartu dan Google Maps Review URL wajib diisi."); return; }
    setInventoryCreating(true);
    try {
      const accessToken = await token();
      const response = await fetch("/api/admin/cards", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ cardName: inventoryName, destinationUrl: inventoryUrl }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal membuat kartu.");
      setInventoryResult({ pin: result.pin, cardUrl: result.cardUrl, cardName: result.cardName });
      setInventoryName(""); setInventoryUrl(""); setMessage("Kartu dan PIN berhasil dibuat sebagai satu paket.");
      await loadPins();
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan."); }
    finally { setInventoryCreating(false); }
  }

  async function saveCardEdit() {
    if (!editingCard) return;
    if (!editingCard.cardName.trim() || !editingCard.destinationUrl.trim()) {
      setError("Nama kartu dan URL tujuan wajib diisi.");
      return;
    }
    setSavingCard(true); setError(""); setMessage("");
    try {
      const accessToken = await token();
      const response = await fetch("/api/admin/cards", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(editingCard),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal memperbarui kartu.");
      setEditingCard(null);
      setMessage("Detail kartu berhasil diperbarui.");
      await loadPins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSavingCard(false);
    }
  }

  async function runBulkAction(action: "archive" | "revoke") {
    const eligible = pins.filter(pin => selectedIds.includes(pin.id) && !pin.card?.archived_at &&
      (action === "archive" || pin.status === "available"));
    if (!eligible.length) { setError(action === "revoke" ? "Pilih PIN yang masih tersedia." : "Pilih kartu yang belum diarsipkan."); return; }
    const label = action === "archive" ? "arsipkan kartu" : "nonaktifkan PIN";
    if (!window.confirm(`Yakin ingin ${label} untuk ${eligible.length} item terpilih?`)) return;
    setBulkLoading(true); setError(""); setMessage("");
    try {
      const accessToken = await token();
      const response = await fetch("/api/admin/pins", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: action === "archive" ? "bulk_archive" : "bulk_revoke", ids: eligible.map(pin => pin.id) }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Aksi massal gagal.");
      setSelectedIds([]);
      setMessage(action === "archive" ? `${result.updated} kartu berhasil diarsipkan.` : `${result.updated} PIN berhasil dinonaktifkan.`);
      await loadPins();
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan."); }
    finally { setBulkLoading(false); }
  }

  async function archiveCard(id: string) {
    if (!window.confirm("Arsipkan kartu ini? Kartu tidak bisa diaktifkan lagi setelah diarsipkan.")) return;
    try {
      const accessToken = await token();
      const response = await fetch("/api/admin/pins", { method: "PATCH", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "archive" }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal mengarsipkan kartu.");
      setMessage("Kartu berhasil diarsipkan.");
      await loadPins();
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan."); }
  }

  async function revokePin(id: string) {
    if (!window.confirm("Nonaktifkan PIN ini?")) return;
    try {
      const accessToken = await token();
      const response = await fetch("/api/admin/pins", { method: "PATCH", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal menonaktifkan PIN.");
      setMessage("PIN berhasil dinonaktifkan.");
      await loadPins();
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan."); }
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1800);
    } catch { setError("Tidak dapat menyalin otomatis. Silakan pilih dan salin PIN secara manual."); }
  }

  async function logout() { await supabase.auth.signOut(); router.replace("/login"); }
  const available = pins.filter(p => p.status === "available" && p.card && !p.card.archived_at).length;
  const claimed = pins.filter(p => p.status === "claimed" && p.card && !p.card.archived_at).length;
  const revoked = pins.filter(p => p.status === "revoked" && p.card && !p.card.archived_at).length;
  const linked = pins.filter(p => p.card?.user_id && !p.card.archived_at).length;
  const activeWithoutAccount = pins.filter(p => p.card?.active && !p.card.user_id && !p.card.archived_at).length;
  const visiblePins = pins.filter(pin => {
    const matchesFilter = filter === "all" || (filter === "archived" ? Boolean(pin.card?.archived_at) : !pin.card?.archived_at && pin.status === filter);
    const matchesSearch = !search || pin.pin_hint.toLowerCase().includes(search.toLowerCase()) || pin.id.toLowerCase().includes(search.toLowerCase()) || (pin.card?.card_name ?? "").toLowerCase().includes(search.toLowerCase()) || (pin.card?.public_code ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-[#f4f5f2] text-[#20251f]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col bg-[#202720] px-5 py-6 text-white lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d8e5d2] text-[#26372a]"><LayoutDashboard size={20}/></div>
          <div><p className="text-[15px] font-bold tracking-tight">DiTapAja</p><p className="mt-0.5 text-[10px] font-medium uppercase tracking-[.18em] text-[#9eaa9d]">Control center</p></div>
        </div>
        <div className="mt-12">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#829083]">Workspace</p>
          <button onClick={() => router.push("/admin")} className="mt-4 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm text-[#b7c1b5] transition hover:bg-white/5 hover:text-white"><LayoutDashboard size={17}/> Overview</button>
          <button onClick={() => router.push("/admin/orders")} className="mt-1.5 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm text-[#b7c1b5] transition hover:bg-white/5 hover:text-white"><CreditCard size={17}/> Order management</button>
          <button onClick={() => router.push("/admin/users")} className="mt-1.5 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm text-[#b7c1b5] transition hover:bg-white/5 hover:text-white"><Users size={17}/> User management</button>
          <div className="mt-1.5 flex items-center gap-3 rounded-xl bg-[#354337] px-3.5 py-3 text-sm font-semibold text-[#e5efe2]"><KeyRound size={17}/> Activation PINs <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c3d9b9]"/></div>
        </div>
        <div className="mt-auto">
          <div className="rounded-2xl border border-white/10 bg-white/[.045] p-4"><div className="flex items-center gap-2 text-[#d5e3d0]"><ShieldCheck size={16}/><span className="text-xs font-semibold">Superadmin access</span></div><p className="mt-2 text-[11px] leading-5 text-[#9eaa9d]">Akses penuh untuk mengelola platform DiTapAja.</p></div>
          <button onClick={logout} className="mt-4 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-[#b7c1b5] transition hover:bg-rose-500/10 hover:text-rose-200"><LogOut size={17}/> Sign out</button>
        </div>
      </aside>

      <section className="min-h-screen lg:ml-[264px]">
        <header className="sticky top-0 z-20 border-b border-[#e7e9e3] bg-[#f8f9f6]/90 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-4 sm:px-8 lg:px-10">
            <div><p className="text-[11px] font-medium text-[#899187]">DiTapAja <span className="mx-1.5 text-[#c0c6bd]">/</span> Workspace</p><h1 className="mt-1 text-base font-semibold tracking-tight sm:text-lg">Activation PINs</h1></div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setRefreshing(true); void loadPins(); }} disabled={loading || refreshing} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e1e5dc] bg-white px-3.5 text-xs font-semibold text-[#536052] transition hover:border-[#b9c8b5] disabled:opacity-50"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""}/><span className="hidden sm:inline">Refresh data</span></button>
              <div className="lg:hidden"><AdminMenu/></div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-8 sm:py-9 lg:px-10">
          <div className="mb-8">
            <button onClick={() => router.push("/admin")} className="mb-5 inline-flex items-center gap-2 text-[11px] font-medium text-[#879184] transition hover:text-[#526b4e]"><span aria-hidden="true">←</span> Kembali ke overview</button>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#dce5d7] bg-[#edf3e9] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-[#526b4e]"><KeyRound size={12}/> Card activation</div>
            <h2 className="text-[30px] font-semibold leading-tight tracking-[-.045em] sm:text-[38px]">Activation PINs.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7d877b]">Kelola stok kode aktivasi kartu NFC. Pasangkan setiap PIN dengan satu kartu fisik. Buat paket kartu dan PIN dari form di bawah, lalu pantau status aktivasi.</p>
          </div>

          {error && <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#f0c9c4] bg-[#fff4f1] p-4 text-sm text-[#a3453a]"><AlertCircle size={18} className="mt-0.5 shrink-0"/><div><p className="font-semibold">Ada kendala</p><p className="mt-1">{error}</p></div></div>}
          {message && <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#dce5d7] bg-[#edf3e9] p-4 text-sm text-[#526b4e]"><Check size={18} className="mt-0.5 shrink-0"/><p className="font-medium">{message}</p></div>}

          <section className="mb-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.8fr)]">
            <article className="rounded-2xl border border-[#e2e7df] bg-white p-5 sm:p-6">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf3e9] text-[#607c59]"><CreditCard size={18}/></span><div><h3 className="text-sm font-semibold">Siapkan kartu + PIN</h3><p className="mt-1 text-xs text-[#899386]">Buat kartu fisik dan PIN aktivasi dalam satu proses.</p></div></div>
              <div className="mt-5 grid gap-4">
                <label className="grid gap-2 text-xs font-semibold text-[#596556]">Nama kartu<input value={inventoryName} onChange={e=>setInventoryName(e.target.value)} maxLength={60} placeholder="Contoh: Kartu Meja Kasir" className="h-11 rounded-xl border border-[#e2e7df] bg-[#fafbf9] px-3 text-sm font-normal outline-none focus:border-[#9bad94]"/></label>
                <label className="grid gap-2 text-xs font-semibold text-[#596556]">Google Maps Review URL<input type="url" value={inventoryUrl} onChange={e=>setInventoryUrl(e.target.value)} placeholder="https://search.google.com/local/writereview?placeid=..." className="h-11 rounded-xl border border-[#e2e7df] bg-[#fafbf9] px-3 text-sm font-normal outline-none focus:border-[#9bad94]"/></label>
                <button onClick={()=>void createCardInventory()} disabled={inventoryCreating} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#263b2b] px-4 text-xs font-bold text-white hover:bg-[#354c39] disabled:opacity-50">{inventoryCreating ? <Loader2 size={15} className="animate-spin"/> : <Plus size={15}/>} Buat kartu dan PIN</button>
              </div>
            </article>
            <article className="rounded-2xl border border-[#e2e7df] bg-[#f9fbf7] p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#82917d]">Paket aktivasi</p>
              {inventoryResult ? <><h3 className="mt-3 text-lg font-semibold">{inventoryResult.cardName}</h3><p className="mt-1 text-xs text-[#849080]">Simpan PIN ini dan berikan kepada pembeli bersama kartu.</p><div className="mt-5 rounded-xl border border-[#dfe7da] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8b9686]">PIN kartu</p><div className="mt-2 flex items-center justify-between gap-2"><strong className="font-mono text-lg tracking-wider">{inventoryResult.pin}</strong><button onClick={()=>void copyText(inventoryResult.pin,"inventory-pin")} className="rounded-lg border border-[#e3e8df] p-2 text-[#61765b]"><Copy size={15}/></button></div></div><div className="mt-3 rounded-xl border border-[#dfe7da] bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8b9686]">URL NFC untuk ditulis ke kartu</p><p className="mt-2 break-all text-xs text-[#596556]">{inventoryResult.cardUrl}</p><button onClick={()=>void copyText(inventoryResult.cardUrl,"inventory-url")} className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[#526b4e]"><Copy size={13}/> Salin URL kartu</button></div></> : <div className="flex h-full min-h-[220px] flex-col justify-center"><div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-[#6d8166]"><ShieldCheck size={20}/></div><h3 className="mt-4 text-sm font-semibold">Satu paket, satu kepemilikan</h3><p className="mt-2 max-w-xs text-xs leading-6 text-[#849080]">Setiap kartu mendapat URL NFC unik dan satu PIN. Pembeli hanya perlu PIN untuk aktivasi atau menghubungkan kartu ke akun.</p></div>}
            </article>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total kartu", value: pins.filter(p => p.card).length, note: "Kartu dengan PIN terpasang", tone: "bg-[#edf1f7] text-[#627b9a]", icon: CreditCard },
              { label: "Siap digunakan", value: available, note: "Belum diaktifkan customer", tone: "bg-[#edf3e9] text-[#63805c]", icon: ShieldCheck },
              { label: "Aktif tanpa akun", value: activeWithoutAccount, note: "Aktivasi PIN tanpa login", tone: "bg-[#fbf3e5] text-[#9a7740]", icon: Check },
              { label: "Terhubung akun", value: linked, note: "Dimiliki pengguna dashboard", tone: "bg-[#f2eef7] text-[#796a9c]", icon: Users },
            ].map(item => { const Icon = item.icon; return <article key={item.label} className="rounded-2xl border border-[#e5e8e1] bg-white p-5 sm:p-6"><div className="flex items-start justify-between"><p className="text-xs font-medium text-[#7e887c]">{item.label}</p><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.tone}`}><Icon size={17}/></span></div><p className="mt-5 text-[32px] font-semibold leading-none tracking-[-.04em]">{loading ? "—" : item.value.toLocaleString("id-ID")}</p><p className="mt-3 text-[11px] text-[#9aa296]">{item.note}</p></article>; })}
          </section>

          <section className="mt-7">
            <article className="rounded-2xl bg-[#263329] p-5 text-white sm:p-6">
              <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#a7b6a2]">Stock snapshot</p><p className="mt-3 text-[34px] font-semibold leading-none tracking-[-.045em]">{loading ? "—" : available.toLocaleString("id-ID")}</p><p className="mt-2 text-xs text-[#b4c0b0]">PIN siap digunakan</p></div><KeyRound size={22} className="text-[#c3d5b9]"/></div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-white/[.06] p-3"><p className="text-[10px] text-[#b4c0b0]">Aktif / terpakai</p><p className="mt-1 text-xl font-semibold">{claimed}</p></div>
                <div className="rounded-xl bg-white/[.06] p-3"><p className="text-[10px] text-[#b4c0b0]">Dinonaktifkan</p><p className="mt-1 text-xl font-semibold">{revoked}</p></div>
                <div className="rounded-xl bg-white/[.06] p-3"><p className="text-[10px] text-[#b4c0b0]">Diarsipkan</p><p className="mt-1 text-xl font-semibold">{pins.filter(p => p.card?.archived_at).length}</p></div>
              </div>
              <p className="mt-4 text-[10px] leading-5 text-[#a7b6a2]">Ringkasan berdasarkan maksimal 200 kartu terbaru yang dimuat.</p>
            </article>
          </section>

          <section className="mt-7 overflow-hidden rounded-2xl border border-[#e2e7df] bg-white">
            <div className="border-b border-[#edf0eb] px-5 py-5 sm:px-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8b9887]">Activation inventory</p><h3 className="mt-2 text-lg font-semibold tracking-tight">Daftar PIN</h3><p className="mt-1 text-xs text-[#929b90]">Maksimal 200 kartu terbaru ditampilkan. Kode PIN lengkap tidak disimpan di daftar ini.</p></div><span className="text-[11px] font-medium text-[#929b90]">{visiblePins.length} dari {pins.length} data</span></div><div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap gap-2">{([{key:"all",label:"Semua",count:pins.length},{key:"available",label:"Tersedia",count:available},{key:"claimed",label:"Digunakan",count:claimed},{key:"revoked",label:"Dinonaktifkan",count:revoked},{key:"archived",label:"Arsip",count:pins.filter(p => p.card?.archived_at).length}] as const).map(item => <button key={item.key} onClick={() => setFilter(item.key)} className={filter === item.key ? "rounded-full bg-[#29382b] px-3.5 py-2 text-[10px] font-semibold text-white" : "rounded-full border border-[#e4e8e1] bg-white px-3.5 py-2 text-[10px] font-semibold text-[#778273] transition hover:bg-[#f7f9f5]"}>{item.label} <span className={filter === item.key ? "ml-1 text-[#d8e5d2]" : "ml-1 text-[#a0a89d]"}>{item.count}</span></button>)}</div><div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button onClick={() => setSelectedIds(visiblePins.filter(p => !p.card?.archived_at).map(p => p.id))} className="h-10 rounded-xl border border-[#e4e8e1] px-3 text-[10px] font-semibold text-[#687365]">Pilih semua</button>
                <button onClick={() => setSelectedIds([])} className="h-10 rounded-xl border border-[#e4e8e1] px-3 text-[10px] font-semibold text-[#687365]">Reset pilihan</button>
              </div><div className="relative w-full lg:max-w-[280px]"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa296]"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama kartu, hint PIN, atau kode NFC..." className="h-10 w-full rounded-xl border border-[#e5e9e2] bg-[#f8f9f6] pl-10 pr-4 text-xs text-[#394338] outline-none transition placeholder:text-[#a1a99e] focus:border-[#aebfa7] focus:bg-white focus:ring-4 focus:ring-[#edf3e9]"/></div></div></div>
            {selectedIds.length > 0 && <div className="flex flex-col gap-3 border-b border-[#edf0eb] bg-[#f7f9f5] px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="text-xs font-semibold text-[#526b4e]">{selectedIds.length} item dipilih</p><div className="flex flex-wrap gap-2"><button disabled={bulkLoading} onClick={() => void runBulkAction("revoke")} className="h-9 rounded-lg border border-[#efdfdc] px-3 text-[11px] font-semibold text-[#a45e54] disabled:opacity-50">{bulkLoading ? "Memproses..." : "Cabut PIN terpilih"}</button><button disabled={bulkLoading} onClick={() => void runBulkAction("archive")} className="h-9 rounded-lg bg-[#29382b] px-3 text-[11px] font-semibold text-white disabled:opacity-50">Arsipkan kartu terpilih</button></div></div>}
            {loading ? <div className="px-5 py-16 text-center text-xs text-[#929b90]">Memuat data PIN...</div> : pins.length === 0 ? <div className="px-5 py-16 text-center"><KeyRound size={26} className="mx-auto mb-3 text-[#c3cbc0]"/><p className="text-sm font-semibold text-[#687365]">Belum ada PIN aktivasi</p><p className="mt-1 text-xs text-[#a0a89d]">Generate PIN pertama untuk mulai mengisi stok.</p></div> : <div className="divide-y divide-[#f0f2ee]">
              {visiblePins.map(pin => {
                const archived = Boolean(pin.card?.archived_at);
                const cardState = archived ? "Diarsipkan" : pin.card?.user_id ? "Terhubung ke akun" : pin.card?.active ? "Aktif · Tanpa akun" : "Tersedia";
                const stateTone = archived ? "bg-[#f0f1ee] text-[#858d82]" : pin.card?.user_id ? "bg-[#edf1f7] text-[#627b9a]" : pin.card?.active ? "bg-[#fbf3e5] text-[#9a7740]" : "bg-[#edf3e9] text-[#55744e]";
                return <div key={pin.id} className="flex flex-col justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#fafbf9] sm:flex-row sm:items-center sm:px-6">
                  <div className="flex min-w-0 items-start gap-3"><input aria-label={`Pilih ${pin.card?.card_name || "kartu"}`} type="checkbox" checked={selectedIds.includes(pin.id)} disabled={archived} onChange={e => setSelectedIds(current => e.target.checked ? [...current, pin.id] : current.filter(id => id !== pin.id))} className="mt-3 h-4 w-4 accent-[#526b4e] disabled:opacity-30"/><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f1f4ef] text-[#758570]"><CreditCard size={17}/></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#303a30]">{pin.card?.card_name || "Kartu tanpa nama"}</p><p className="mt-1 text-[11px] text-[#899386]">PIN ••••-{pin.pin_hint} <span className="mx-1">·</span> NFC {pin.card?.public_code || "Belum terpasang"}</p><p className="mt-1 break-all text-[10px] text-[#9aa296]">{pin.card?.destination_url || "URL tujuan tidak tersedia"}</p><p className="mt-1 text-[10px] text-[#9aa296]">{pin.card?.user_id ? `Pemilik: ${pin.owner?.full_name || pin.owner?.username || "Akun terhubung"}` : "Belum terhubung ke akun"} <span className="mx-1">·</span> Dibuat {new Date(pin.created_at).toLocaleDateString("id-ID")}</p></div></div>
                  <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end"><span className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${stateTone}`}>{cardState}</span>{!archived && <button onClick={() => setEditingCard({ id: pin.card!.id, cardName: pin.card!.card_name || "", destinationUrl: pin.card!.destination_url || "" })} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e1e6dc] px-3 text-[11px] font-semibold text-[#64765e] transition hover:bg-[#f2f6ef]"><Pencil size={13}/> Edit</button>}{!archived && pin.status === "available" && <button onClick={() => void revokePin(pin.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#efdfdc] px-3 text-[11px] font-semibold text-[#a45e54] transition hover:bg-[#fff4f1]"><Ban size={13}/> Revoke PIN</button>}{!archived && <button onClick={() => void archiveCard(pin.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e1e6dc] px-3 text-[11px] font-semibold text-[#64765e] transition hover:bg-[#f2f6ef]"><Ban size={13}/> Arsipkan</button>}</div>
                </div>;
              })}
            </div>}
            {!loading && pins.length > 0 && visiblePins.length === 0 && <div className="px-5 py-14 text-center"><Search size={24} className="mx-auto mb-3 text-[#c3cbc0]"/><p className="text-sm font-semibold text-[#687365]">Tidak ada kartu yang cocok</p><p className="mt-1 text-xs text-[#a0a89d]">Coba ubah kata kunci atau filter yang dipilih.</p></div>}
          </section>
          {editingCard && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#182219]/55 p-4 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget && !savingCard) setEditingCard(null); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="edit-card-title" className="w-full max-w-lg rounded-2xl border border-[#e2e7df] bg-white p-5 shadow-2xl sm:p-7">
              <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#879681]">Card management</p><h3 id="edit-card-title" className="mt-2 text-xl font-semibold tracking-tight text-[#293329]">Edit detail kartu</h3><p className="mt-1 text-xs leading-5 text-[#8c9688]">Perubahan URL tujuan akan langsung berlaku saat kartu NFC dipindai berikutnya.</p></div><button aria-label="Tutup" disabled={savingCard} onClick={() => setEditingCard(null)} className="rounded-lg border border-[#e5e9e2] p-2 text-[#778273] hover:bg-[#f7f9f5]"><X size={16}/></button></div>
              <div className="mt-6 grid gap-4">
                <label className="grid gap-2 text-xs font-semibold text-[#596556]">Nama kartu<input value={editingCard.cardName} onChange={e=>setEditingCard(v=>v?{...v,cardName:e.target.value}:v)} maxLength={60} className="h-11 rounded-xl border border-[#e2e7df] bg-[#fafbf9] px-3 text-sm font-normal outline-none focus:border-[#9bad94]"/></label>
                <label className="grid gap-2 text-xs font-semibold text-[#596556]">Google Maps Review URL<input type="url" value={editingCard.destinationUrl} onChange={e=>setEditingCard(v=>v?{...v,destinationUrl:e.target.value}:v)} className="h-11 rounded-xl border border-[#e2e7df] bg-[#fafbf9] px-3 text-sm font-normal outline-none focus:border-[#9bad94]"/></label>
              </div>
              <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button disabled={savingCard} onClick={()=>setEditingCard(null)} className="h-11 rounded-xl border border-[#e2e7df] px-5 text-xs font-semibold text-[#687365] hover:bg-[#f7f9f5] disabled:opacity-50">Batal</button><button disabled={savingCard} onClick={()=>void saveCardEdit()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#29382b] px-5 text-xs font-semibold text-white hover:bg-[#3a4b3b] disabled:opacity-50">{savingCard ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} Simpan perubahan</button></div>
            </section>
          </div>}
          <p className="mt-5 text-center text-[10px] text-[#a0a89d]">DiTapAja Control Center <span className="mx-1">·</span> Activation PIN inventory</p>
        </div>
      </section>
    </main>
  );
}
