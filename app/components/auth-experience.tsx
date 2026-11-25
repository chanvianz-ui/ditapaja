"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Manrope } from "next/font/google";
import { setAuthStorageMode, supabase } from "../../lib/supabase";

const manrope = Manrope({
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
    <main className={`dt-auth-simple ${manrope.className}`}>
      <section className="dt-auth-simple-card" aria-label={mode === "login" ? "Masuk ke DiTapAja" : "Daftar DiTapAja"}>
        <Link href="/" className="dt-auth-simple-brand" aria-label="DiTapAja">
          <span className="dt-auth-simple-mark" aria-hidden="true">d<span>.</span></span>
          <span>ditapaja</span>
        </Link>

        <div className="dt-auth-simple-heading">
          <h1>{mode === "login" ? "Selamat datang kembali" : "Buat akun baru"}</h1>
          <p>{mode === "login" ? "Masuk untuk melanjutkan." : "Daftar untuk mulai menggunakan DiTapAja."}</p>
        </div>

        <nav className="dt-auth-simple-tabs" aria-label="Pilih masuk atau daftar">
          <Link href={"/login" + querySuffix} className={mode === "login" ? "is-active" : ""} aria-current={mode === "login" ? "page" : undefined}>Masuk</Link>
          <Link href={"/register" + querySuffix} className={mode === "register" ? "is-active" : ""} aria-current={mode === "register" ? "page" : undefined}>Daftar</Link>
        </nav>

        {mode === "login" ? (
          <form className="dt-auth-simple-form" onSubmit={handleLogin}>
            <label className="dt-auth-simple-field">
              <span>Email atau username</span>
              <input required autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Masukkan email atau username" />
            </label>
            <label className="dt-auth-simple-field">
              <span>Password</span>
              <div className="dt-auth-simple-password">
                <input required type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" />
                <button className="dt-auth-simple-visibility" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} title={showPassword ? "Sembunyikan password" : "Tampilkan password"}>
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8"/><path d="M9.9 5.2A10.8 10.8 0 0112 5c5.2 0 9 4.8 9 7a9.8 9.8 0 01-3 4.2M6.2 6.2C4.2 7.6 3 9.7 3 12c0 2.2 3.8 7 9 7 1.1 0 2.1-.2 3-.6"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.3-7 9-7 9 7 9 7-3.3 7-9 7-9-7-9-7Z"/><circle cx="12" cy="12" r="2.5"/></svg>
                  )}
                </button>
              </div>
            </label>
            {message && <p className="dt-auth-simple-message" role="alert">{message}</p>}
            <button className="dt-auth-simple-submit" type="submit" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
              <span aria-hidden="true">→</span>
            </button>
            <p className="dt-auth-simple-switch">Belum punya akun? <Link href={"/register" + querySuffix}>Daftar</Link></p>
          </form>
        ) : (
          <form className="dt-auth-simple-form" onSubmit={handleRegister}>
            <label className="dt-auth-simple-field">
              <span>Nama lengkap</span>
              <input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Masukkan nama lengkap" />
            </label>
            <label className="dt-auth-simple-field">
              <span>Email</span>
              <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" />
            </label>
            <label className="dt-auth-simple-field">
              <span>Password</span>
              <div className="dt-auth-simple-password">
                <input required minLength={8} type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimal 8 karakter" />
                <button className="dt-auth-simple-visibility" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} title={showPassword ? "Sembunyikan password" : "Tampilkan password"}>
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8"/><path d="M9.9 5.2A10.8 10.8 0 0112 5c5.2 0 9 4.8 9 7a9.8 9.8 0 01-3 4.2M6.2 6.2C4.2 7.6 3 9.7 3 12c0 2.2 3.8 7 9 7 1.1 0 2.1-.2 3-.6"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.3-7 9-7 9 7 9 7-3.3 7-9 7-9-7-9-7Z"/><circle cx="12" cy="12" r="2.5"/></svg>
                  )}
                </button>
              </div>
            </label>
            {message && <p className={"dt-auth-simple-message" + (success ? " is-success" : "")} role={success ? "status" : "alert"}>{message}</p>}
            <button className="dt-auth-simple-submit" type="submit" disabled={loading}>
              {loading ? "Membuat akun..." : "Buat akun"}
              <span aria-hidden="true">→</span>
            </button>
            <p className="dt-auth-simple-switch">Sudah punya akun? <Link href={"/login" + querySuffix}>Masuk</Link></p>
          </form>
        )}
        <div className="dt-auth-simple-footer">DITAPAJA</div>
      </section>
    </main>
  );
}
