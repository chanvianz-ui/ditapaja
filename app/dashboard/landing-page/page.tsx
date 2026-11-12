"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, Loader2, Save, Smartphone, Monitor, ImagePlus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Card = { id: string; card_name: string | null; public_code: string; active: boolean; location_id?: string | null };
type Settings = {
  id?: string; card_id: string; is_published: boolean; headline: string; description: string;
  theme: "ocean" | "midnight" | "rose" | "forest"; accent_color: string;
  button_style: "solid" | "outline"; logo_url: string | null; logo_size: number; logo_position: "left" | "center" | "right"; whatsapp_url: string; instagram_url: string; website_url: string;
};
const defaults = (cardId: string): Settings => ({
  card_id: cardId, is_published: false, headline: "Bagikan pengalaman kamu",
  description: "Terima kasih sudah berkunjung. Kami menghargai ulasan dan dukungan kamu.",
  theme: "ocean", accent_color: "#2563eb", button_style: "solid",
  logo_url: null, logo_size: 72, logo_position: "center",
  whatsapp_url: "", instagram_url: "", website_url: ""
});
const themes = [
  { id: "ocean", label: "Ocean", bg: "#f3f7ff", ink: "#172554" },
  { id: "midnight", label: "Midnight", bg: "#111827", ink: "#f8fafc" },
  { id: "rose", label: "Rose", bg: "#fff1f2", ink: "#881337" },
  { id: "forest", label: "Forest", bg: "#f0fdf4", ink: "#14532d" }
] as const;

function validOptionalUrl(value: string) {
  if (!value.trim()) return true;
  try { const url = new URL(value); return url.protocol === "https:"; } catch { return false; }
}

