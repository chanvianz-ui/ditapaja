"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, Loader2, Save, Smartphone, Monitor, ImagePlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { renderNfcPageDocument } from "@/lib/nfc-page-template";
import "./page-studio.css";

type Card = { id: string; card_name: string | null; public_code: string; active: boolean; location_id?: string | null };
type Settings = {
  id?: string; card_id: string; is_published: boolean; headline: string; description: string;
  theme: "ocean" | "midnight" | "rose" | "forest"; font_family: "Manrope" | "DM Sans" | "Arial" | "Georgia"; accent_color: string;
  button_style: "solid" | "outline"; logo_url: string | null; logo_size: number; logo_position: "left" | "center" | "right"; whatsapp_url: string; instagram_url: string; website_url: string;
};
const defaults = (cardId: string): Settings => ({
  card_id: cardId, is_published: false, headline: "Bagikan pengalaman kamu",
  description: "Terima kasih sudah berkunjung. Kami menghargai ulasan dan dukungan kamu.",
  theme: "ocean", font_family: "Manrope", accent_color: "#2878e8", button_style: "solid",
  logo_url: null, logo_size: 72, logo_position: "center",
  whatsapp_url: "", instagram_url: "", website_url: ""
});
const themes = [
  { id: "ocean", label: "Atelier", bg: "#171719", ink: "#f0eee8" },
  { id: "midnight", label: "Obsidian", bg: "#111316", ink: "#f0eee8" },
  { id: "rose", label: "Playform", bg: "#171a1c", ink: "#f0eee8" },
  { id: "forest", label: "Solace", bg: "#171d19", ink: "#f0eee8" }
] as const;

function escapePreviewHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[character] || character));
}

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
        .select("id,card_id,is_published,headline,description,theme,font_family,accent_color,button_style,logo_url,logo_size,logo_position,whatsapp_url,instagram_url,website_url")
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
      theme: settings.theme, font_family: settings.font_family, accent_color: settings.accent_color,
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

  const sections = [
    { id: "identity" as const, number: "01", title: "Identitas", detail: "Logo & kartu" },
    { id: "content" as const, number: "02", title: "Konten", detail: "Pesan pelanggan" },
    { id: "design" as const, number: "03", title: "Tampilan", detail: "Warna & tombol" },
    { id: "links" as const, number: "04", title: "Tautan", detail: "Kontak & publikasi" },
  ];
  const activeSection = sections.find(section => section.id === editorSection)!;
  const previewDocument = useMemo(() => renderNfcPageDocument({
    theme: settings.theme,
    font_family: settings.font_family,
    accent_color: settings.accent_color,
    button_style: settings.button_style,
    logo_url: settings.logo_url,
    logo_size: settings.logo_size,
    logo_position: settings.logo_position,
    business_name: businessName || "Bisnis Kami",
    branch_name: branchName,
    branch_address: branchAddress,
    headline: settings.headline,
    description: settings.description,
    whatsapp_url: settings.whatsapp_url,
    instagram_url: settings.instagram_url,
    website_url: settings.website_url,
    preview: true,
  }), [settings, businessName, branchName, branchAddress]);


  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#090a0c] text-[#bd8057]"><Loader2 className="animate-spin" /></div>;

  return <main className="ditapaja-studio-page">
    <div className="studio-shell">
      <header className="studio-topbar">
        <button type="button" onClick={() => router.push("/dashboard")} className="studio-back"><ArrowLeft size={17}/><span>Dashboard</span></button>
        <div className="studio-brand"><span className="studio-brand-mark">D</span><span><b>Page Studio</b><small>PERSONALISASI HALAMAN NFC</small></span></div>
        <div className="studio-top-actions">
          <span className={settings.is_published ? "studio-status is-live" : "studio-status"}><i/>{settings.is_published ? "Terbit" : "Draft"}</span>
          <button type="button" onClick={() => void save({preventDefault:()=>{}} as React.FormEvent)} disabled={saving || settingsLoading || !selectedCard?.active} className="studio-save-top"><Save size={15}/>{saving ? "Menyimpan" : "Simpan"}</button>
        </div>
      </header>

      <section className="studio-intro">
        <div><p className="studio-kicker">YOUR BRAND, YOUR PAGE</p><h1>Halaman yang terasa seperti brand kamu.</h1><p>Pilih komposisi visual yang berbeda, atur identitas brand, lalu lihat hasilnya langsung di preview.</p></div>
        <div className="studio-card-picker"><label htmlFor="studio-card">KARTU NFC</label><select id="studio-card" value={selectedCardId} onChange={e => setSelectedCardId(e.target.value)} className="studio-field">{cards.map(card => <option key={card.id} value={card.id}>{card.card_name || "Untitled Card"}{card.active ? "" : " — Nonaktif"}</option>)}</select></div>
      </section>

      {error && <div role="alert" className="studio-feedback is-error">{error}</div>}
      {notice && <div role="status" className="studio-feedback is-success">{notice}</div>}

      {cards.length === 0 ? <div className="studio-empty"><span>✦</span><h2>Belum ada kartu NFC</h2><p>Buat kartu terlebih dahulu dari dashboard untuk mulai mengatur halaman.</p><button type="button" onClick={() => router.push("/dashboard?view=cards")}>Buka Kartu NFC</button></div> : <>
        <div className={"studio-workspace "+(previewMode==="desktop"?"preview-desktop":"preview-mobile")}>
          <section className="studio-editor">
            <div className="studio-section-heading"><div><span>01 — 04</span><h2>Pengaturan halaman</h2></div><small>Perubahan terlihat langsung di preview</small></div>
            <nav className="studio-tabs" aria-label="Bagian pengaturan">
              {sections.map((section,index) => <button key={section.id} type="button" onClick={() => setEditorSection(section.id)} aria-current={editorSection === section.id ? "step" : undefined} aria-label={section.title + (editorSection === section.id ? ", sedang dibuka" : "")} className={editorSection === section.id ? "is-active" : ""}><span>{section.number}</span><b>{section.title}</b><i className={sections.findIndex(item=>item.id===editorSection)>index?"is-complete":""}/></button>)}
            </nav>
            <form onSubmit={save} className="studio-form">
              <div className="studio-form-heading"><div><span>EDIT SECTION {activeSection.number}</span><h2>{activeSection.title}</h2><p>{activeSection.detail}</p></div><span className="studio-step-count">{sections.findIndex(s=>s.id===editorSection)+1} / 4</span></div>
              <div className="studio-form-content">
                {editorSection === "identity" && <div className="space-y-6">
                  <div className="studio-upload-card">
                    <div className="studio-logo-preview">{settings.logo_url ? <img src={settings.logo_url} alt="Logo bisnis"/> : <ImagePlus size={28}/>}</div>
                    <div className="studio-upload-copy"><h3>Logo bisnis</h3><p>PNG, JPG, atau WebP. Maksimal 2 MB.</p><div className="studio-inline-actions"><label className="studio-primary-button">{logoUploading ? <Loader2 size={14} className="animate-spin"/> : <ImagePlus size={14}/>} {logoUploading ? "Mengunggah..." : "Pilih logo"}<input type="file" className="studio-file-input" accept="image/png,image/jpeg,image/webp" disabled={logoUploading} onChange={e=>{const file=e.target.files?.[0];void uploadLogo(file);e.currentTarget.value="";}}/></label>{settings.logo_url && <button type="button" className="studio-quiet-button" onClick={()=>update("logo_url",null)}>Hapus</button>}</div></div>
                  </div>
                  <div className="studio-field-grid">
                    <label>Ukuran logo<select value={settings.logo_size} onChange={e=>update("logo_size",Number(e.target.value))} className="studio-field"><option value={48}>Kecil</option><option value={64}>Sedang</option><option value={80}>Besar</option><option value={96}>Ekstra besar</option><option value={112}>Maksimal</option></select></label>
                    <label>Posisi logo<select value={settings.logo_position} onChange={e=>update("logo_position",e.target.value as Settings["logo_position"])} className="studio-field"><option value="left">Kiri</option><option value="center">Tengah</option><option value="right">Kanan</option></select></label>
                  </div>
                  <div className="studio-info"><b>Identitas otomatis</b><p>Nama bisnis, cabang, dan alamat diambil dari profil bisnis dan lokasi yang terhubung ke kartu NFC.</p></div>
                </div>}
                {editorSection === "content" && <div className="space-y-6">
                  <label className="studio-label">Judul utama<p>Kalimat pertama yang menyambut pelanggan.</p><input value={settings.headline} onChange={e=>update("headline",e.target.value)} maxLength={90} required className="studio-field" placeholder="Bagikan pengalaman kamu"/><small>{settings.headline.length}/90</small></label>
                  <label className="studio-label">Deskripsi<p>Tambahkan konteks singkat atau ucapan terima kasih.</p><textarea value={settings.description} onChange={e=>update("description",e.target.value)} maxLength={240} rows={5} className="studio-field" placeholder="Ceritakan sedikit tentang bisnis kamu..."/><small>{settings.description.length}/240</small></label>
                  <div className="studio-info"><b>Pesan pelanggan</b><p>{settings.headline || "Judul halaman kamu"} — {settings.description || "Deskripsi bisnis kamu akan tampil di sini."}</p></div>
                </div>}
                {editorSection === "design" && <div className="space-y-7">
                  <div className="studio-setting-group"><h3>Tipografi</h3><p>Pilih karakter huruf yang paling sesuai dengan brand kamu.</p><select value={settings.font_family} onChange={e=>update("font_family",e.target.value as Settings["font_family"])} className="studio-field"><option value="Manrope">Manrope — modern & tegas</option><option value="DM Sans">DM Sans — bersih & ramah</option><option value="Arial">Arial — sederhana</option><option value="Georgia">Georgia — editorial & elegan</option></select></div>
                  <div className="studio-setting-group"><h3>Template halaman</h3><p>Struktur halaman sudah disiapkan. Kamu hanya perlu memilih karakter visualnya.</p><div className="studio-template-grid">{themes.map(item=><button key={item.id} type="button" onClick={()=>update("theme",item.id)} className={"studio-template-card "+(settings.theme===item.id?"is-active":"")}><span className={"studio-template-art theme-"+item.id} style={{background:item.bg}}><i style={{background:settings.accent_color}}/><i/><i/></span><b>{item.label}</b><small>{settings.theme===item.id?"Sedang dipilih":"Pilih template"}</small></button>)}</div></div>
                  <div className="studio-field-grid">
                    <label>Warna aksen<span className="studio-color-field"><input type="color" className="studio-color-input" value={settings.accent_color} onChange={e=>update("accent_color",e.target.value)}/><b>{settings.accent_color.toUpperCase()}</b></span></label>
                    <label>Gaya tombol<select value={settings.button_style} onChange={e=>update("button_style",e.target.value as Settings["button_style"])} className="studio-field"><option value="solid">Solid — terisi</option><option value="outline">Outline — garis tepi</option></select></label>
                  </div>
                </div>}
                {editorSection === "links" && <div className="space-y-6">
                  <label className="studio-label">WhatsApp<p>Alamat tautan WhatsApp bisnis.</p><input type="url" value={settings.whatsapp_url} onChange={e=>update("whatsapp_url",e.target.value)} placeholder="https://wa.me/628..." className="studio-field"/></label>
                  <label className="studio-label">Instagram<p>Profil Instagram bisnis.</p><input type="url" value={settings.instagram_url} onChange={e=>update("instagram_url",e.target.value)} placeholder="https://instagram.com/namabisnis" className="studio-field"/></label>
                  <label className="studio-label">Website<p>Website resmi bisnis.</p><input type="url" value={settings.website_url} onChange={e=>update("website_url",e.target.value)} placeholder="https://bisnis.com" className="studio-field"/></label>
                  <label className="studio-publish-toggle"><input type="checkbox" checked={settings.is_published} onChange={e=>update("is_published",e.target.checked)} disabled={!selectedCard?.active}/><span><b>Terbitkan halaman kustom</b><small>Pelanggan akan melihat halaman yang kamu atur. Jika dimatikan, halaman NFC menggunakan tampilan standar DiTapAja.</small></span></label>
                  {!selectedCard?.active && <p className="studio-warning">Kartu sedang nonaktif. Aktifkan kartu terlebih dahulu untuk menerbitkan halaman kustom.</p>}
                </div>}
              </div>
              <footer className="studio-form-footer">
                <button type="button" className="studio-secondary-button" disabled={editorSection==="identity"} onClick={()=>setEditorSection(sections[Math.max(0,sections.findIndex(s=>s.id===editorSection)-1)].id)}>Sebelumnya</button>
                <div><button type="button" className="studio-next-button" onClick={()=>editorSection!=="links" && setEditorSection(sections[Math.min(3,sections.findIndex(s=>s.id===editorSection)+1)].id)} hidden={editorSection==="links"}>Berikutnya <span>→</span></button><button type="submit" className="studio-primary-button" disabled={saving||settingsLoading||!selectedCard||!selectedCard.active}><Save size={15}/>{saving?"Menyimpan...":settingsLoading?"Memuat...":"Simpan perubahan"}</button></div>
              </footer>
            </form>
          </section>

          <aside className="studio-canvas-panel">
            <div className="studio-canvas-heading"><div><span>LIVE PREVIEW</span><h2>Tampilan pelanggan</h2><p>Preview terisolasi dari style dashboard.</p></div><div className="studio-view-switch"><button type="button" onClick={()=>setPreviewMode("mobile")} aria-pressed={previewMode==="mobile"}><Smartphone size={15}/></button><button type="button" onClick={()=>setPreviewMode("desktop")} aria-pressed={previewMode==="desktop"}><Monitor size={15}/></button></div></div>
            <div className={"studio-canvas-stage "+(previewMode==="mobile"?"is-mobile":"is-desktop")}>
              <div className="studio-device-frame">
                <div className="studio-device-camera" aria-hidden="true"/>
                <iframe key={selectedCardId+"-"+previewMode} title="Preview halaman NFC" srcDoc={previewDocument} sandbox="" loading="eager" className="studio-preview-iframe"/>
              </div>
            </div>
            <div className="studio-canvas-meta"><span><i/>{settings.is_published?"Halaman diterbitkan":"Mode draft"}</span><button type="button" onClick={()=>void openPreview()} disabled={!selectedCard}>Buka preview asli <Eye size={14}/></button></div>
          </aside>
        </div>
      </>}
    </div>
  </main>;
}
