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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

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

    if (!acceptedTerms) {
      setMessage("Kamu perlu menyetujui Syarat & Ketentuan dan Kebijakan Privasi.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password minimal 8 karakter.");
      return;
    }

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
      <style jsx global>{`
        .dt-auth-simple { padding:clamp(24px,5vh,54px) 22px; }
        .dt-auth-simple-card {
          width:min(100%,448px); padding:clamp(30px,5vw,44px);
          border-color:rgba(169,207,224,.13); border-radius:22px;
          background:linear-gradient(155deg,rgba(15,38,63,.985),rgba(9,27,47,.99));
          box-shadow:0 26px 76px rgba(0,0,0,.26),inset 0 1px rgba(255,255,255,.035);
        }
        .dt-auth-simple-brand { gap:11px; font-size:18px; letter-spacing:-.045em; }
        .dt-auth-simple-mark { width:36px; height:36px; border-radius:10px; box-shadow:none; }
        .dt-auth-simple-heading { margin-top:36px; }
        .dt-auth-simple-heading h1 { font-size:clamp(25px,4vw,30px); letter-spacing:-.055em; line-height:1.18; }
        .dt-auth-simple-heading p { margin-top:10px; font-size:12px; color:#9bb0c2; }
        .dt-auth-simple-tabs {
          gap:4px; margin:28px 0 26px; padding:4px;
          border-color:rgba(169,207,224,.12); border-radius:10px; background:rgba(3,15,28,.52);
        }
        .dt-auth-simple-tabs a { min-height:42px; border-radius:7px; font-size:12px; transition:background .16s,color .16s; }
        .dt-auth-simple-tabs a.is-active {
          background:var(--auth-mint); color:#092338; box-shadow:0 2px 8px rgba(0,0,0,.12);
        }
        .dt-auth-simple-form { gap:19px; }
        .dt-auth-simple-field { gap:8px; }
        .dt-auth-simple-field>span { color:#d0dce5; font-size:11px; font-weight:650; letter-spacing:.005em; }
        .dt-auth-simple-field input {
          height:53px; padding-inline:15px; border-radius:10px;
          border-color:rgba(169,207,224,.16); background:rgba(3,15,28,.48);
          font-size:12px; letter-spacing:.005em;
        }
        .dt-auth-simple-field input:hover { border-color:rgba(168,240,213,.32); }
        .dt-auth-simple-field input:focus { border-color:var(--auth-mint); background:rgba(3,15,28,.72); box-shadow:0 0 0 3px rgba(168,240,213,.09); }
        .dt-auth-simple-password input { padding-right:52px; }
        .dt-auth-simple-password .dt-auth-simple-visibility { right:10px; width:34px; height:34px; }
        .dt-auth-simple-submit {
          min-height:53px; margin-top:2px; padding-inline:17px; border-radius:10px;
          background:var(--auth-mint); box-shadow:0 5px 16px rgba(75,197,167,.10);
          font-size:12px; letter-spacing:.005em;
        }
        .dt-auth-simple-submit:hover:not(:disabled) { background:#b8f5df; box-shadow:0 8px 20px rgba(75,197,167,.15); }
        .dt-auth-simple-submit span { width:28px; height:28px; border-color:rgba(8,34,56,.17); }
        .dt-auth-simple-switch { margin-top:5px; font-size:11px; }
        .dt-auth-simple-switch a { color:var(--auth-cyan); }
        .dt-auth-simple-footer { margin-top:25px; padding-top:15px; font-size:8px; letter-spacing:.16em; }
        .dt-auth-simple-message { padding:12px 13px; border-radius:9px; font-size:11px; }
        .dt-auth-simple-options { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:-5px; }
        .dt-auth-simple-remember { display:inline-flex; align-items:center; gap:8px; color:#9bb0c2; font-size:10px; cursor:pointer; user-select:none; }
        .dt-auth-simple-remember input,.dt-auth-simple-consent input { width:15px; height:15px; margin:0; accent-color:var(--auth-mint); flex:0 0 auto; }
        .dt-auth-simple-forgot { color:var(--auth-cyan); font-size:10px; font-weight:700; text-decoration:none; }
        .dt-auth-simple-forgot:hover,.dt-auth-simple-legal a:hover { text-decoration:underline; text-underline-offset:3px; }
        .dt-auth-simple-consent { display:flex; align-items:flex-start; gap:9px; color:#9bb0c2; font-size:10px; line-height:1.65; cursor:pointer; }
        .dt-auth-simple-consent input { margin-top:2px; }
        .dt-auth-simple-legal a { color:var(--auth-cyan); font-weight:700; text-decoration:none; }
        .dt-auth-simple-trust { display:flex; align-items:center; justify-content:center; gap:7px; margin:16px 0 0; color:#71899c; font-size:9px; }
        .dt-auth-simple-trust svg { width:13px; height:13px; color:var(--auth-mint); }
        .dt-auth-simple-card:focus-within { border-color:rgba(168,240,213,.2); box-shadow:0 26px 76px rgba(0,0,0,.28),inset 0 1px rgba(255,255,255,.035); }
        .dt-auth-simple a:focus-visible,.dt-auth-simple button:focus-visible { outline:2px solid var(--auth-cyan); outline-offset:3px; }
        @media(max-width:480px) {
          .dt-auth-simple { padding:20px 15px; }
          .dt-auth-simple-card { padding:27px 22px; border-radius:18px; }
          .dt-auth-simple-heading { margin-top:30px; }
          .dt-auth-simple-tabs { margin:24px 0; }
          .dt-auth-simple-form { gap:17px; }
          .dt-auth-simple-field input { height:51px; }
        }
        @media(max-height:720px) and (min-width:481px) {
          .dt-auth-simple { place-items:start center; }
          .dt-auth-simple-card { margin-block:12px; }
          .dt-auth-simple-heading { margin-top:24px; }
          .dt-auth-simple-tabs { margin:20px 0; }
          .dt-auth-simple-form { gap:14px; }
        }
        @media(prefers-reduced-motion:reduce) {
          .dt-auth-simple-card { animation:none!important; }
          .dt-auth-simple *,.dt-auth-simple *:before,.dt-auth-simple *:after { transition:none!important; }
        }
      `}</style>
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
            <div className="dt-auth-simple-options">
              <label className="dt-auth-simple-remember">
                <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                <span>Ingat saya selama 7 hari</span>
              </label>
              <Link className="dt-auth-simple-forgot" href="/forgot-password">Lupa password?</Link>
            </div>
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
            <label className="dt-auth-simple-consent">
              <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} required />
              <span>Saya menyetujui <Link className="dt-auth-simple-legal" href="/terms" target="_blank" rel="noopener noreferrer">Syarat &amp; Ketentuan</Link> dan <Link className="dt-auth-simple-legal" href="/privacy" target="_blank" rel="noopener noreferrer">Kebijakan Privasi</Link> DiTapAja.</span>
            </label>
            {message && <p className={"dt-auth-simple-message" + (success ? " is-success" : "")} role={success ? "status" : "alert"}>{message}</p>}
            <button className="dt-auth-simple-submit" type="submit" disabled={loading}>
              {loading ? "Membuat akun..." : "Buat akun"}
              <span aria-hidden="true">→</span>
            </button>
            <p className="dt-auth-simple-switch">Sudah punya akun? <Link href={"/login" + querySuffix}>Masuk</Link></p>
          </form>
        )}
        <p className="dt-auth-simple-trust"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 3 19 6v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg> Akses akun yang aman dan privat</p>
        <div className="dt-auth-simple-footer">DITAPAJA</div>
      </section>
    </main>
  );
}
