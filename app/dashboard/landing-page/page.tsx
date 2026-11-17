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
  const [editorSection, setEditorSection] = useState<"identity" | "content" | "design" | "links">("identity");
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

  const sections = [
    { id: "identity" as const, number: "01", title: "Identitas", detail: "Logo & kartu" },
    { id: "content" as const, number: "02", title: "Konten", detail: "Pesan pelanggan" },
    { id: "design" as const, number: "03", title: "Tampilan", detail: "Warna & tombol" },
    { id: "links" as const, number: "04", title: "Tautan", detail: "Kontak & publikasi" },
  ];
  const activeSection = sections.find(section => section.id === editorSection)!;

  return <main className="dt-page-studio-page min-h-screen px-4 py-5 text-slate-900 sm:px-7 sm:py-8">
    <div className="mx-auto max-w-[1440px]">
      <div className="dt-studio-nav mb-7 flex items-center justify-between gap-3">
        <button onClick={() => router.push("/dashboard")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm"><ArrowLeft size={16}/> Dashboard</button>
        <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-extrabold tracking-[.16em] text-blue-700"><span className="h-2 w-2 rounded-full bg-blue-500"/> PAGE STUDIO</div>
      </div>

      <header className="dt-studio-masthead mb-7 grid gap-6 rounded-[28px] p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div><p className="mb-3 text-[10px] font-extrabold tracking-[.22em] text-blue-300">CUSTOMER EXPERIENCE BUILDER</p>
          <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">Buat halaman NFC yang terasa seperti brand kamu.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">Atur identitas, pesan, warna, dan cara pelanggan menghubungi bisnis. Perubahan bisa dilihat langsung di panel preview.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:w-[260px]">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">Kartu dipilih</span><strong className="mt-2 block truncate text-sm text-white">{selectedCard?.card_name || "Belum dipilih"}</strong></div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">Status</span><strong className="mt-2 block text-sm text-white">{settings.is_published ? "Published" : "Draft"}</strong></div>
        </div>
      </header>

      {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div>}

      {cards.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">Belum ada kartu NFC. Buat kartu terlebih dahulu dari Dashboard.</div> : <>
        <div className="dt-studio-card-select mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-400">EDITING WORKSPACE</p><p className="mt-1 text-sm font-bold text-slate-800">Pilih kartu yang ingin kamu personalisasi</p></div>
          <select value={selectedCardId} onChange={e => setSelectedCardId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 sm:max-w-sm">{cards.map(card => <option key={card.id} value={card.id}>{card.card_name || "Untitled Card"} {card.active ? "" : "— Nonaktif"}</option>)}</select>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_410px]">
          <div className="min-w-0">
            <nav className="dt-studio-section-nav mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 sm:grid-cols-4">
              {sections.map((section,index) => <button key={section.id} type="button" onClick={() => setEditorSection(section.id)} aria-current={editorSection === section.id ? "step" : undefined} className={`dt-studio-step rounded-xl p-3 text-left transition ${editorSection === section.id ? "is-active" : ""}`}>
                <span className="flex items-center justify-between"><span className="text-[10px] font-extrabold tracking-wider">{section.number}</span>{editorSection === section.id && <span className="h-2 w-2 rounded-full bg-current"/>}</span>
                <strong className="mt-2 block text-sm">{section.title}</strong><span className="mt-0.5 block text-[10px] opacity-65">{section.detail}</span>
              </button>)}
            </nav>

            <form onSubmit={save} className="dt-studio-form overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
                <div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-blue-600">SECTION {activeSection.number}</p><h2 className="mt-1 text-xl font-extrabold text-slate-900">{activeSection.title}</h2><p className="mt-1 text-xs text-slate-500">{activeSection.detail}</p></div>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500">{sections.findIndex(s=>s.id===editorSection)+1} / 4</span>
              </div>

              <div className="dt-studio-form-body p-5 sm:p-7">
                {editorSection === "identity" && <div className="space-y-6">
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 sm:p-7">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                      <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-300">{settings.logo_url ? <img src={settings.logo_url} alt="Logo bisnis" className="h-full w-full object-contain p-2"/> : <ImagePlus size={34}/>}</div>
                      <div className="min-w-0"><h3 className="text-base font-bold text-slate-900">Logo bisnis</h3><p className="mt-2 max-w-md text-xs leading-6 text-slate-500">Gunakan logo yang mudah dikenali pelanggan. File PNG, JPG, atau WebP, maksimal 2 MB.</p>
                        <div className="mt-4 flex flex-wrap gap-2"><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white">{logoUploading ? <Loader2 size={14} className="animate-spin"/> : <ImagePlus size={14}/>} {logoUploading ? "Mengunggah..." : "Pilih file logo"}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={logoUploading} className="hidden" onChange={e=>{const file=e.target.files?.[0];void uploadLogo(file);e.currentTarget.value="";}}/></label>{settings.logo_url && <button type="button" onClick={()=>update("logo_url",null)} className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-600">Hapus logo</button>}</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-semibold text-slate-700">Ukuran logo<select value={settings.logo_size} onChange={e=>update("logo_size",Number(e.target.value))} className="dt-studio-input mt-2 w-full"><option value={48}>Kecil</option><option value={64}>Sedang</option><option value={80}>Besar</option><option value={96}>Ekstra besar</option><option value={112}>Maksimal</option></select></label>
                    <label className="block text-sm font-semibold text-slate-700">Posisi logo<select value={settings.logo_position} onChange={e=>update("logo_position",e.target.value as Settings["logo_position"])} className="dt-studio-input mt-2 w-full"><option value="left">Kiri</option><option value="center">Tengah</option><option value="right">Kanan</option></select></label>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-5"><p className="text-sm font-bold text-blue-900">Identitas otomatis</p><p className="mt-1 text-xs leading-6 text-blue-800/75">Nama bisnis, cabang, dan alamat diambil dari profil bisnis dan lokasi yang terhubung ke kartu NFC.</p></div>
                </div>}

                {editorSection === "content" && <div className="space-y-6">
                  <div><label className="block text-sm font-bold text-slate-800">Judul utama</label><p className="mt-1 text-xs text-slate-500">Kalimat pertama yang menyambut pelanggan.</p><input value={settings.headline} onChange={e=>update("headline",e.target.value)} maxLength={90} required className="dt-studio-input mt-3 w-full" placeholder="Bagikan pengalaman kamu"/><p className="mt-1 text-right text-[10px] text-slate-400">{settings.headline.length}/90</p></div>
                  <div><label className="block text-sm font-bold text-slate-800">Deskripsi</label><p className="mt-1 text-xs text-slate-500">Tambahkan konteks singkat atau ucapan terima kasih.</p><textarea value={settings.description} onChange={e=>update("description",e.target.value)} maxLength={240} rows={5} className="dt-studio-input mt-3 w-full resize-y" placeholder="Ceritakan sedikit tentang bisnis kamu..."/><p className="mt-1 text-right text-[10px] text-slate-400">{settings.description.length}/240</p></div>
                  <div className="rounded-2xl border border-slate-200 p-5"><p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">CONTOH PESAN</p><p className="mt-2 text-lg font-extrabold text-slate-800">{settings.headline || "Judul halaman kamu"}</p><p className="mt-2 text-sm leading-6 text-slate-500">{settings.description || "Deskripsi akan tampil di area ini."}</p></div>
                </div>}

                {editorSection === "design" && <div className="space-y-7">
                  <div><h3 className="text-sm font-bold text-slate-800">Pilih suasana warna</h3><p className="mt-1 text-xs text-slate-500">Mulai dari preset, lalu sesuaikan warna aksennya.</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{themes.map(item=><button key={item.id} type="button" onClick={()=>update("theme",item.id)} className={`dt-studio-theme rounded-2xl border p-3 text-left ${settings.theme===item.id?"is-active":""}`}><span className="mb-3 block h-14 rounded-xl border border-black/5" style={{background:item.bg}}><span className="ml-3 mt-3 block h-7 w-16 rounded-lg" style={{background:settings.accent_color}}/></span><strong className="text-xs">{item.label}</strong><span className="mt-1 block text-[10px] opacity-60">{settings.theme===item.id?"Sedang dipilih":"Pilih tema"}</span></button>)}</div></div>
                  <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-bold text-slate-700">Warna aksen<span className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 p-3"><input type="color" value={settings.accent_color} onChange={e=>update("accent_color",e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0"/><span className="text-sm font-semibold text-slate-600">{settings.accent_color.toUpperCase()}</span></span></label><label className="block text-sm font-bold text-slate-700">Gaya tombol<select value={settings.button_style} onChange={e=>update("button_style",e.target.value as Settings["button_style"])} className="dt-studio-input mt-2 w-full"><option value="solid">Solid — terisi</option><option value="outline">Outline — garis tepi</option></select></label></div>
                  <div className="rounded-2xl border border-slate-200 p-5"><p className="text-xs font-bold text-slate-700">Preview warna aksen</p><div className="mt-4 flex flex-wrap items-center gap-3"><span className="rounded-xl px-5 py-3 text-xs font-bold text-white" style={{background:settings.accent_color}}>Tombol solid</span><span className="rounded-xl border-2 px-5 py-3 text-xs font-bold" style={{borderColor:settings.accent_color,color:settings.accent_color}}>Tombol outline</span></div></div>
                </div>}

                {editorSection === "links" && <div className="space-y-6">
                  <div className="grid gap-4">
                    <label className="block text-sm font-bold text-slate-800">WhatsApp<input type="url" value={settings.whatsapp_url} onChange={e=>update("whatsapp_url",e.target.value)} placeholder="https://wa.me/628..." className="dt-studio-input mt-2 w-full"/></label>
                    <label className="block text-sm font-bold text-slate-800">Instagram<input type="url" value={settings.instagram_url} onChange={e=>update("instagram_url",e.target.value)} placeholder="https://instagram.com/namabisnis" className="dt-studio-input mt-2 w-full"/></label>
                    <label className="block text-sm font-bold text-slate-800">Website<input type="url" value={settings.website_url} onChange={e=>update("website_url",e.target.value)} placeholder="https://bisnis.com" className="dt-studio-input mt-2 w-full"/></label>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-5"><label className="flex items-start gap-3"><input type="checkbox" checked={settings.is_published} onChange={e=>update("is_published",e.target.checked)} disabled={!selectedCard?.active} className="mt-1 h-4 w-4 accent-blue-600"/><span><strong className="block text-sm text-slate-800">Terbitkan halaman kustom</strong><span className="mt-1 block text-xs leading-6 text-slate-500">Saat aktif, pelanggan akan melihat halaman yang kamu atur. Jika dimatikan, halaman NFC menggunakan tampilan standar DiTapAja.</span></span></label></div>
                  {!selectedCard?.active && <p className="rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">Kartu sedang nonaktif. Aktifkan kartu terlebih dahulu untuk menerbitkan halaman kustom.</p>}
                </div>}
              </div>

              <div className="dt-studio-form-footer flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <button type="button" disabled={editorSection==="identity"} onClick={()=>setEditorSection(sections[Math.max(0,sections.findIndex(s=>s.id===editorSection)-1)].id)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 disabled:opacity-40">Sebelumnya</button>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {editorSection!=="links" ? <button type="button" onClick={()=>setEditorSection(sections[Math.min(3,sections.findIndex(s=>s.id===editorSection)+1)].id)} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">Lanjut ke {sections[sections.findIndex(s=>s.id===editorSection)+1].title} →</button> : <button type="submit" disabled={saving||settingsLoading||!selectedCard||!selectedCard.active} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 disabled:opacity-50"><Save size={16}/>{saving?"Menyimpan...":settingsLoading?"Memuat...":"Simpan & Terapkan"}</button>}
                </div>
              </div>
              {editorSection!=="links" && <div className="px-5 pb-5 text-right sm:px-7"><button type="button" onClick={()=>void save({preventDefault:()=>{}} as React.FormEvent)} disabled={saving||settingsLoading||!selectedCard||!selectedCard.active} className="text-xs font-bold text-blue-600 hover:text-blue-800">Simpan perubahan sekarang</button></div>}
            </form>
          </div>

          <aside className="dt-studio-preview-col xl:sticky xl:top-5">
            <div className="mb-3 flex items-center justify-between gap-2"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-400">LIVE CANVAS</p><h2 className="mt-1 text-lg font-extrabold text-slate-900">Tampilan pelanggan</h2></div><div className="inline-flex rounded-xl border border-slate-200 bg-white p-1"><button type="button" onClick={()=>setPreviewMode("mobile")} aria-pressed={previewMode==="mobile"} className={`rounded-lg px-3 py-2 text-xs font-bold ${previewMode==="mobile"?"bg-slate-900 text-white":"text-slate-500"}`}><Smartphone size={14}/></button><button type="button" onClick={()=>setPreviewMode("desktop")} aria-pressed={previewMode==="desktop"} className={`rounded-lg px-3 py-2 text-xs font-bold ${previewMode==="desktop"?"bg-slate-900 text-white":"text-slate-500"}`}><Monitor size={14}/></button></div></div>
            <div className={previewMode==="mobile"?"dt-studio-preview-frame is-mobile":"dt-studio-preview-frame is-desktop"}>
              <div className="dt-studio-preview-screen" style={{background:theme.bg,color:theme.ink}}>
                <div className="mx-auto mb-7 h-1.5 w-14 rounded-full bg-slate-400/40"/>
                <div className="mb-6 flex" style={{justifyContent:settings.logo_position}}>{settings.logo_url?<img src={settings.logo_url} alt="Logo bisnis" className="rounded-2xl bg-white object-contain p-2 shadow-sm" style={{width:settings.logo_size,height:settings.logo_size}}/>:<div className="grid h-16 w-16 place-items-center rounded-2xl text-2xl" style={{background:settings.accent_color+"20",color:settings.accent_color}}>✦</div>}</div>
                <p className="text-center text-[10px] font-extrabold">{businessName||"Bisnis Kami"}</p>{branchName&&<p className="mt-2 text-center text-[10px] opacity-70">{branchName}</p>}{branchAddress&&<p className="mt-1 text-center text-[10px] opacity-60">{branchAddress}</p>}
                <p className="mt-2 text-center text-[9px] opacity-50">{selectedCard?.card_name||"Nama Kartu"}</p>
                <div className="my-7 text-center"><div className="mb-3 text-xl tracking-[.25em]" style={{color:settings.accent_color}}>★★★★★</div><h3 className="text-2xl font-extrabold leading-tight">{settings.headline||"Judul halaman"}</h3><p className="mt-3 text-sm leading-6 opacity-70">{settings.description||"Deskripsi bisnis kamu akan tampil di sini."}</p></div>
                <div className="space-y-3"><div className="rounded-2xl px-4 py-4 text-center text-sm font-extrabold" style={settings.button_style==="solid"?{background:settings.accent_color,color:"#fff"}:{background:"transparent",border:"2px solid "+settings.accent_color,color:settings.accent_color}}>★ Berikan Ulasan di Google</div>{settings.whatsapp_url&&<div className="rounded-2xl border border-current/15 px-4 py-3 text-center text-sm font-bold">WhatsApp</div>}{settings.instagram_url&&<div className="rounded-2xl border border-current/15 px-4 py-3 text-center text-sm font-bold">Instagram</div>}{settings.website_url&&<div className="rounded-2xl border border-current/15 px-4 py-3 text-center text-sm font-bold">Website</div>}</div>
                <p className="mt-9 text-center text-[9px] opacity-50">Powered by DiTapAja</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold text-slate-800">Tips desain</p><p className="mt-1 text-xs leading-5 text-slate-500">Gunakan logo yang jelas, judul singkat, dan warna kontras agar pelanggan langsung memahami tindakan yang perlu dilakukan.</p></div>
            <button type="button" onClick={()=>void openPreview()} disabled={!selectedCard} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700"><Eye size={16}/> Buka halaman preview asli</button>
          </aside>
        </div>
      </>}
    </div>
  </main>;
}