export default function LandingPageEditor() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const [userId, setUserId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [settings, setSettings] = useState<Settings>(defaults(""));
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) { router.replace("/login"); return; }
      const [cardsResult, profileResult] = await Promise.all([
        supabase.from("nfc_cards").select("id,card_name,public_code,active,location_id").eq("user_id", auth.user.id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("business_name").eq("id", auth.user.id).maybeSingle()
      ]);
      const data = cardsResult.data;
      const cardsError = cardsResult.error;
      if (!alive) return;
      setBusinessName(profileResult.data?.business_name?.trim() || "");
      if (cardsError) { setError("Gagal memuat kartu NFC: " + cardsError.message); setLoading(false); return; }
      const ownedCards = (data || []) as Card[];
      setUserId(auth.user.id); setCards(ownedCards);
      if (ownedCards.length) setSelectedCardId(ownedCards[0].id);
      setLoading(false);
    }
    load();
    return () => { alive = false; };
  }, [router]);

  useEffect(() => {
    if (!selectedCardId || !userId) return;
    let alive = true;
    async function loadSettings() {
      setSettingsLoading(true);
      setError(""); setNotice("");
      const { data, error: readError } = await supabase.from("nfc_card_pages")
        .select("id,card_id,is_published,headline,description,theme,accent_color,button_style,logo_url,logo_size,logo_position,whatsapp_url,instagram_url,website_url")
        .eq("card_id", selectedCardId).eq("user_id", userId).maybeSingle();
      if (!alive) return;
      if (readError) {
        setError(readError.message.includes("nfc_card_pages")
          ? "Tabel pengaturan belum tersedia. Jalankan file migration custom NFC landing page di Supabase SQL Editor."
          : "Pengaturan halaman gagal dimuat: " + readError.message);
        setSettings(defaults(selectedCardId));
      } else {
        setSettings(data ? { ...defaults(selectedCardId), ...data, whatsapp_url: data.whatsapp_url || "", instagram_url: data.instagram_url || "", website_url: data.website_url || "" } as Settings : defaults(selectedCardId));
      }
      if (alive) setSettingsLoading(false);
    }
    loadSettings();
    return () => { alive = false; };
  }, [selectedCardId, userId]);

  const selectedCard = useMemo(() => cards.find(card => card.id === selectedCardId), [cards, selectedCardId]);

  useEffect(() => {
    let alive = true;
    async function loadBranch() {
      setBranchName("");
      setBranchAddress("");
      if (!selectedCard?.location_id || !userId) return;
      const { data } = await supabase.from("business_locations")
        .select("name,address")
        .eq("id", selectedCard.location_id)
        .eq("user_id", userId)
        .maybeSingle();
      if (!alive) return;
      setBranchName(data?.name?.trim() || "");
      setBranchAddress(data?.address?.trim() || "");
    }
    void loadBranch();
    return () => { alive = false; };
  }, [selectedCard?.location_id, userId]);
  async function uploadLogo(file?: File) {
    if (!file || !userId || !selectedCardId) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setError("Logo harus berupa PNG, JPG, atau WebP."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Ukuran logo maksimal 2 MB."); return; }
    setLogoUploading(true); setError(""); setNotice("");
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = userId + "/" + selectedCardId + "/" + Date.now() + "." + extension;
    const { data, error: uploadError } = await supabase.storage.from("ditapaja-brand-assets").upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
    if (uploadError) setError("Logo gagal diunggah: " + uploadError.message);
    else {
      const { data: publicData } = supabase.storage.from("ditapaja-brand-assets").getPublicUrl(data.path);
      update("logo_url", publicData.publicUrl);
      setNotice("Logo berhasil diunggah. Klik Simpan Pengaturan untuk menerapkannya.");
    }
    setLogoUploading(false);
  }
  const theme = themes.find(item => item.id === settings.theme) || themes[0];
  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(current => ({ ...current, [key]: value }));
  }

  async function openPreview() {
    if (!selectedCard) return;
    const previewWindow = window.open("about:blank", "_blank");
    if (!previewWindow) {
      setError("Izinkan pop-up browser untuk membuka preview.");
      return;
    }
    setError("");
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (sessionError || !accessToken) throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
      const response = await fetch("/api/preview/" + encodeURIComponent(selectedCard.public_code), {
        method: "POST",
        headers: { Authorization: "Bearer " + accessToken },
      });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || "Preview tidak dapat dibuka.");
      previewWindow.location.href = result.url;
    } catch (previewError) {
      previewWindow.close();
      setError(previewError instanceof Error ? previewError.message : "Preview tidak dapat dibuka.");
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    if (!selectedCard || !selectedCard.active) { setError("Pilih kartu NFC yang aktif untuk menerbitkan halaman."); setSaving(false); return; }
    if (![settings.whatsapp_url, settings.instagram_url, settings.website_url].every(validOptionalUrl)) {
      setError("Semua tautan tambahan harus menggunakan URL HTTPS yang valid."); setSaving(false); return;
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(settings.accent_color)) {
      setError("Warna aksen harus menggunakan format HEX, contoh #2563eb."); setSaving(false); return;
    }
    const payload = {
      user_id: userId, card_id: selectedCardId, is_published: settings.is_published,
      headline: settings.headline.trim(), description: settings.description.trim(),
      theme: settings.theme, accent_color: settings.accent_color,
      button_style: settings.button_style,
      logo_url: settings.logo_url, logo_size: settings.logo_size, logo_position: settings.logo_position,
      whatsapp_url: settings.whatsapp_url.trim() || null,
      instagram_url: settings.instagram_url.trim() || null,
      website_url: settings.website_url.trim() || null,
      updated_at: new Date().toISOString()
    };
    const { error: saveError } = await supabase.from("nfc_card_pages").upsert(payload, { onConflict: "card_id" });
    if (saveError) setError("Gagal menyimpan: " + saveError.message);
    else setNotice("Pengaturan halaman berhasil disimpan.");
    setSaving(false);
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc]"><Loader2 className="animate-spin text-blue-600" /></div>;

  return <main className="min-h-screen bg-[#f7f9fc] px-4 py-6 text-slate-900 sm:px-8 sm:py-8">
    <div className="mx-auto max-w-6xl">
      <button onClick={() => router.push("/dashboard")} className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600"><ArrowLeft size={17}/> Dashboard</button>
      <div className="mb-7"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-600">Page Studio</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Custom NFC Landing Page</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Atur halaman yang dilihat pelanggan setelah menempelkan ponsel ke kartu NFC.</p></div>
      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}
      {cards.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Belum ada kartu NFC. Buat kartu terlebih dahulu dari Dashboard.</div> : <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <form onSubmit={save} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <section><label className="mb-2 block text-sm font-semibold">Pilih kartu NFC</label><select value={selectedCardId} onChange={e => setSelectedCardId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">{cards.map(card => <option key={card.id} value={card.id}>{card.card_name || "Untitled Card"} {card.active ? "" : "— Nonaktif"}</option>)}</select><p className="mt-2 text-xs text-slate-400">Pengaturan disimpan terpisah untuk setiap kartu.</p></section>
          <section className="space-y-3"><h2 className="font-bold">Identitas bisnis</h2><div className="rounded-xl border border-slate-200 p-4"><div className="flex items-center gap-3">{settings.logo_url ? <img src={settings.logo_url} alt="Logo bisnis" className="rounded-xl border border-slate-100 bg-white object-contain p-2" style={{width:settings.logo_size,height:settings.logo_size}}/> : <div className="grid h-16 w-16 place-items-center rounded-xl bg-slate-100 text-slate-400"><ImagePlus size={24}/></div>}<div className="min-w-0 flex-1"><p className="text-sm font-semibold">Logo bisnis</p><p className="mt-1 text-xs leading-5 text-slate-500">PNG, JPG, atau WebP · Maksimal 2 MB</p><label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">{logoUploading ? <Loader2 size={14} className="animate-spin"/> : <ImagePlus size={14}/>} {logoUploading ? "Mengunggah..." : settings.logo_url ? "Ganti logo" : "Upload logo"}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={logoUploading} className="hidden" onChange={e => { const file=e.target.files?.[0]; void uploadLogo(file); e.currentTarget.value=""; }}/></label>{settings.logo_url && <button type="button" onClick={() => update("logo_url",null)} className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-red-600"><Trash2 size={13}/> Hapus</button>}</div></div><div className="mt-4 grid grid-cols-2 gap-3"><label className="text-xs font-semibold text-slate-600">Ukuran logo<select value={settings.logo_size} onChange={e=>update("logo_size",Number(e.target.value))} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value={48}>Kecil</option><option value={64}>Sedang</option><option value={80}>Besar</option><option value={96}>Ekstra besar</option><option value={112}>Maksimal</option></select></label><label className="text-xs font-semibold text-slate-600">Posisi logo<select value={settings.logo_position} onChange={e=>update("logo_position",e.target.value as Settings["logo_position"])} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="left">Kiri</option><option value="center">Tengah</option><option value="right">Kanan</option></select></label></div></div></section>
          <section className="space-y-3"><h2 className="font-bold">Konten halaman</h2><label className="block text-sm font-medium">Judul utama<input value={settings.headline} onChange={e => update("headline", e.target.value)} maxLength={90} required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"/></label><label className="block text-sm font-medium">Deskripsi<textarea value={settings.description} onChange={e => update("description", e.target.value)} maxLength={240} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"/></label></section>
          <section className="space-y-3"><h2 className="font-bold">Tema tampilan</h2><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{themes.map(item => <button key={item.id} type="button" onClick={() => update("theme", item.id)} className={`rounded-xl border p-3 text-left text-xs font-semibold transition ${settings.theme === item.id ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`}><span className="mb-2 block h-8 rounded-lg border border-black/5" style={{background:item.bg}}/><span>{item.label}</span></button>)}</div><label className="flex items-center justify-between gap-3 text-sm font-medium">Warna aksen<input type="color" value={settings.accent_color} onChange={e => update("accent_color", e.target.value)} className="h-10 w-16 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"/></label><label className="block text-sm font-medium">Gaya tombol<select value={settings.button_style} onChange={e => update("button_style", e.target.value as Settings["button_style"])} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"><option value="solid">Solid</option><option value="outline">Outline</option></select></label></section>
          <section className="space-y-3"><h2 className="font-bold">Tautan tambahan</h2><p className="text-xs text-slate-500">Semua tautan bersifat opsional. Gunakan alamat lengkap HTTPS.</p><label className="block text-sm font-medium">WhatsApp<input type="url" value={settings.whatsapp_url} onChange={e => update("whatsapp_url", e.target.value)} placeholder="https://wa.me/628..." className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label><label className="block text-sm font-medium">Instagram<input type="url" value={settings.instagram_url} onChange={e => update("instagram_url", e.target.value)} placeholder="https://instagram.com/namabisnis" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label><label className="block text-sm font-medium">Website<input type="url" value={settings.website_url} onChange={e => update("website_url", e.target.value)} placeholder="https://bisnis.com" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label></section>
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4"><label className="flex items-start gap-3"><input type="checkbox" checked={settings.is_published} onChange={e => update("is_published", e.target.checked)} disabled={!selectedCard?.active} className="mt-1 h-4 w-4 accent-blue-600"/><span><span className="block text-sm font-semibold">Terbitkan halaman kustom</span><span className="mt-1 block text-xs leading-5 text-slate-500">Jika dimatikan, halaman NFC akan tetap menggunakan tampilan standar DiTapAja.</span></span></label></section>
          <button disabled={saving || settingsLoading || !selectedCard} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 hover:bg-blue-700 disabled:opacity-50"><Save size={17}/>{saving ? "Menyimpan..." : settingsLoading ? "Memuat pengaturan..." : "Simpan Pengaturan"}</button>
          {selectedCard && <button type="button" onClick={() => void openPreview()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-600"><Eye size={16}/> Preview halaman</button>}
        </form>
        <aside className="lg:sticky lg:top-6"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 text-sm font-semibold text-slate-600"><Eye size={17}/> Live preview</div><div className="inline-flex rounded-xl border border-slate-200 bg-white p-1"><button type="button" onClick={() => setPreviewMode("mobile")} aria-pressed={previewMode === "mobile"} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"><Smartphone size={14}/> Mobile</button><button type="button" onClick={() => setPreviewMode("desktop")} aria-pressed={previewMode === "desktop"} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"><Monitor size={14}/> Desktop</button></div></div><div className={previewMode === "mobile" ? "mx-auto max-w-[330px] rounded-[2.5rem] border-[7px] border-slate-900 bg-slate-900 p-2 shadow-xl" : "mx-auto w-full max-w-[560px] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"}><div className="overflow-hidden rounded-[2rem] p-5" style={{background:theme.bg,color:theme.ink}}><div className="mx-auto mb-6 h-1.5 w-16 rounded-full bg-slate-400/50"/><div className="mb-5 flex" style={{justifyContent:settings.logo_position}}>{settings.logo_url ? <img src={settings.logo_url} alt="Logo bisnis" className="rounded-xl bg-white object-contain p-2 shadow-sm" style={{width:settings.logo_size,height:settings.logo_size}}/> : <div className="grid h-14 w-14 place-items-center rounded-2xl text-2xl" style={{background:settings.accent_color+"20",color:settings.accent_color}}>✦</div>}</div><p className="text-center text-[9px] font-bold">{businessName || "Bisnis Kami"}</p>{branchName && <p className="mx-auto mt-2 w-fit rounded-full border border-current/10 px-3 py-1 text-[9px] opacity-70">{branchName}</p>}{branchAddress && <p className="mt-2 text-center text-[9px] leading-4 opacity-60">{branchAddress}</p>}<p className="mt-2 text-center text-[9px] opacity-50">{selectedCard?.card_name || "Nama Kartu"}</p><h2 className="mt-3 text-center text-xl font-extrabold leading-tight">{settings.headline || "Judul halaman"}</h2><p className="mt-3 text-center text-xs leading-5 opacity-70">{settings.description || "Deskripsi bisnis kamu akan tampil di sini."}</p><div className="mt-6 space-y-2"><div className="rounded-xl px-3 py-3 text-center text-xs font-bold" style={settings.button_style === "solid" ? {background:settings.accent_color,color:"#fff"} : {background:"transparent",border:"2px solid "+settings.accent_color,color:settings.accent_color}}>★ Berikan Ulasan di Google</div>{settings.whatsapp_url && <div className="rounded-xl border px-3 py-3 text-center text-xs font-semibold">WhatsApp</div>}{settings.instagram_url && <div className="rounded-xl border px-3 py-3 text-center text-xs font-semibold">Instagram</div>}{settings.website_url && <div className="rounded-xl border px-3 py-3 text-center text-xs font-semibold">Website</div>}</div><p className="mt-7 text-center text-[9px] opacity-50">Powered by DiTapAja</p></div></div><p className="mx-auto mt-3 max-w-[330px] text-center text-xs leading-5 text-slate-400">Pratinjau visual ini mengikuti pengaturan editor. Buka Preview untuk melihat halaman sebenarnya.</p></aside>
      </div>}
    </div>
  </main>;
}
