"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("Memvalidasi tautan pemulihan...");

  useEffect(() => {
    let recovered = false;
    const hasCallbackError =
      window.location.hash.includes("error=") ||
      window.location.search.includes("error=");

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        recovered = true;
        window.clearTimeout(validationTimeout);
        setReady(true);
        setMessage("");
      }
    });

    const validationTimeout = window.setTimeout(() => {
      if (!recovered && !hasCallbackError) {
        setMessage("Tautan pemulihan tidak dapat diverifikasi atau sudah kedaluwarsa. Minta tautan reset yang baru.");
      }
    }, 10000);

    if (hasCallbackError) {
      setMessage("Tautan tidak valid atau sudah kedaluwarsa. Minta tautan reset yang baru.");
    }

    return () => {
      window.clearTimeout(validationTimeout);
      listener.subscription.unsubscribe();
    };
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
    <main className="dt-recovery-v2">
      <section className="dt-recovery-v2-card">
        <Link href="/login" className="dt-recovery-v2-brand"><span>d.</span> ditapaja</Link>
        <p className="dt-recovery-v2-kicker">SECURE YOUR ACCOUNT</p>
        <h1>Buat password baru</h1>
        {!ready && <p className="dt-recovery-v2-copy" role="status">{message}</p>}
        {ready && !done && (
          <form onSubmit={submit}>
            <label>Password baru<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} /></label>
            <label>Ulangi password<input required minLength={8} type="password" autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} /></label>
            {message && <p className="dt-recovery-v2-error" role="alert">{message}</p>}
            <button disabled={loading}>{loading ? "Menyimpan..." : "Simpan password baru"}</button>
          </form>
        )}
        {done && <p className="dt-recovery-v2-success" role="status">{message}</p>}
        <Link href="/forgot-password" className="dt-recovery-v2-back">Minta tautan baru</Link>
      </section>
    </main>
  );
}
