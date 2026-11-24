"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setAuthStorageMode, supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const nextPath = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
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
        const { error: sessionError } = await supabase.auth.setSession(result.session);
        if (sessionError) throw sessionError;
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
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              id: userData.user.id,
              full_name: fullName,
            });

          if (profileError) console.error("Profile sync error:", profileError);
        }
      }

      const { error: claimError } = await supabase.rpc("claim_my_ditapaja_orders");
      if (claimError && !claimError.message.includes("Email must be verified")) {
        console.error("Order linking:", claimError.message);
      }

      router.push(nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Login gagal. Periksa email/username dan password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="dt-access-page">
      <div className="dt-access-shell">
        <header className="dt-access-topbar">
          <Link href="/" className="dt-access-brand" aria-label="DiTapAja, kembali ke halaman utama">
            <span className="dt-access-brand-mark" aria-hidden="true"><i /><i /><i /></span>
            <span>DiTapAja<span className="dt-access-brand-period">.</span></span>
          </Link>
          <div className="dt-access-topbar-meta"><span>MEMBER AREA</span><span className="dt-access-topbar-line" /><span>01 — ACCESS</span></div>
          <Link href="/" className="dt-access-exit">Kembali ke situs <span aria-hidden="true">↗</span></Link>
        </header>

        <section className="dt-access-main" aria-labelledby="dt-access-title">
          <div className="dt-access-intro">
            <div className="dt-access-overline"><span>DITAPAJA / PRIVATE SPACE</span><span className="dt-access-overline-index">EST. FOR BUSINESS</span></div>
            <h1 id="dt-access-title">Semua dimulai<br />dari <em>satu tap.</em></h1>
            <p className="dt-access-description">Masuk ke ruang kendalimu. Kartu, aktivitas, dan insight bisnismu ada di satu tempat.</p>

            <div className="dt-access-art" aria-hidden="true">
              <div className="dt-access-art-label dt-access-art-label-top">FIELD / 01</div>
              <div className="dt-access-signal">
                <span className="dt-access-signal-ring ring-a" />
                <span className="dt-access-signal-ring ring-b" />
                <span className="dt-access-signal-ring ring-c" />
                <span className="dt-access-signal-core"><i /><i /><i /></span>
                <span className="dt-access-signal-cross cross-x" />
                <span className="dt-access-signal-cross cross-y" />
              </div>
              <div className="dt-access-art-label dt-access-art-label-bottom"><span>NFC SIGNAL</span><span>YOUR BUSINESS, IN SYNC</span></div>
              <span className="dt-access-art-coordinate">06°12' S&nbsp;&nbsp; 106°49' E</span>
            </div>

            <div className="dt-access-intro-foot"><span>ONE SPACE.</span><span>EVERY CONNECTION.</span><span>DITAPAJA.</span></div>
          </div>

          <div className="dt-access-form-wrap">
            <div className="dt-access-form-heading">
              <span className="dt-access-form-index">01 / SIGN IN</span>
              <h2>Masuk ke akun</h2>
              <p>Gunakan email atau username yang terdaftar.</p>
            </div>

            <form onSubmit={handleLogin} className="dt-access-form">
              <div className="dt-access-field">
                <label htmlFor="login-identifier">EMAIL / USERNAME</label>
                <input
                  id="login-identifier"
                  required
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Nama pengguna atau email"
                />
              </div>

              <div className="dt-access-field">
                <div className="dt-access-label-row"><label htmlFor="login-password">PASSWORD</label><span>PRIVATE CREDENTIAL</span></div>
                <div className="dt-access-password">
                  <input
                    id="login-password"
                    required
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              <label className="dt-access-remember" htmlFor="login-remember">
                <input id="login-remember" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span className="dt-access-checkbox" aria-hidden="true" />
                <span>Ingat saya selama 7 hari</span>
              </label>

              {message && <p role="alert" aria-live="polite" className="dt-access-error">{message}</p>}

              <button disabled={loading} className="dt-access-submit" type="submit">
                <span>{loading ? "Memeriksa akun..." : "Masuk ke ruang kendali"}</span>
                <span className="dt-access-submit-arrow" aria-hidden="true">{loading ? "···" : "↗"}</span>
              </button>
            </form>

            <div className="dt-access-register">Belum punya akun? <Link href={nextPath ? "/register?next=" + encodeURIComponent(nextPath) : "/register"}>Buat akun gratis <span aria-hidden="true">↗</span></Link></div>
            <div className="dt-access-security"><span className="dt-access-security-icon" aria-hidden="true">⌁</span><span>AREA PRIBADI <i /> AKSES TERLINDUNGI</span></div>
          </div>
        </section>

        <footer className="dt-access-footer"><span>© {new Date().getFullYear()} DITAPAJA</span><span>BUILT FOR EVERY CONNECTION</span><span>ACCESS / 001</span></footer>
      </div>
    </main>
  );
}
