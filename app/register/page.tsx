"use client";

import SiteHeader from "../components/site-header";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const nextPath = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Password minimal 8 karakter.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });

      if (error) throw error;

      if (data.user && data.session) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            full_name: name,
          });

        if (profileError) throw profileError;

        const { error: claimError } = await supabase.rpc("claim_my_ditapaja_orders");
        if (claimError && !claimError.message.includes("Email must be verified")) console.error("Order linking:", claimError.message);
        router.push(nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard");
        return;
      }

      setMessage(
        "Registrasi berhasil! Silakan cek email untuk verifikasi akun. Setelah verifikasi, masuk dengan email yang sama untuk melihat pesanan."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Registrasi gagal. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="dt-auth-page">
      <div className="dt-auth-shell">
        <section className="dt-auth-story dt-auth-story-register">
          <Link href="/" className="dt-auth-brand">DiTap<span>Aja.</span></Link>
          <div className="dt-auth-story-copy">
            <span className="dt-auth-eyebrow"><i /> START WITH A SIMPLE TAP</span>
            <h1>Semua aktivitas kartu NFC, <em>dalam satu tempat.</em></h1>
            <p>Buat akun gratis dan mulai kelola pengalaman pelanggan dengan cara yang lebih praktis.</p>
          </div>
          <div className="dt-auth-benefits">
            <div><b>01</b><span><strong>Kelola kartu NFC</strong><small>Atur tujuan review dan status kartu.</small></span></div>
            <div><b>02</b><span><strong>Pantau aktivitas</strong><small>Lihat tap dan interaksi pelanggan.</small></span></div>
            <div><b>03</b><span><strong>Kenali performa</strong><small>Gunakan insight untuk langkah berikutnya.</small></span></div>
          </div>
          <div className="dt-auth-story-foot">FREE DASHBOARD. NO COMPLICATED SETUP.</div>
        </section>
        <section className="dt-auth-form-side">
          <div className="dt-auth-form-card">
            <div className="dt-auth-mobile-brand"><Link href="/">DiTap<span>Aja.</span></Link></div>
            <div className="dt-auth-heading">
              <span className="dt-auth-kicker">MULAI GRATIS</span>
              <h2>Buat akun kamu</h2>
              <p>Hanya butuh beberapa detail untuk memulai.</p>
            </div>
            <form onSubmit={handleRegister} className="dt-auth-form">
              <div className="dt-auth-field">
                <label htmlFor="register-name">Nama lengkap</label>
                <input id="register-name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" />
              </div>
              <div className="dt-auth-field">
                <label htmlFor="register-email">Email</label>
                <input id="register-email" required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" />
              </div>
              <div className="dt-auth-field">
                <label htmlFor="register-password">Password <small>MIN. 8 KARAKTER</small></label>
                <div className="dt-auth-password">
                  <input id="register-password" required minLength={8} type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Buat password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "SEMBUNYIKAN" : "LIHAT"}</button>
                </div>
              </div>
              {message && <p role="status" className="dt-auth-message dt-auth-success">{message}</p>}
              <button disabled={loading} className="dt-auth-submit">{loading ? "Memproses..." : "Buat akun gratis"}<span>→</span></button>
            </form>
            <p className="dt-auth-switch">Sudah punya akun? <Link href={nextPath ? "/login?next=" + encodeURIComponent(nextPath) : "/login"}>Masuk</Link></p>
            <p className="dt-auth-terms">Dengan mendaftar, kamu menyetujui ketentuan layanan DiTapAja.</p>
          </div>
          <p className="dt-auth-legal">© {new Date().getFullYear()} DiTapAja. Dibuat untuk bisnis yang terus berkembang.</p>
        </section>
      </div>
      </main>
    </>
  );
}
