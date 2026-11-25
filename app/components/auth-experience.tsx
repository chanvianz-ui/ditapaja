"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { setAuthStorageMode, supabase } from "../../lib/supabase";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

type AuthMode = "login" | "register";

function getSafeNextPath() {
  if (typeof window === "undefined") return "/dashboard";
  const raw = new URLSearchParams(window.location.search).get("next");
  if (!raw) return "/dashboard";
  try {
    const target = new URL(raw, window.location.origin);
    if (target.origin !== window.location.origin) return "/dashboard";
    return target.pathname + target.search + target.hash;
  } catch {
    return "/dashboard";
  }
}

export default function AuthExperience({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [querySuffix, setQuerySuffix] = useState("");
  useEffect(() => { setQuerySuffix(window.location.search); }, []);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordScore = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await supabase.auth.signOut({ scope: "local" });
      setAuthStorageMode(rememberMe);

      if (identifier.includes("@")) {
        const { error } = await supabase.auth.signInWithPassword({
          email: identifier.trim(),
          password,
        });
        if (error) throw error;
      } else {
        const response = await fetch("/api/auth/username-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: identifier.trim(), password }),
        });
        const result = await response.json();
        if (!response.ok || !result.success || !result.session) {
          throw new Error(result.error || "Username atau password salah.");
        }
        const { error } = await supabase.auth.setSession(result.session);
        if (error) throw error;
      }

      if (rememberMe) {
        localStorage.setItem("ditapaja_login_expires_at", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
      } else {
        localStorage.removeItem("ditapaja_login_expires_at");
      }

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const fullName =
          typeof userData.user.user_metadata?.full_name === "string"
            ? userData.user.user_metadata.full_name.trim()
            : "";
        if (fullName) {
          const { error } = await supabase.from("profiles").upsert({
            id: userData.user.id,
            full_name: fullName,
          });
          if (error) console.error("Profile sync error:", error);
        }
      }

      const { error: claimError } = await supabase.rpc("claim_my_ditapaja_orders");
      if (claimError && !claimError.message.includes("Email must be verified")) {
        console.error("Order linking:", claimError.message);
      }

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

    if (password.length < 8) {
      setMessage("Password minimal 8 karakter.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim() } },
      });
      if (error) throw error;

      if (data.user && data.session) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: name.trim(),
        });
        if (profileError) throw profileError;

        const { error: claimError } = await supabase.rpc("claim_my_ditapaja_orders");
        if (claimError && !claimError.message.includes("Email must be verified")) {
          console.error("Order linking:", claimError.message);
        }
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
    <main className={`dt-auth-hub ${poppins.className}`}>
      <div className="dt-auth-hub-orbit dt-auth-hub-orbit-one" aria-hidden="true" />
      <div className="dt-auth-hub-orbit dt-auth-hub-orbit-two" aria-hidden="true" />
      <header className="dt-auth-hub-topbar">
        <Link href="/" className="dt-auth-hub-brand" aria-label="DiTapAja, halaman utama">
          <span className="dt-brand-symbol" aria-hidden="true"><i /><i /><i /><b /></span>
          <span>DiTapAja<span>.</span></span>
        </Link>
        <Link href="/" className="dt-auth-hub-back"><span aria-hidden="true">←</span> Kembali ke website</Link>
      </header>

      <section className="dt-auth-hub-layout" aria-label="Autentikasi DiTapAja">
        <div className="dt-auth-hub-story">
          <div className="dt-auth-hub-eyebrow"><i /> DIGITAL BUSINESS, MADE SIMPLE</div>
          <h1>{mode === "login" ? <>Satu langkah<br /><em>lebih dekat.</em></> : <>Mulai kelola<br /><em>lebih cerdas.</em></>}</h1>
          <p>{mode === "login" ? "Masuk ke ruang kerja DiTapAja dan lanjutkan mengelola pengalaman review pelanggan." : "Buat akun DiTapAja untuk mengelola kartu NFC dan memahami interaksi pelanggan."}</p>
          <div className="dt-auth-hub-visual" aria-hidden="true">
            <div className="dt-auth-hub-visual-grid" />
            <div className="dt-auth-hub-visual-label">DITAPAJA / ACCESS</div>
            <div className="dt-auth-hub-card-art">
              <div className="dt-auth-hub-card-art-top"><span className="dt-auth-hub-card-mark"><i /><i /><i /></span><span>NFC / 01</span></div>
              <div className="dt-auth-hub-card-art-middle"><strong>DiTapAja<span>.</span></strong><small>ONE TAP. MORE REVIEWS.</small></div>
              <div className="dt-auth-hub-card-art-bottom"><span>SMART REVIEW CARD</span><b>)))</b></div>
            </div>
            <div className="dt-auth-hub-visual-index">01 <span>—</span> CONNECT</div>
            <div className="dt-auth-hub-visual-ring" />
          </div>
          <div className="dt-auth-hub-caption"><span>01 / SIMPLE ACCESS</span><span>BUILT FOR YOUR BUSINESS</span></div>
        </div>

        <div className="dt-auth-hub-panel">
          <div className="dt-auth-hub-panel-head">
            <span className="dt-auth-hub-panel-step">{mode === "login" ? "WELCOME BACK" : "GET STARTED"}</span>
            <span className="dt-auth-hub-panel-secure"><i /> SECURE ACCESS</span>
          </div>
          <div className="dt-auth-hub-heading">
            <h2>{mode === "login" ? "Masuk akun" : "Buat akun"}</h2>
            <p>{mode === "login" ? "Masukkan detail akun untuk melanjutkan." : "Isi detail berikut untuk memulai."}</p>
          </div>

          <nav className="dt-auth-hub-switch" aria-label="Pilih akses akun">
            <Link href={"/login" + querySuffix} className={mode === "login" ? "is-active" : ""} aria-current={mode === "login" ? "page" : undefined}>Masuk</Link>
            <Link href={"/register" + querySuffix} className={mode === "register" ? "is-active" : ""} aria-current={mode === "register" ? "page" : undefined}>Daftar</Link>
            <span className={mode === "register" ? "is-register" : ""} aria-hidden="true" />
          </nav>

          {mode === "login" ? (
            <form className="dt-auth-hub-form" onSubmit={handleLogin}>
              <label className="dt-auth-hub-field">
                <span>Email atau username</span>
                <input required autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="nama@email.com atau username" />
              </label>
              <label className="dt-auth-hub-field">
                <span>Password</span>
                <div className="dt-auth-hub-password">
                  <input required type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>{showPassword ? "Sembunyikan" : "Lihat"}</button>
                </div>
              </label>
              <div className="dt-auth-hub-form-meta">
                <label className="dt-auth-hub-remember">
                  <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                  <span>Ingat saya</span>
                </label>
                <span>7 HARI</span>
              </div>
              {message && <p className="dt-auth-hub-message" role="alert">{message}</p>}
              <button className="dt-auth-hub-submit" type="submit" disabled={loading}>
                <span>{loading ? "Memproses..." : "Masuk ke akun"}</span><b aria-hidden="true">↗</b>
              </button>
              <p className="dt-auth-hub-bottom">Belum punya akun? <Link href={"/register" + querySuffix}>Daftar sekarang <span aria-hidden="true">↗</span></Link></p>
            </form>
          ) : (
            <form className="dt-auth-hub-form" onSubmit={handleRegister}>
              <label className="dt-auth-hub-field">
                <span>Nama lengkap</span>
                <input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama kamu" />
              </label>
              <label className="dt-auth-hub-field">
                <span>Email</span>
                <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" />
              </label>
              <label className="dt-auth-hub-field">
                <span>Password <small>MIN. 8 KARAKTER</small></span>
                <div className="dt-auth-hub-password">
                  <input required minLength={8} type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Buat password" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>{showPassword ? "Sembunyikan" : "Lihat"}</button>
                </div>
              </label>
              {password.length > 0 && (
                <div className="dt-auth-hub-strength" aria-live="polite">
                  <div>{[1, 2, 3, 4].map((step) => <i key={step} className={passwordScore >= step ? "is-filled" : ""} />)}</div>
                  <span>{passwordScore <= 1 ? "Lemah" : passwordScore <= 2 ? "Cukup" : passwordScore === 3 ? "Kuat" : "Sangat kuat"}</span>
                </div>
              )}
              {message && <p className={"dt-auth-hub-message" + (success ? " is-success" : "")} role={success ? "status" : "alert"}>{message}</p>}
              <button className="dt-auth-hub-submit" type="submit" disabled={loading}>
                <span>{loading ? "Membuat akun..." : "Buat akun DiTapAja"}</span><b aria-hidden="true">↗</b>
              </button>
              <p className="dt-auth-hub-bottom">Sudah punya akun? <Link href={"/login" + querySuffix}>Masuk ke akun <span aria-hidden="true">↗</span></Link></p>
            </form>
          )}
          <div className="dt-auth-hub-foot"><span>DITAPAJA © 2026</span><span>YOUR BUSINESS, ONE TAP AWAY</span></div>
        </div>
      </section>
      <footer className="dt-auth-hub-page-foot"><span>DESIGNED FOR EVERYDAY BUSINESS</span><span>INDONESIA <i /> DIGITAL ACCESS</span></footer>
    </main>
  );
}
