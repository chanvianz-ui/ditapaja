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
        <section className="dt-auth-form-card">
          <div className="dt-auth-heading">
            <span className="dt-auth-kicker">AKUN DITAPAJA</span>
            <h1>Buat akun</h1>
            <p>Daftar untuk mulai mengelola kartu dan aktivitas bisnismu.</p>
          </div>
          <form onSubmit={handleRegister} className="dt-auth-form">
            <div className="dt-auth-field">
              <label htmlFor="register-name">Nama lengkap</label>
              <input id="register-name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" />
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
            {message && <p role="status" className={message.startsWith("Registrasi berhasil") ? "dt-auth-message dt-auth-success" : "dt-auth-message dt-auth-error"}>{message}</p>}
            <button disabled={loading} className="dt-auth-submit">{loading ? "Memproses..." : "Daftar gratis"}<span>→</span></button>
          </form>
          <p className="dt-auth-switch">Sudah punya akun? <Link href={nextPath ? "/login?next=" + encodeURIComponent(nextPath) : "/login"}>Masuk</Link></p>
          <Link href="/" className="dt-auth-back">← Kembali ke halaman utama</Link>
        </section>
      </main>
    </>
  );
}
