"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { setAuthStorageMode, supabase } from "../../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setAuthStorageMode(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email reset gagal dikirim. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="dt-recovery-v2">
      <section className="dt-recovery-v2-card">
        <Link href="/login" className="dt-recovery-v2-brand"><span>d.</span> ditapaja</Link>
        <p className="dt-recovery-v2-kicker">ACCOUNT RECOVERY</p>
        <h1>Lupa password?</h1>
        <p className="dt-recovery-v2-copy">Masukkan email yang terhubung dengan akunmu. Jika terdaftar, kami akan mengirim tautan untuk membuat password baru.</p>
        {sent ? (
          <p className="dt-recovery-v2-success" role="status">Jika email terdaftar, tautan pemulihan akan dikirim. Periksa inbox dan folder spam.</p>
        ) : (
          <form onSubmit={submit}>
            <label>Email akun<input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="nama@email.com" /></label>
            {error && <p className="dt-recovery-v2-error" role="alert">{error}</p>}
            <button disabled={loading}>{loading ? "Mengirim tautan..." : "Kirim tautan reset"}</button>
          </form>
        )}
        <Link href="/login" className="dt-recovery-v2-back">← Kembali ke login</Link>
      </section>
    </main>
  );
}
