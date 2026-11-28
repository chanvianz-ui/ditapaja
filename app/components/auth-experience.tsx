"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setAuthStorageMode, supabase } from "../../lib/supabase";

type AuthMode = "login" | "register";

function getSafeNextPath() {
  if (typeof window === "undefined") return "/dashboard";
  const raw = new URLSearchParams(window.location.search).get("next");
  if (!raw) return "/dashboard";
  try {
    const target = new URL(raw, window.location.origin);
    return target.origin === window.location.origin ? target.pathname + target.search + target.hash : "/dashboard";
  } catch {
    return "/dashboard";
  }
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8"/><path d="M9.9 5.2A10.8 10.8 0 0112 5c5.2 0 9 4.8 9 7a9.8 9.8 0 01-3 4.2M6.2 6.2C4.2 7.6 3 9.7 3 12c0 2.2 3.8 7 9 7 1.1 0 2.1-.2 3-.6"/></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.3-7 9-7 9 7 9 7-3.3 7-9 7-9-7-9-7Z"/><circle cx="12" cy="12" r="2.5"/></svg>
  );
}

export default function AuthExperience({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [querySuffix, setQuerySuffix] = useState("");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => { setQuerySuffix(window.location.search); }, []);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await supabase.auth.signOut({ scope: "local" });
      setAuthStorageMode(rememberMe);
      if (identifier.includes("@")) {
        const { error } = await supabase.auth.signInWithPassword({ email: identifier.trim(), password });
        if (error) throw error;
      } else {
        const response = await fetch("/api/auth/username-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: identifier.trim(), password }),
        });
        const result = await response.json();
        if (!response.ok || !result.success || !result.session) throw new Error(result.error || "Username atau password salah.");
        const { error } = await supabase.auth.setSession(result.session);
        if (error) throw error;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const fullName = typeof userData.user.user_metadata?.full_name === "string" ? userData.user.user_metadata.full_name.trim() : "";
        if (fullName) {
          const { error } = await supabase.from("profiles").upsert({ id: userData.user.id, full_name: fullName });
          if (error) console.error("Profile sync error:", error);
        }
      }
      const { error: claimError } = await supabase.rpc("claim_my_ditapaja_orders");
      if (claimError && !claimError.message.includes("Email must be verified")) console.error("Order linking:", claimError.message);
      router.push(getSafeNextPath());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login gagal. Periksa email/username dan password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);
    if (!acceptedTerms) return setMessage("Kamu perlu menyetujui Syarat & Ketentuan dan Kebijakan Privasi.");
    if (password.length < 8) return setMessage("Password minimal 8 karakter.");
    setLoading(true);
    setAuthStorageMode(false);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim() } },
      });
      if (error) throw error;
      if (data.user && data.session) {
        const { error: profileError } = await supabase.from("profiles").upsert({ id: data.user.id, full_name: name.trim() });
        if (profileError) throw profileError;
        const { error: claimError } = await supabase.rpc("claim_my_ditapaja_orders");
        if (claimError && !claimError.message.includes("Email must be verified")) console.error("Order linking:", claimError.message);
        router.push(getSafeNextPath());
        return;
      }
      setSuccess(true);
      setMessage("Akun berhasil dibuat. Periksa email untuk verifikasi, lalu masuk menggunakan email yang sama.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Registrasi gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="dt-auth-v2">
      <div className="dt-auth-v2-frame">
        <header className="dt-auth-v2-topbar" aria-label="Akses akun">
          <span className="dt-auth-v2-secure" role="img" aria-label="Koneksi aman"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5 16 5v4.4c0 3.8-2.4 6.7-6 8.1-3.6-1.4-6-4.3-6-8.1V5l6-2.5Z"/><path d="m7.5 9.8 1.7 1.7 3.5-3.5"/></svg></span>
        </header>

        <section className="dt-auth-v2-panel" aria-label={mode === "login" ? "Masuk ke DiTapAja" : "Daftar DiTapAja"}>
          <div className="dt-auth-v2-intro">
            <p className="dt-auth-v2-eyebrow">{mode === "login" ? "AKSES AKUN" : "AKUN BARU"}</p>
            <h1>{mode === "login" ? "Selamat datang." : "Buat akun."}</h1>
            <p>{mode === "login" ? "Masuk untuk melanjutkan." : "Isi detail berikut untuk memulai."}</p>
          </div>

          <nav className="dt-auth-v2-tabs" aria-label="Pilih masuk atau daftar">
            <Link href={"/login" + querySuffix} className={mode === "login" ? "is-active" : ""} aria-current={mode === "login" ? "page" : undefined}>Masuk</Link>
            <Link href={"/register" + querySuffix} className={mode === "register" ? "is-active" : ""} aria-current={mode === "register" ? "page" : undefined}>Buat akun</Link>
          </nav>

          {mode === "login" ? (
            <form className="dt-auth-v2-form" onSubmit={handleLogin}>
              <label className="dt-auth-v2-field"><span>Email atau username</span><input required autoComplete="username" value={identifier} onChange={event => setIdentifier(event.target.value)} placeholder="Masukkan email atau username" /></label>
              <label className="dt-auth-v2-field"><span>Password</span><div className="dt-auth-v2-password"><input required type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} onKeyUp={event => setCapsLockOn(event.getModifierState("CapsLock"))} onBlur={() => setCapsLockOn(false)} placeholder="Masukkan password" /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}><EyeIcon hidden={showPassword}/></button></div></label>
              {capsLockOn && <p className="dt-auth-v2-caps" role="status">Caps Lock sedang aktif</p>}
              <div className="dt-auth-v2-options"><label className="dt-auth-v2-check"><input type="checkbox" checked={rememberMe} onChange={event => setRememberMe(event.target.checked)}/><span>Ingat saya selama 7 hari</span></label><Link href="/forgot-password">Lupa password?</Link></div>
              {message && <p className="dt-auth-v2-message" role="alert">{message}</p>}
              <button className="dt-auth-v2-submit" type="submit" disabled={loading}><span>{loading ? "Memproses..." : "Masuk ke akun"}</span><span aria-hidden="true">↗</span></button>
              <p className="dt-auth-v2-switch">Belum punya akun? <Link href={"/register" + querySuffix}>Daftar sekarang</Link></p>
            </form>
          ) : (
            <form className="dt-auth-v2-form" onSubmit={handleRegister}>
              <label className="dt-auth-v2-field"><span>Nama lengkap</span><input required autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Nama sesuai identitas akun" /></label>
              <label className="dt-auth-v2-field"><span>Email</span><input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="nama@email.com" /></label>
              <label className="dt-auth-v2-field"><span>Password</span><div className="dt-auth-v2-password"><input required minLength={8} type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Minimal 8 karakter" /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}><EyeIcon hidden={showPassword}/></button></div></label>
              <label className="dt-auth-v2-consent"><input type="checkbox" checked={acceptedTerms} onChange={event => setAcceptedTerms(event.target.checked)} required/><span>Saya menyetujui <Link href="/terms" target="_blank" rel="noopener noreferrer">Syarat &amp; Ketentuan</Link> dan <Link href="/privacy" target="_blank" rel="noopener noreferrer">Kebijakan Privasi</Link>.</span></label>
              {message && <p className={"dt-auth-v2-message" + (success ? " is-success" : "")} role={success ? "status" : "alert"}>{message}</p>}
              <button className="dt-auth-v2-submit" type="submit" disabled={loading}><span>{loading ? "Membuat akun..." : "Buat akun"}</span><span aria-hidden="true">↗</span></button>
              <p className="dt-auth-v2-switch">Sudah punya akun? <Link href={"/login" + querySuffix}>Masuk</Link></p>
            </form>
          )}
          </section>
      </div>
    </main>
  );
}
