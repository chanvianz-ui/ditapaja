"use client";

import AdminMenu from "@/app/admin/admin-menu";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, Ban, Check, Copy, CreditCard, KeyRound, LayoutDashboard,
  Loader2, LogOut, Plus, RefreshCw, ShieldCheck, Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type PinRow = { id: string; pin_hint: string; status: "available" | "claimed" | "revoked"; created_at: string; claimed_at: string | null };

export default function AdminPinsPage() {
  const router = useRouter();
  const [pins, setPins] = useState<PinRow[]>([]);
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newPins, setNewPins] = useState<string[]>([]);
  const [copied, setCopied] = useState("");

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

  async function createPins() {
    const count = Number(quantity);
    if (!Number.isInteger(count) || count < 1 || count > 100) { setError("Jumlah PIN harus 1 sampai 100."); return; }
    setCreating(true); setError(""); setMessage(""); setNewPins([]);
    try {
      const accessToken = await token();
      const response = await fetch("/api/admin/pins", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ quantity: count }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal membuat PIN.");
      setNewPins(result.pins); setMessage(result.message); await loadPins();
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan."); }
    finally { setCreating(false); }
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
  const available = pins.filter(p => p.status === "available").length;
  const claimed = pins.filter(p => p.status === "claimed").length;
  const revoked = pins.filter(p => p.status === "revoked").length;
  const statusStyle = (status: PinRow["status"]) => status === "available" ? "bg-[#edf3e9] text-[#55744e]" : status === "claimed" ? "bg-[#edf1f7] text-[#627b9a]" : "bg-[#f0f1ee] text-[#858d82]";
  const statusLabel = (status: PinRow["status"]) => status === "available" ? "Available" : status === "claimed" ? "Claimed" : "Revoked";

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
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7d877b]">Kelola stok kode aktivasi kartu NFC. Buat PIN dalam jumlah banyak, simpan kode yang baru dibuat, dan pantau status penggunaannya.</p>
          </div>

          {error && <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#f0c9c4] bg-[#fff4f1] p-4 text-sm text-[#a3453a]"><AlertCircle size={18} className="mt-0.5 shrink-0"/><div><p className="font-semibold">Ada kendala</p><p className="mt-1">{error}</p></div></div>}
          {message && <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#dce5d7] bg-[#edf3e9] p-4 text-sm text-[#526b4e]"><Check size={18} className="mt-0.5 shrink-0"/><p className="font-medium">{message}</p></div>}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total PIN tercatat", value: pins.length, note: "Maksimal 200 PIN terbaru", tone: "bg-[#edf1f7] text-[#627b9a]", icon: KeyRound },
              { label: "Siap digunakan", value: available, note: "Belum diaktifkan customer", tone: "bg-[#edf3e9] text-[#63805c]", icon: ShieldCheck },
              { label: "Sudah digunakan", value: claimed, note: "Telah diklaim customer", tone: "bg-[#f2eef7] text-[#796a9c]", icon: Check },
              { label: "Dinonaktifkan", value: revoked, note: "Tidak dapat digunakan", tone: "bg-[#f0f1ee] text-[#858d82]", icon: Ban },
            ].map(item => { const Icon = item.icon; return <article key={item.label} className="rounded-2xl border border-[#e5e8e1] bg-white p-5 sm:p-6"><div className="flex items-start justify-between"><p className="text-xs font-medium text-[#7e887c]">{item.label}</p><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.tone}`}><Icon size={17}/></span></div><p className="mt-5 text-[32px] font-semibold leading-none tracking-[-.04em]">{loading ? "—" : item.value.toLocaleString("id-ID")}</p><p className="mt-3 text-[11px] text-[#9aa296]">{item.note}</p></article>; })}
          </section>

          <section className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
            <article className="rounded-2xl border border-[#e2e7df] bg-white p-5 sm:p-6">
              <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf3e9] text-[#607c59]"><Plus size={19}/></span><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8b9887]">Inventory production</p><h3 className="mt-1.5 text-lg font-semibold tracking-tight">Generate activation PIN</h3><p className="mt-1 text-xs leading-5 text-[#929b90]">Terbitkan kode aktivasi baru untuk stok kartu NFC.</p></div></div>
              <div className="mt-6 rounded-xl bg-[#f7f8f5] p-4 sm:p-5">
                <label htmlFor="pin-quantity" className="mb-2 block text-[11px] font-semibold text-[#687365]">Jumlah PIN yang ingin dibuat</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input id="pin-quantity" type="number" min="1" max="100" value={quantity} onChange={e => setQuantity(e.target.value)} className="h-12 w-full rounded-xl border border-[#e1e6dc] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[#aebfa7] focus:ring-4 focus:ring-[#edf3e9] sm:max-w-[150px]"/>
                  <button onClick={createPins} disabled={creating} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#29382b] px-5 text-sm font-semibold text-white transition hover:bg-[#3a4b3b] disabled:cursor-not-allowed disabled:opacity-50">{creating ? <Loader2 size={17} className="animate-spin"/> : <Plus size={17}/>} {creating ? "Membuat PIN..." : Number(quantity) === 1 ? "Generate 1 PIN" : "Generate PIN"}</button>
                </div>
                <p className="mt-3 text-[11px] leading-5 text-[#929b90]">Bisa membuat 1–100 PIN dalam satu proses. Pastikan jumlah sudah benar sebelum generate.</p>
              </div>
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#eee8d9] bg-[#fbf8f0] p-3.5 text-[11px] leading-5 text-[#897b5d]"><ShieldCheck size={15} className="mt-0.5 shrink-0"/> PIN lengkap hanya ditampilkan satu kali setelah dibuat. Simpan atau salin sebelum meninggalkan halaman.</div>
            </article>

            <article className="flex flex-col rounded-2xl bg-[#263329] p-5 text-white sm:p-6">
              <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#a7b6a2]">Stock snapshot</p><KeyRound size={18} className="text-[#c3d5b9]"/></div>
              <p className="mt-6 text-[38px] font-semibold leading-none tracking-[-.045em]">{loading ? "—" : available.toLocaleString("id-ID")}</p>
              <p className="mt-2 text-xs text-[#b4c0b0]">PIN siap digunakan</p>
              <div className="my-6 h-px bg-white/10"/>
              <div className="space-y-4">
                <div><div className="mb-2 flex justify-between text-[11px]"><span className="text-[#b4c0b0]">Sudah digunakan</span><span className="font-semibold text-[#e1eadc]">{claimed}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#a9c39e]" style={{ width: `${pins.length ? Math.min(100, claimed / pins.length * 100) : 0}%` }}/></div></div>
                <div><div className="mb-2 flex justify-between text-[11px]"><span className="text-[#b4c0b0]">Dinonaktifkan</span><span className="font-semibold text-[#e1eadc]">{revoked}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#8d9890]" style={{ width: `${pins.length ? Math.min(100, revoked / pins.length * 100) : 0}%` }}/></div></div>
              </div>
              <p className="mt-auto pt-7 text-[11px] leading-5 text-[#a7b6a2]">Ringkasan dihitung dari maksimal 200 PIN terbaru yang ditampilkan sistem.</p>
            </article>
          </section>

          {newPins.length > 0 && <section className="mt-6 overflow-hidden rounded-2xl border border-[#dce5d7] bg-white">
            <div className="flex flex-col justify-between gap-4 border-b border-[#edf0eb] bg-[#f7faf5] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
              <div><div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-[#63805c]"><Check size={13}/> Generation complete</div><h3 className="mt-2 text-lg font-semibold tracking-tight">PIN baru berhasil dibuat</h3><p className="mt-1 text-xs text-[#929b90]">Salin dan simpan sekarang. Kode lengkap tidak dapat ditampilkan kembali.</p></div>
              <button onClick={() => void copyText(newPins.join("\n"), "all")} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#29382b] px-4 text-xs font-semibold text-white transition hover:bg-[#3a4b3b]">{copied === "all" ? <Check size={15}/> : <Copy size={15}/>} {copied === "all" ? "Tersalin" : "Salin semua PIN"}</button>
            </div>
            <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5">{newPins.map((pin, index) => <div key={pin} className="flex items-center justify-between gap-3 rounded-xl border border-[#e8ece5] bg-[#fbfcfa] px-4 py-3"><div><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-[#9aa296]">PIN {index + 1}</p><p className="mt-1 font-mono text-sm font-bold tracking-[.12em] text-[#29382b]">{pin}</p></div><button aria-label="Salin PIN" onClick={() => void copyText(pin, pin)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e1e6dc] bg-white text-[#607c59] transition hover:bg-[#edf3e9]">{copied === pin ? <Check size={15}/> : <Copy size={15}/>}</button></div>)}</div>
          </section>}

          <section className="mt-7 overflow-hidden rounded-2xl border border-[#e2e7df] bg-white">
            <div className="border-b border-[#edf0eb] px-5 py-5 sm:px-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8b9887]">Activation inventory</p><h3 className="mt-2 text-lg font-semibold tracking-tight">Daftar PIN</h3><p className="mt-1 text-xs text-[#929b90]">Maksimal 200 PIN terbaru ditampilkan. Kode penuh tidak disimpan di daftar ini.</p></div><span className="text-[11px] font-medium text-[#929b90]">{visiblePins.length} dari {pins.length} data</span></div><div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap gap-2">{([{key:"all",label:"Semua",count:pins.length},{key:"available",label:"Tersedia",count:available},{key:"claimed",label:"Digunakan",count:claimed},{key:"revoked",label:"Dinonaktifkan",count:revoked}] as const).map(item => <button key={item.key} onClick={() => setFilter(item.key)} className={filter === item.key ? "rounded-full bg-[#29382b] px-3.5 py-2 text-[10px] font-semibold text-white" : "rounded-full border border-[#e4e8e1] bg-white px-3.5 py-2 text-[10px] font-semibold text-[#778273] transition hover:bg-[#f7f9f5]"}>{item.label} <span className={filter === item.key ? "ml-1 text-[#d8e5d2]" : "ml-1 text-[#a0a89d]"}>{item.count}</span></button>)}</div><div className="relative w-full lg:max-w-[280px]"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa296]"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kode atau ID PIN..." className="h-10 w-full rounded-xl border border-[#e5e9e2] bg-[#f8f9f6] pl-10 pr-4 text-xs text-[#394338] outline-none transition placeholder:text-[#a1a99e] focus:border-[#aebfa7] focus:bg-white focus:ring-4 focus:ring-[#edf3e9]"/></div></div></div>
            {loading ? <div className="px-5 py-16 text-center text-xs text-[#929b90]">Memuat data PIN...</div> : pins.length === 0 ? <div className="px-5 py-16 text-center"><KeyRound size={26} className="mx-auto mb-3 text-[#c3cbc0]"/><p className="text-sm font-semibold text-[#687365]">Belum ada PIN aktivasi</p><p className="mt-1 text-xs text-[#a0a89d]">Generate PIN pertama untuk mulai mengisi stok.</p></div> : <div className="divide-y divide-[#f0f2ee]">
              {pins.map(pin => <div key={pin.id} className="flex flex-col justify-between gap-3 px-5 py-4 transition-colors hover:bg-[#fafbf9] sm:flex-row sm:items-center sm:px-6">
                <div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f1f4ef] text-[#758570]"><KeyRound size={17}/></div><div><p className="font-mono text-sm font-bold tracking-[.08em] text-[#303a30]">••••-{pin.pin_hint}</p><p className="mt-1 text-[11px] text-[#9aa296]">Dibuat {new Date(pin.created_at).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>{pin.claimed_at && <p className="mt-0.5 text-[10px] text-[#9aa296]">Digunakan {new Date(pin.claimed_at).toLocaleString("id-ID")}</p>}</div></div>
                <div className="flex items-center justify-between gap-3 sm:justify-end"><span className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${statusStyle(pin.status)}`}>{statusLabel(pin.status)}</span>{pin.status === "available" && <button onClick={() => void revokePin(pin.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#efdfdc] px-3 text-[11px] font-semibold text-[#a45e54] transition hover:bg-[#fff4f1]"><Ban size={13}/> Revoke</button>}</div>
              </div>)}
            </div>}
          </section>
          <p className="mt-5 text-center text-[10px] text-[#a0a89d]">DiTapAja Control Center <span className="mx-1">·</span> Activation PIN inventory</p>
        </div>
      </section>
    </main>
  );
}
