"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Manrope } from "next/font/google";
import { supabase } from "../../lib/supabase";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("Memvalidasi tautan pemulihan...");

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setReady(true);
        setMessage("");
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
        setMessage("");
      } else {
        setMessage("Tautan tidak valid atau sudah kedaluwarsa. Minta tautan reset yang baru.");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (password.length < 8) return setMessage("Password minimal 8 karakter.");
    if (password !== confirm) return setMessage("Konfirmasi password tidak sama.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setMessage("Password berhasil diperbarui. Silakan masuk kembali.");
      await supabase.auth.signOut();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Password gagal diperbarui.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`dt-recovery ${manrope.className}`}>
      <section className="dt-recovery-card">
        <Link href="/login" className="dt-recovery-brand"><span>d.</span> ditapaja</Link>
        <p className="dt-recovery-kicker">SECURE YOUR ACCOUNT</p>
        <h1>Buat password baru</h1>
        {!ready && <p className="dt-recovery-copy">{message}</p>}
        {ready && !done && <form onSubmit={submit}>
          <label>Password baru<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
          <label>Ulangi password<input required minLength={8} type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
          {message && <p className="dt-recovery-error" role="alert">{message}</p>}
          <button disabled={loading}>{loading ? "Menyimpan..." : "Simpan password baru"}</button>
        </form>}
        {done && <p className="dt-recovery-success" role="status">{message}</p>}
        <Link href="/forgot-password" className="dt-recovery-back">Minta tautan baru</Link>
      </section>
      <style jsx>{`
        .dt-recovery{display:grid;place-items:center;min-height:100svh;padding:24px 16px;background:#071426;color:#edf7fb}
        .dt-recovery-card{width:min(100%,440px);padding:clamp(26px,5vw,42px);border:1px solid rgba(170,205,222,.15);border-radius:20px;background:#0d2038;box-shadow:0 24px 70px rgba(0,0,0,.25)}
        .dt-recovery-brand{display:flex;align-items:center;gap:10px;color:#edf7fb;text-decoration:none;font-size:17px;font-weight:800}
        .dt-recovery-brand span{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;background:#a8f0d5;color:#092238}
        .dt-recovery-kicker{margin:38px 0 9px;color:#a8f0d5;font-size:9px;font-weight:800;letter-spacing:.17em}
        h1{margin:0;font-size:30px;letter-spacing:-.06em}.dt-recovery-copy{color:#9bb0c2;font-size:12px;line-height:1.8}
        form{display:grid;gap:16px;margin-top:26px}label{display:grid;gap:8px;color:#d0dce5;font-size:11px;font-weight:700}
        input{height:51px;padding:0 14px;border:1px solid rgba(169,207,224,.18);border-radius:9px;background:#071426;color:#edf7fb;font:500 12px inherit}
        button{height:52px;border:0;border-radius:9px;background:#a8f0d5;color:#092238;font-weight:800;cursor:pointer}button:disabled{opacity:.6}
        .dt-recovery-error,.dt-recovery-success{padding:12px;border:1px solid rgba(255,133,145,.25);border-radius:8px;color:#ffc0c8;font-size:11px;line-height:1.7}
        .dt-recovery-success{margin-top:24px;border-color:rgba(168,240,213,.25);color:#a8f0d5;background:rgba(168,240,213,.06)}
        .dt-recovery-back{display:inline-block;margin-top:26px;color:#64d8ef;font-size:11px;font-weight:700;text-decoration:none}
      `}</style>
    </main>
  );
}
