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
    <main className="dt-auth-hub">
      <div className="dt-auth-hub-glow" aria-hidden="true" />
      <section className="dt-auth-hub-card" aria-label="Autentikasi DiTapAja">
        <Link href="/" className="dt-auth-hub-brand" aria-label="DiTapAja, halaman utama">
          <span className="dt-brand-symbol" aria-hidden="true"><i /><i /><i /><b /></span>
          <span>DiTapAja<span>.</span></span>
        </Link>

        <div className="dt-auth-hub-heading">
          <p>AKUN DITAPAJA</p>
          <h1>{mode === "login" ? "Selamat datang kembali." : "Mulai dari sini."}</h1>
          <span>{mode === "login" ? "Masuk untuk melanjutkan ke dashboard." : "Buat akun dan mulai kelola kartu digitalmu."}</span>
        </div>

        <nav className="dt-auth-hub-switch" aria-label="Pilih akses akun">
          <Link href={"/login" + querySuffix} className={mode === "login" ? "is-active" : ""} aria-current={mode === "login" ? "page" : undefined}>Masuk</Link>
          <Link href={"/register" + (typeof window !== "undefined" ? window.location.search : "")} className={mode === "register" ? "is-active" : ""} aria-current={mode === "register" ? "page" : undefined}>Buat akun</Link>
          <span className={mode === "register" ? "is-register" : ""} aria-hidden="true" />
        </nav>

        {mode === "login" ? (
          <form className="dt-auth-hub-form" onSubmit={handleLogin}>
            <label className="dt-auth-hub-field">
              <span>Email atau username</span>
              <input required autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Masukkan email atau username" />
            </label>
            <label className="dt-auth-hub-field">
              <span>Password</span>
              <div className="dt-auth-hub-password">
                <input required type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>{showPassword ? "Sembunyikan" : "Tampilkan"}</button>
              </div>
            </label>
            <label className="dt-auth-hub-remember">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
              <span>Ingat saya selama 7 hari</span>
            </label>
            {message && <p className="dt-auth-hub-message" role="alert">{message}</p>}
            <button className="dt-auth-hub-submit" type="submit" disabled={loading}>
              <span>{loading ? "Memproses..." : "Masuk ke akun"}</span><span aria-hidden="true">↗</span>
            </button>
            <p className="dt-auth-hub-bottom">Belum punya akun? <Link href={"/register" + (typeof window !== "undefined" ? window.location.search : "")}>Daftar sekarang</Link></p>
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
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>{showPassword ? "Sembunyikan" : "Tampilkan"}</button>
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
              <span>{loading ? "Membuat akun..." : "Buat akun DiTapAja"}</span><span aria-hidden="true">↗</span>
            </button>
            <p className="dt-auth-hub-bottom">Sudah punya akun? <Link href={"/login" + (typeof window !== "undefined" ? window.location.search : "")}>Masuk</Link></p>
          </form>
        )}
        <div className="dt-auth-hub-foot"><span>DITAPAJA</span><span>SECURE ACCOUNT ACCESS</span></div>
      </section>
    </main>
  );
}
