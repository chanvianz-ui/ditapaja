"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, Copy, KeyRound, Loader2, LogOut, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

type PinRow = { id: string; pin_hint: string; status: "available" | "claimed" | "revoked"; created_at: string; claimed_at: string | null };

export default function AdminPinsPage() {
  const router = useRouter();
  const [pins, setPins] = useState<PinRow[]>([]);
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newPins, setNewPins] = useState<string[]>([]);

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
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { loadPins(); }, [loadPins]);

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
      await loadPins();
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan."); }
  }

  async function logout() { await supabase.auth.signOut(); router.replace("/login"); }
  const available = pins.filter(p => p.status === "available").length;
  const claimed = pins.filter(p => p.status === "claimed").length;

  return <main className="min-h-screen bg-[#f5f7fb] text-[#17243b]">
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-xl"><div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-4 sm:px-8">
      <div className="flex items-center gap-3"><button onClick={() => router.push("/admin")} className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-blue-50"><ArrowLeft size={18}/></button><div><h1 className="font-bold">DiTapAja</h1><p className="text-xs text-slate-400">PIN Management</p></div></div>
      <div className="flex items-center gap-2"><span className="hidden items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 sm:flex"><ShieldCheck size={15}/> Super Admin</span><button onClick={logout} className="rounded-xl border border-slate-200 p-2.5 text-slate-500"><LogOut size={17}/></button></div>
    </div></header>
    <div className="mx-auto max-w-[1200px] p-5 sm:p-8">
      <p className="text-xs text-slate-400">Admin Overview / Management</p><h2 className="mt-2 text-3xl font-bold">NFC Activation PINs</h2><p className="mt-2 text-sm text-slate-500">Buat PIN aktivasi untuk stok kartu NFC dan bagikan kepada customer.</p>
      <div className="my-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">PIN ditampilkan</p><p className="mt-2 text-3xl font-bold">{pins.length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Available</p><p className="mt-2 text-3xl font-bold text-blue-600">{available}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Claimed</p><p className="mt-2 text-3xl font-bold text-emerald-600">{claimed}</p></div>
      </div>
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><KeyRound size={21}/></div><div><h3 className="font-bold">Generate PIN</h3><p className="text-xs text-slate-400">Buat satu PIN atau generate hingga 100 PIN sekaligus.</p></div></div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row"><input type="number" min="1" max="100" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm sm:max-w-[180px]"/><button onClick={createPins} disabled={creating} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{creating ? <Loader2 size={17} className="animate-spin"/> : <Plus size={17}/>} {creating ? "Membuat PIN..." : Number(quantity) === 1 ? "Generate 1 PIN" : "Generate PIN"}</button><button onClick={loadPins} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"><RefreshCw size={16}/> Refresh</button></div>
        <p className="mt-3 text-xs text-slate-400">PIN lengkap hanya ditampilkan satu kali setelah dibuat. Simpan atau salin sebelum meninggalkan halaman.</p>
      </section>
      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {message && <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div>}
      {newPins.length > 0 && <section className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/60 p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-blue-950">PIN berhasil dibuat</h3><p className="mt-1 text-xs text-blue-700">Salin dan simpan sekarang. PIN lengkap tidak dapat ditampilkan kembali.</p></div><button onClick={() => navigator.clipboard.writeText(newPins.join("\n"))} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white"><Copy size={15}/> Salin Semua</button></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{newPins.map(pin => <div key={pin} className="flex items-center justify-between rounded-xl border border-blue-100 bg-white px-4 py-3 font-mono text-sm font-bold tracking-wider"><span>{pin}</span><button onClick={() => navigator.clipboard.writeText(pin)} className="text-blue-600"><Copy size={16}/></button></div>)}</div></section>}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-5"><h3 className="font-bold">PIN Inventory</h3><p className="mt-1 text-xs text-slate-400">Maksimal 200 PIN terbaru ditampilkan.</p></div>
        {loading ? <div className="p-10 text-center text-sm text-slate-400">Memuat data PIN...</div> : pins.length === 0 ? <div className="p-10 text-center text-sm text-slate-400">Belum ada PIN. Generate PIN pertama kamu.</div> : <div className="divide-y divide-slate-100">{pins.map(pin => <div key={pin.id} className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"><div><p className="font-mono text-sm font-bold">••••-{pin.pin_hint}</p><p className="mt-1 text-xs text-slate-400">{new Date(pin.created_at).toLocaleString("id-ID")}</p></div><div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${pin.status === "available" ? "bg-blue-50 text-blue-700" : pin.status === "claimed" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{pin.status}</span>{pin.status === "available" && <button onClick={() => revokePin(pin.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"><Ban size={14}/> Revoke</button>}</div></div>)}</div>}
      </section>
    </div>
  </main>;
}
