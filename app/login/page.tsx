"use client";

import SiteHeader from "../components/site-header";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const nextPath = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
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
          : "Login gagal. Periksa email/username dan password."
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
            <h1>Masuk</h1>
            <p>Masuk untuk mengelola kartu dan melihat aktivitas bisnismu.</p>
          </div>
          <form onSubmit={handleLogin} className="dt-auth-form">
            <div className="dt-auth-field">
              <label htmlFor="login-identifier">Email atau Username</label>
              <input id="login-identifier" required type="text" autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Email atau username" />
            </div>
            <div className="dt-auth-field">
              <label htmlFor="login-password">Password</label>
              <div className="dt-auth-password">
                <input id="login-password" required type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "SEMBUNYIKAN" : "LIHAT"}</button>
              </div>
            </div>
            {message && <p role="alert" className="dt-auth-message dt-auth-error">{message}</p>}
            <button disabled={loading} className="dt-auth-submit">{loading ? "Memproses..." : "Masuk"}<span>→</span></button>
          </form>
          <p className="dt-auth-switch">Belum punya akun? <Link href={nextPath ? "/register?next=" + encodeURIComponent(nextPath) : "/register"}>Daftar gratis</Link></p>
          <Link href="/" className="dt-auth-back">← Kembali ke halaman utama</Link>
        </section>
      </main>
    </>
  );
}
