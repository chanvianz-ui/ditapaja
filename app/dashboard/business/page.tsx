"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, MapPin, Phone, Plus, Save, Trash2, Loader2, CheckCircle2, AlertCircle, Pencil, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Location = { id: string; name: string; category: string | null; address: string | null; phone: string | null };

export default function BusinessSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [locationPhone, setLocationPhone] = useState("");
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editLocationName, setEditLocationName] = useState("");
  const [editLocationAddress, setEditLocationAddress] = useState("");
  const [editLocationPhone, setEditLocationPhone] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) { router.replace("/login"); return; }
      setUserId(auth.user.id);
      const [{ data: profile, error: profileError }, { data: rows, error: locationsError }] = await Promise.all([
        supabase.from("profiles").select("business_name,business_category,business_phone,business_address").eq("id", auth.user.id).maybeSingle(),
        supabase.from("business_locations").select("id,name,category,address,phone").eq("user_id", auth.user.id).order("created_at", { ascending: false })
      ]);
      if (profileError || locationsError) setError("Gagal memuat data bisnis. Pastikan migration platform sudah dijalankan di Supabase.");
      setBusinessName(profile?.business_name || "");
      setCategory(profile?.business_category || "");
      setPhone(profile?.business_phone || "");
      setAddress(profile?.business_address || "");
      setLocations((rows || []) as Location[]);
      setLoading(false);
    }
    load();
  }, [router]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    const { error: saveError } = await supabase.from("profiles").upsert({
      id: userId, business_name: businessName.trim(), business_category: category.trim() || null,
      business_phone: phone.trim() || null, business_address: address.trim() || null
    }, { onConflict: "id" });
    if (saveError) setError("Profil bisnis gagal disimpan: " + saveError.message);
    else setMessage("Profil bisnis berhasil diperbarui.");
    setSaving(false);
  }

  async function addLocation(event: React.FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    if (!locationName.trim()) { setError("Nama cabang wajib diisi."); return; }
    const { data, error: insertError } = await supabase.from("business_locations").insert({
      user_id: userId, name: locationName.trim(), address: locationAddress.trim() || null, phone: locationPhone.trim() || null, category: category.trim() || null
    }).select("id,name,category,address,phone").single();
    if (insertError) { setError("Cabang gagal ditambahkan: " + insertError.message); return; }
    setLocations((current) => [data as Location, ...current]);
    setLocationName(""); setLocationAddress(""); setLocationPhone("");
    setMessage("Lokasi bisnis berhasil ditambahkan.");
  }

  function startEditLocation(location: Location) {
    setEditingLocationId(location.id);
    setEditLocationName(location.name);
    setEditLocationAddress(location.address || "");
    setEditLocationPhone(location.phone || "");
    setError(""); setMessage("");
  }

  async function saveLocationEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingLocationId || !editLocationName.trim()) {
      setError("Nama cabang wajib diisi.");
      return;
    }
    setSavingLocation(true); setError(""); setMessage("");
    const { data, error: updateError } = await supabase
      .from("business_locations")
      .update({
        name: editLocationName.trim(),
        address: editLocationAddress.trim() || null,
        phone: editLocationPhone.trim() || null,
      })
      .eq("id", editingLocationId)
      .eq("user_id", userId)
      .select("id,name,category,address,phone")
      .single();
    if (updateError) {
      setError("Perubahan cabang gagal disimpan: " + updateError.message);
    } else {
      setLocations((current) => current.map((item) => item.id === editingLocationId ? data as Location : item));
      setEditingLocationId(null);
      setMessage("Informasi cabang berhasil diperbarui.");
    }
    setSavingLocation(false);
  }

  async function removeLocation(id: string) {
    setError(""); setMessage("");
    const { error: deleteError } = await supabase.from("business_locations").delete().eq("id", id).eq("user_id", userId);
    if (deleteError) { setError("Lokasi gagal dihapus: " + deleteError.message); return; }
    setLocations((current) => current.filter((item) => item.id !== id));
    setMessage("Lokasi berhasil dihapus. Kartu yang terhubung tidak ikut terhapus.");
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc]"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-6 text-slate-900 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <button onClick={() => router.push("/dashboard")} className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"><ArrowLeft size={17}/> Kembali ke Dashboard</button>
        <div className="mb-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 shadow-sm ring-1 ring-blue-100"><Building2 size={23}/></div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-600">Business Workspace</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Profil & Lokasi Bisnis</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Kelola identitas bisnis dan cabang dalam satu akun DiTapAja. Data ini menjadi fondasi pengelolaan kartu multi-lokasi.</p>
        </div>

        {(error || message) && <div className={`mb-5 flex items-start gap-2 rounded-xl border p-4 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error ? <AlertCircle size={18}/> : <CheckCircle2 size={18}/>}<span>{error || message}</span></div>}

        <div className="grid items-start gap-4 sm:gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6">
            <div className="mb-6 flex items-center gap-3"><Building2 className="text-blue-600"/><div><h2 className="font-bold">Business Profile</h2><p className="text-xs text-slate-400">Informasi utama bisnis kamu</p></div></div>
            <form onSubmit={saveProfile} className="space-y-4">
              <label className="block text-sm font-semibold">Nama bisnis<input value={businessName} onChange={e=>setBusinessName(e.target.value)} maxLength={100} required placeholder="Contoh: Kopi Senja" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/></label>
              <label className="block text-sm font-semibold">Kategori bisnis<input value={category} onChange={e=>setCategory(e.target.value)} maxLength={80} placeholder="Cafe, restoran, salon..." className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/></label>
              <label className="block text-sm font-semibold">Nomor WhatsApp<input value={phone} onChange={e=>setPhone(e.target.value)} maxLength={30} placeholder="08xxxxxxxxxx" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/></label>
              <label className="block text-sm font-semibold">Alamat utama<textarea value={address} onChange={e=>setAddress(e.target.value)} maxLength={300} rows={3} placeholder="Alamat bisnis..." className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/></label>
              <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"><Save size={17}/>{saving ? "Menyimpan..." : "Simpan Profil Bisnis"}</button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6">
            <div className="mb-6 flex items-center gap-3"><MapPin className="text-blue-600"/><div><h2 className="font-bold">Business Locations</h2><p className="text-xs text-slate-400">Daftar cabang bisnis</p></div></div>
            <form onSubmit={addLocation} className="mb-6 space-y-3 rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-semibold">Tambah lokasi baru</p>
              <input value={locationName} onChange={e=>setLocationName(e.target.value)} maxLength={100} placeholder="Nama cabang, mis. Jakarta Selatan" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>
              <input value={locationAddress} onChange={e=>setLocationAddress(e.target.value)} maxLength={300} placeholder="Alamat cabang (opsional)" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>
              <input value={locationPhone} onChange={e=>setLocationPhone(e.target.value)} maxLength={30} placeholder="Nomor WhatsApp (opsional)" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>
              <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"><Plus size={17}/> Tambahkan Cabang</button>
            </form>
            <div className="space-y-3">
              {locations.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center"><MapPin className="mx-auto mb-2 text-slate-300"/><p className="text-sm font-medium text-slate-500">Belum ada cabang tambahan</p><p className="mt-1 text-xs text-slate-400">Tambahkan cabang untuk mulai mengelola kartu multi-lokasi.</p></div> : locations.map((location) => <div key={location.id} className="rounded-xl border border-slate-200 p-4">
                {editingLocationId === location.id ? (
                  <form onSubmit={saveLocationEdit} className="space-y-3">
                    <input value={editLocationName} onChange={e=>setEditLocationName(e.target.value)} maxLength={100} required placeholder="Nama cabang" className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>
                    <input value={editLocationAddress} onChange={e=>setEditLocationAddress(e.target.value)} maxLength={300} placeholder="Alamat cabang" className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>
                    <input value={editLocationPhone} onChange={e=>setEditLocationPhone(e.target.value)} maxLength={30} placeholder="Nomor WhatsApp" className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>
                    <div className="flex gap-2">
                      <button disabled={savingLocation} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-50"><Save size={14}/>{savingLocation ? "Menyimpan..." : "Simpan"}</button>
                      <button type="button" disabled={savingLocation} onClick={()=>setEditingLocationId(null)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600"><X size={14}/> Batal</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="font-semibold">{location.name}</p>{location.address && <p className="mt-1 text-xs text-slate-500">{location.address}</p>}{location.phone && <p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><Phone size={12}/>{location.phone}</p>}</div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button onClick={()=>startEditLocation(location)} aria-label={`Edit ${location.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Pencil size={16}/></button>
                      <button onClick={()=>removeLocation(location.id)} aria-label={`Hapus ${location.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16}/></button>
                    </div>
                  </div>
                )}
              </div>)}
            </div>
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-xs font-semibold text-blue-800">Multi-lokasi aktif</p><p className="mt-1 text-xs leading-5 text-blue-700">Pilih cabang saat membuat atau mengedit kartu NFC. Statistik dapat difilter per cabang dari Dashboard Analytics. Menghapus cabang akan melepas kaitan kartu, bukan menghapus kartu atau riwayat aktivitasnya.</p></div>
          </section>
        </div>
      </div>
    </main>
  );
}
