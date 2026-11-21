"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminMenu from "@/app/admin/admin-menu";
import {
  ArrowLeft, ArrowRight, UserPlus, UserRound, Mail, LockKeyhole,
  Eye, EyeOff, Copy, Check, ShieldCheck, CheckCircle2, AlertCircle,
  Loader2, LayoutDashboard, CreditCard, Users, KeyRound, LogOut,
  Sparkles, CircleUserRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AddNewUserPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [accountType, setAccountType] = useState<"email" | "username">("email");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!fullName.trim() || !password || (accountType === "email" && !email.trim()) || (accountType === "username" && !username.trim())) {
      setError("Lengkapi semua kolom yang diperlukan.");
      return;
    }
    if (password.length < 8 || password.length > 72) {
      setError("Password harus terdiri dari 8 sampai 72 karakter.");
      return;
    }
    setLoading(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        router.replace("/login");
        return;
      }
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          accountType,
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal membuat akun pengguna.");
      setCreated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat membuat akun.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyCredentials() {
    const credentials = [
      "DiTapAja - Informasi Login",
      `Nama: ${fullName}`,
      accountType === "username" ? `Username: ${username.trim().toLowerCase()}` : `Email: ${email.trim().toLowerCase()}`,
      `Password sementara: ${password}`,
      "",
      "Silakan login dan ganti password setelah masuk.",
      "Login: https://ditapaja.ditapaja.workers.dev/login",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(credentials);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Gagal menyalin. Silakan salin informasi secara manual.");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const credentialLabel = accountType === "username" ? "Username" : "Email";
  const credentialValue = accountType === "username" ? username.trim().toLowerCase() : email.trim().toLowerCase();

  return (
    <main className="dt-admin-shell min-h-screen bg-[#090a0c] text-[#efede7]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col bg-[#202720] px-5 py-6 text-white lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d8e5d2] text-[#26372a]"><LayoutDashboard size={20}/></div>
          <div><p className="text-[15px] font-bold tracking-tight">DiTapAja</p><p className="mt-0.5 text-[10px] font-medium uppercase tracking-[.18em] text-[#9eaa9d]">Control center</p></div>
        </div>
        <div className="mt-12">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#829083]">Workspace</p>
          <button onClick={() => router.push("/admin")} className="mt-4 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm text-[#b7c1b5] transition hover:bg-white/5 hover:text-white"><LayoutDashboard size={17}/> Overview</button>
          <button onClick={() => router.push("/admin/orders")} className="mt-1.5 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm text-[#b7c1b5] transition hover:bg-white/5 hover:text-white"><CreditCard size={17}/> Order management</button>
          <div className="mt-1.5 flex items-center gap-3 rounded-xl bg-[#354337] px-3.5 py-3 text-sm font-semibold text-[#e5efe2]"><Users size={17}/> User management <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c3d9b9]"/></div>
          <button onClick={() => router.push("/admin/pins")} className="mt-1.5 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm text-[#b7c1b5] transition hover:bg-white/5 hover:text-white"><KeyRound size={17}/> Activation PINs</button>
        </div>
        <div className="mt-auto">
          <div className="rounded-2xl border border-white/10 bg-white/[.045] p-4"><div className="flex items-center gap-2 text-[#d5e3d0]"><ShieldCheck size={16}/><span className="text-xs font-semibold">Superadmin access</span></div><p className="mt-2 text-[11px] leading-5 text-[#9eaa9d]">Akses penuh untuk mengelola platform DiTapAja.</p></div>
          <button onClick={handleLogout} className="mt-4 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-[#b7c1b5] transition hover:bg-rose-500/10 hover:text-rose-200"><LogOut size={17}/> Sign out</button>
        </div>
      </aside>

      <section className="min-h-screen lg:ml-[264px]">
        <header className="sticky top-0 z-20 border-b border-[#e7e9e3] bg-[#f8f9f6]/90 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-4 sm:px-8 lg:px-10">
            <div><p className="text-[11px] font-medium text-[#899187]">DiTapAja <span className="mx-1.5 text-[#c0c6bd]">/</span> User management</p><h1 className="mt-1 text-base font-semibold tracking-tight sm:text-lg">{created ? "Account created" : "Tambah pengguna"}</h1></div>
            <div className="flex items-center gap-2"><span className="hidden items-center gap-2 rounded-full border border-[#dce5d7] bg-[#edf3e9] px-3 py-2 text-[10px] font-semibold text-[#526b4e] sm:inline-flex"><ShieldCheck size={13}/> Superadmin</span><div className="lg:hidden"><AdminMenu/></div></div>
          </div>
        </header>

        <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-8 sm:py-10 lg:px-10">
          <button onClick={() => router.push("/admin/users")} className="mb-7 inline-flex items-center gap-2 text-[11px] font-medium text-[#879184] transition hover:text-[#526b4e]"><ArrowLeft size={14}/> Kembali ke daftar pengguna</button>

          {created ? (
            <div className="mx-auto grid max-w-[920px] gap-5 lg:grid-cols-[.9fr_1.1fr]">
              <section className="flex flex-col justify-between rounded-[28px] bg-[#29382b] p-7 text-white sm:p-9">
                <div><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d8e5d2] text-[#29382b]"><CheckCircle2 size={27}/></div><p className="mt-8 text-[10px] font-bold uppercase tracking-[.2em] text-[#b7c9b0]">Account ready</p><h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-.04em]">Pengguna berhasil dibuat.</h2><p className="mt-3 text-sm leading-6 text-[#c0cbbd]">Akun sudah tersimpan. Salin kredensial dan sampaikan kepada pengguna melalui jalur yang aman.</p></div>
                <div className="mt-10 rounded-2xl border border-white/10 bg-white/[.06] p-4"><div className="flex items-center gap-2 text-[#d8e5d2]"><ShieldCheck size={16}/><span className="text-xs font-semibold">Catatan keamanan</span></div><p className="mt-2 text-xs leading-5 text-[#b7c3b4]">Jangan bagikan password di ruang publik. Pengguna sebaiknya mengganti password setelah login.</p></div>
              </section>
              <section className="rounded-[28px] border border-[#e2e7df] bg-white p-6 sm:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8b9887]">Login credentials</p><h3 className="mt-2 text-xl font-semibold tracking-tight">Informasi akun</h3>
                <div className="mt-7 space-y-5">
                  <div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#9aa296]">Nama pengguna</p><p className="mt-1.5 text-sm font-semibold text-[#394338]">{fullName}</p></div>
                  <div className="border-t border-[#edf0eb] pt-5"><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#9aa296]">{credentialLabel}</p><p className="mt-1.5 break-all text-sm font-semibold text-[#394338]">{credentialValue}</p></div>
                  <div className="border-t border-[#edf0eb] pt-5"><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#9aa296]">Password sementara</p><p className="mt-1.5 break-all font-mono text-sm font-semibold text-[#394338]">{password}</p></div>
                </div>
                <div className="mt-7 flex items-start gap-3 rounded-xl border border-[#eee2c9] bg-[#faf6ed] p-4 text-xs leading-5 text-[#8b7044]"><AlertCircle size={16} className="mt-0.5 shrink-0"/>Simpan password ini sekarang. Demi keamanan, jangan mengirimkannya melalui kanal yang tidak tepercaya.</div>
                {error && <p className="mt-4 text-xs text-[#a3453a]">{error}</p>}
                <button onClick={handleCopyCredentials} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#29382b] text-sm font-semibold text-white transition hover:bg-[#3a4b3b]">{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? "Credentials tersalin" : "Salin kredensial"}</button>
                <button onClick={() => router.push("/admin/users")} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#e1e5dc] text-sm font-semibold text-[#596455] transition hover:bg-[#f8f9f6]">Kembali ke pengguna <ArrowRight size={15}/></button>
              </section>
            </div>
          ) : (
            <>
              <div className="mb-8 max-w-2xl"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#dce5d7] bg-[#edf3e9] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-[#526b4e]"><UserPlus size={12}/> Account provisioning</div><h2 className="text-[30px] font-semibold leading-tight tracking-[-.045em] sm:text-[40px]">Buat akun baru.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#7d877b]">Atur identitas dan akses login pengguna dari satu tempat. Pilih email atau username tanpa email.</p></div>

              <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <form onSubmit={handleCreateUser} className="overflow-hidden rounded-[26px] border border-[#e2e7df] bg-white">
                  <div className="border-b border-[#edf0eb] px-6 py-6 sm:px-8"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf3e9] text-[#668060]"><CircleUserRound size={19}/></div><div><h3 className="text-sm font-semibold text-[#394338]">Informasi akun</h3><p className="mt-1 text-xs text-[#929b90]">Kolom bertanda wajib harus diisi.</p></div></div></div>
                  <div className="space-y-6 px-6 py-7 sm:px-8">
                    <div><label className="mb-3 block text-xs font-semibold text-[#596455]">Metode login</label><div className="grid gap-3 sm:grid-cols-2">
                      <button type="button" onClick={() => setAccountType("email")} disabled={loading} className={accountType === "email" ? "rounded-2xl border border-[#a9bda1] bg-[#f1f5ee] p-4 text-left ring-1 ring-[#dce7d6]" : "rounded-2xl border border-[#e6e9e3] bg-white p-4 text-left transition hover:bg-[#fafbf9]"}><span className={accountType === "email" ? "mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#dfeadb] text-[#526b4e]" : "mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f4f0] text-[#879184]"}><Mail size={17}/></span><span className="block text-sm font-semibold text-[#394338]">Email account</span><span className="mt-1 block text-xs text-[#929b90]">Login menggunakan alamat email</span></button>
                      <button type="button" onClick={() => setAccountType("username")} disabled={loading} className={accountType === "username" ? "rounded-2xl border border-[#a9bda1] bg-[#f1f5ee] p-4 text-left ring-1 ring-[#dce7d6]" : "rounded-2xl border border-[#e6e9e3] bg-white p-4 text-left transition hover:bg-[#fafbf9]"}><span className={accountType === "username" ? "mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#dfeadb] text-[#526b4e]" : "mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f4f0] text-[#879184]"}><UserRound size={17}/></span><span className="block text-sm font-semibold text-[#394338]">Username account</span><span className="mt-1 block text-xs text-[#929b90]">Tanpa alamat email</span></button>
                    </div></div>

                    <div><label htmlFor="fullName" className="mb-2 block text-xs font-semibold text-[#596455]">Nama lengkap</label><div className="relative"><UserRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa296]"/><input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Contoh: Nama pengguna" maxLength={100} required disabled={loading} className="h-12 w-full rounded-xl border border-[#e3e8e0] bg-[#fafbf9] pl-11 pr-4 text-sm text-[#394338] outline-none transition placeholder:text-[#a1a99e] focus:border-[#aebfa7] focus:bg-white focus:ring-4 focus:ring-[#edf3e9] disabled:opacity-60"/></div></div>

                    {accountType === "username" ? <div><label htmlFor="username" className="mb-2 block text-xs font-semibold text-[#596455]">Username</label><div className="relative"><UserRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa296]"/><input id="username" type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} placeholder="contoh: admin" minLength={3} maxLength={24} pattern="[a-z0-9][a-z0-9._-]{2,23}" required disabled={loading} autoCapitalize="none" autoComplete="off" className="h-12 w-full rounded-xl border border-[#e3e8e0] bg-[#fafbf9] pl-11 pr-4 text-sm text-[#394338] outline-none transition placeholder:text-[#a1a99e] focus:border-[#aebfa7] focus:bg-white focus:ring-4 focus:ring-[#edf3e9] disabled:opacity-60"/></div><p className="mt-2 text-[11px] text-[#929b90]">3–24 karakter: huruf kecil, angka, titik, _ atau -.</p></div> : <div><label htmlFor="email" className="mb-2 block text-xs font-semibold text-[#596455]">Alamat email</label><div className="relative"><Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa296]"/><input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@email.com" required disabled={loading} className="h-12 w-full rounded-xl border border-[#e3e8e0] bg-[#fafbf9] pl-11 pr-4 text-sm text-[#394338] outline-none transition placeholder:text-[#a1a99e] focus:border-[#aebfa7] focus:bg-white focus:ring-4 focus:ring-[#edf3e9] disabled:opacity-60"/></div></div>}

                    <div><label htmlFor="password" className="mb-2 block text-xs font-semibold text-[#596455]">Password sementara</label><div className="relative"><LockKeyhole size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa296]"/><input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimal 8 karakter" minLength={8} maxLength={72} required disabled={loading} autoComplete="new-password" className="h-12 w-full rounded-xl border border-[#e3e8e0] bg-[#fafbf9] pl-11 pr-12 text-sm text-[#394338] outline-none transition placeholder:text-[#a1a99e] focus:border-[#aebfa7] focus:bg-white focus:ring-4 focus:ring-[#edf3e9] disabled:opacity-60"/><button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#929b90] hover:text-[#526b4e]">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div><p className="mt-2 text-[11px] text-[#929b90]">Gunakan 8–72 karakter. Password ini ditentukan oleh Super Admin.</p></div>

                    {error && <div className="flex items-start gap-3 rounded-xl border border-[#f0c9c4] bg-[#fff4f1] p-4 text-xs leading-5 text-[#a3453a]"><AlertCircle size={16} className="mt-0.5 shrink-0"/><p>{error}</p></div>}
                  </div>
                  <div className="flex flex-col-reverse gap-3 border-t border-[#edf0eb] bg-[#fafbf9] px-6 py-5 sm:flex-row sm:justify-end sm:px-8"><button type="button" onClick={() => router.push("/admin/users")} disabled={loading} className="h-11 rounded-xl border border-[#e1e5dc] bg-white px-5 text-xs font-semibold text-[#647060] transition hover:bg-[#f5f7f2] disabled:opacity-50">Batal</button><button type="submit" disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#29382b] px-6 text-xs font-semibold text-white transition hover:bg-[#3a4b3b] disabled:cursor-not-allowed disabled:opacity-50">{loading ? <><Loader2 size={15} className="animate-spin"/> Membuat akun...</> : <><UserPlus size={15}/> Buat akun pengguna <ArrowRight size={14}/></>}</button></div>
                </form>

                <aside className="space-y-4">
                  <section className="rounded-[24px] bg-[#29382b] p-6 text-white"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d8e5d2] text-[#29382b]"><Sparkles size={18}/></div><p className="mt-6 text-[10px] font-bold uppercase tracking-[.18em] text-[#b7c9b0]">Provisioning guide</p><h3 className="mt-2 text-lg font-semibold tracking-tight">Akses yang tepat, sejak awal.</h3><p className="mt-2 text-xs leading-5 text-[#c0cbbd]">Buat akun sesuai cara pengguna akan masuk ke dashboard DiTapAja.</p><div className="mt-6 space-y-4"><div className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-[#d8e5d2]">01</span><div><p className="text-xs font-semibold">Pilih metode login</p><p className="mt-1 text-[11px] leading-5 text-[#aebbaa]">Email untuk akun berbasis email, username untuk akun tanpa email.</p></div></div><div className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-[#d8e5d2]">02</span><div><p className="text-xs font-semibold">Tentukan password</p><p className="mt-1 text-[11px] leading-5 text-[#aebbaa]">Gunakan password sementara yang aman dan tidak mudah ditebak.</p></div></div><div className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-[#d8e5d2]">03</span><div><p className="text-xs font-semibold">Bagikan dengan aman</p><p className="mt-1 text-[11px] leading-5 text-[#aebbaa]">Setelah akun dibuat, salin detail login untuk disampaikan secara pribadi.</p></div></div></div></section>
                  <section className="rounded-[22px] border border-[#e2e7df] bg-white p-5"><div className="flex items-center gap-2 text-[#526b4e]"><ShieldCheck size={16}/><p className="text-xs font-semibold">Akses Superadmin</p></div><p className="mt-2 text-[11px] leading-5 text-[#879184]">Akun dibuat melalui panel admin. Pastikan identitas dan kredensial sudah benar sebelum menekan tombol buat akun.</p></section>
                </aside>
              </div>
            </>
          )}
          <footer className="mt-10 flex flex-col gap-2 border-t border-[#e2e7df] py-6 text-[10px] text-[#9aa296] sm:flex-row sm:items-center sm:justify-between"><span>DiTapAja · Superadmin Control Center</span><span>Tap. Review. Grow.</span></footer>
        </div>
      </section>
    </main>
  );
}
