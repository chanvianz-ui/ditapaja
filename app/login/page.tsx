
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const nextPath = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

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

          if (profileError) {
            console.error("Profile sync error:", profileError);
          }
        }
      }

      const { error: claimError } = await supabase.rpc("claim_my_ditapaja_orders");
      if (claimError && !claimError.message.includes("Email must be verified")) console.error("Order linking:", claimError.message);
      router.push(nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Login gagal. Periksa email dan password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="dt-auth-page">
      <div className="dt-auth-shell">
        <section className="dt-auth-story">
          <Link href="/" className="dt-auth-brand">DiTap<span>Aja.</span></Link>
          <div className="dt-auth-story-copy">
            <span className="dt-auth-eyebrow"><i /> YOUR BUSINESS, ONE TAP AWAY</span>
            <h1>Bangun pengalaman review yang <em>lebih mudah.</em></h1>
            <p>Satu dashboard untuk mengelola kartu NFC, melihat aktivitas tap, dan memahami performa bisnis kamu.</p>
          </div>
          <div className="dt-auth-preview">
            <div className="dt-auth-preview-top"><span>DITAPAJA OVERVIEW</span><b><i /> LIVE WORKSPACE</b></div>
            <div className="dt-auth-preview-number">+<strong>24.8%</strong></div>
            <div className="dt-auth-preview-caption">Review activity this month</div>
            <div className="dt-auth-bars"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div>
            <div className="dt-auth-preview-foot"><span>Tap activity</span><strong>↗ Growing steadily</strong></div>
          </div>
          <div className="dt-auth-story-foot">SIMPLE SETUP. CLEAR INSIGHTS. BETTER CONNECTIONS.</div>
        </section>
        <section className="dt-auth-form-side">
          <div className="dt-auth-form-card">
            <div className="dt-auth-mobile-brand"><Link href="/">DiTap<span>Aja.</span></Link></div>
            <div className="dt-auth-heading">
              <span className="dt-auth-kicker">SELAMAT DATANG KEMBALI</span>
              <h2>Masuk ke akun</h2>
              <p>Lanjutkan mengelola kartu NFC dan performa bisnis kamu.</p>
            </div>
            <form onSubmit={handleLogin} className="dt-auth-form">
              <div className="dt-auth-field">
                <label htmlFor="login-email">Email</label>
                <input id="login-email" required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" />
              </div>
              <div className="dt-auth-field">
                <label htmlFor="login-password">Password</label>
                <div className="dt-auth-password">
                  <input id="login-password" required type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "SEMBUNYIKAN" : "LIHAT"}</button>
                </div>
              </div>
              {message && <p role="alert" className="dt-auth-message dt-auth-error">{message}</p>}
              <button disabled={loading} className="dt-auth-submit">{loading ? "Memproses..." : "Masuk ke dashboard"}<span>→</span></button>
            </form>
            <p className="dt-auth-switch">Belum punya akun? <Link href={nextPath ? "/register?next=" + encodeURIComponent(nextPath) : "/register"}>Daftar gratis</Link></p>
            <Link href="/" className="dt-auth-back">← Kembali ke halaman utama</Link>
          </div>
          <p className="dt-auth-legal">© {new Date().getFullYear()} DiTapAja. Dibuat untuk bisnis yang terus berkembang.</p>
        </section>
      </div>
    </main>
  );
}
