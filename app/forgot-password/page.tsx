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
    <main className="dt-recovery">
      <section className="dt-recovery-card">
        <Link href="/login" className="dt-recovery-brand"><span>d.</span> ditapaja</Link>
        <p className="dt-recovery-kicker">ACCOUNT RECOVERY</p>
        <h1>Lupa password?</h1>
        <p className="dt-recovery-copy">Masukkan email akunmu. Kami akan mengirim tautan untuk membuat password baru.</p>
        {sent ? <p className="dt-recovery-success" role="status">Jika email terdaftar, tautan pemulihan akan dikirim. Periksa inbox dan folder spam.</p> : (
          <form onSubmit={submit}>
            <label>Email akun<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@email.com" /></label>
            {error && <p className="dt-recovery-error" role="alert">{error}</p>}
            <button disabled={loading}>{loading ? "Mengirim..." : "Kirim tautan reset"}</button>
          </form>
        )}
        <Link href="/login" className="dt-recovery-back">← Kembali ke login</Link>
      </section>
      <style jsx>{`
        .dt-recovery{font-family:"Manrope",ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:grid;place-items:center;min-height:100svh;padding:24px 16px;background:#071426;color:#edf7fb}
        .dt-recovery-card{width:min(100%,440px);padding:clamp(26px,5vw,42px);border:1px solid rgba(170,205,222,.15);border-radius:20px;background:#0d2038;box-shadow:0 24px 70px rgba(0,0,0,.25)}
        .dt-recovery-brand{display:flex;align-items:center;gap:10px;color:#edf7fb;text-decoration:none;font-size:17px;font-weight:800}
        .dt-recovery-brand span{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;background:#a8f0d5;color:#092238}
        .dt-recovery-kicker{margin:38px 0 9px;color:#a8f0d5;font-size:9px;font-weight:800;letter-spacing:.17em}
        h1{margin:0;font-size:30px;letter-spacing:-.06em}.dt-recovery-copy{color:#9bb0c2;font-size:12px;line-height:1.8}
        form{display:grid;gap:16px;margin-top:26px}label{display:grid;gap:8px;color:#d0dce5;font-size:11px;font-weight:700}
        input{height:51px;padding:0 14px;border:1px solid rgba(169,207,224,.18);border-radius:9px;background:#071426;color:#edf7fb;font:500 12px Arial,sans-serif}
        button{height:52px;border:0;border-radius:9px;background:#a8f0d5;color:#092238;font-weight:800;cursor:pointer}button:disabled{opacity:.6}
        .dt-recovery-error,.dt-recovery-success{padding:12px;border:1px solid rgba(255,133,145,.25);border-radius:8px;color:#ffc0c8;font-size:11px;line-height:1.7}
        .dt-recovery-success{margin-top:24px;border-color:rgba(168,240,213,.25);color:#a8f0d5;background:rgba(168,240,213,.06)}
        .dt-recovery-back{display:inline-block;margin-top:26px;color:#64d8ef;font-size:11px;font-weight:700;text-decoration:none}
      `}</style>
    </main>
  );
}
