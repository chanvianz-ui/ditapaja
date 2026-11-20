"use client";

import SiteHeader from "../components/site-header";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ActivateCardPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (alive) {
        setSignedIn(Boolean(data.user));
        setChecking(false);
      }
    });
    return () => { alive = false; };
  }, []);

  async function submit(action: "activate" | "link") {
    setError("");
    setSuccess("");
    const cleanPin = pin.trim().toUpperCase();
    if (!/^DTJ-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(cleanPin)) {
      setError("Masukkan PIN kartu dengan format DTJ-XXXX-XXXX.");
      return;
    }

    setLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (action === "link") {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          router.push("/login?next=" + encodeURIComponent("/activate?mode=link"));
          return;
        }
        headers.Authorization = `Bearer ${data.session.access_token}`;
      }
      const response = await fetch("/api/activation/pin", {
        method: "POST",
        headers,
        body: JSON.stringify({ pin: cleanPin, action }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Aktivasi belum berhasil.");
      setSuccess(result.message || "Berhasil.");
      setPin("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="dt-activation-page min-h-screen bg-[#0b1420] px-4 py-10 text-[#edf3f5] sm:px-6">
      <div className="mx-auto max-w-[960px]">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#657263] hover:text-[#273d2b]">← DiTapAja</Link>
        <div className="dt-activation-shell mt-8 grid overflow-hidden rounded-[18px] border border-white/10 bg-[#122231] shadow-[0_24px_80px_rgba(0,0,0,.28)] md:grid-cols-[.9fr_1.1fr]">
          <section className="flex flex-col justify-between bg-[#202a22] p-7 text-white sm:p-10">
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#dbe8d5] text-[#293a2c]"><KeyRound size={23}/></div>
              <p className="mt-10 text-[10px] font-bold uppercase tracking-[.2em] text-[#b9c9b3]">Card activation</p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-[40px]">Satu PIN untuk mengaktifkan kartu.</h1>
              <p className="mt-4 max-w-sm text-sm leading-7 text-[#c1cbbd]">Gunakan PIN yang disertakan bersama kartu DiTapAja. Kamu bisa langsung mengaktifkan kartu tanpa membuat akun.</p>
            </div>
            <div className="mt-12 rounded-2xl border border-white/10 bg-white/[.06] p-5">
              <div className="flex items-center gap-3"><ShieldCheck size={18} className="text-[#c8dfbd]"/><span className="text-sm font-semibold">PIN terlindungi</span></div>
              <p className="mt-2 text-xs leading-6 text-white/55">Setiap PIN hanya berlaku untuk satu kartu dan tidak dapat digunakan untuk mengambil alih kartu lain.</p>
            </div>
          </section>

          <section className="dt-activation-form p-6 sm:p-10">
            <div className="max-w-md">
              <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#82917d]">Mulai sekarang</span>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Aktivasi kartu NFC</h2>
              <p className="mt-2 text-sm leading-6 text-[#7d877b]">Masukkan PIN yang tercetak pada kemasan kartu kamu.</p>

              <label htmlFor="activation-pin" className="mt-8 block text-xs font-bold text-[#485347]">PIN KARTU</label>
              <input
                id="activation-pin"
                value={pin}
                onChange={(event) => setPin(event.target.value.toUpperCase())}
                placeholder="DTJ-XXXX-XXXX"
                autoCapitalize="characters"
                autoComplete="off"
                maxLength={13}
                className="mt-2 w-full rounded-2xl border border-[#dfe5dc] bg-[#f8faf7] px-4 py-4 text-center font-mono text-lg font-bold tracking-[.12em] text-[#293b2d] outline-none transition focus:border-[#8da184] focus:bg-white focus:ring-4 focus:ring-[#eaf0e6]"
              />

              {error && <p role="alert" className="mt-4 rounded-xl border border-[#f0d1cb] bg-[#fff5f2] px-4 py-3 text-sm text-[#a14e42]">{error}</p>}
              {success && <div role="status" className="mt-4 rounded-xl border border-[#dce8d6] bg-[#f1f7ed] p-4"><div className="flex items-center gap-2 text-sm font-semibold text-[#466342]"><CheckCircle2 size={17}/>{success}</div>{!signedIn && <p className="mt-2 text-xs leading-5 text-[#657b60]">Ingin mengelola kartu dari dashboard? <Link className="font-bold underline" href="/login?next=%2Factivate%3Fmode%3Dlink">Login atau daftar</Link>, lalu masukkan PIN ini kembali untuk menghubungkannya.</p>}</div>}

              <button disabled={loading || checking} onClick={() => void submit("activate")} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#263b2b] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#354c39] disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? <Loader2 size={17} className="animate-spin"/> : <KeyRound size={17}/>}Aktifkan tanpa akun
              </button>

              {signedIn ? (
                <button disabled={loading || checking} onClick={() => void submit("link")} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#dfe5dc] bg-white px-5 py-4 text-sm font-bold text-[#344734] transition hover:bg-[#f7faf5] disabled:opacity-50">
                  <ShieldCheck size={17}/>Hubungkan ke akun saya
                </button>
              ) : (
                <div className="mt-6 rounded-xl bg-[#f6f8f4] p-4 text-xs leading-6 text-[#788474]">
                  Sudah punya akun? <Link className="font-bold text-[#405b40] underline" href="/login?next=%2Factivate%3Fmode%3Dlink">Login untuk menghubungkan kartu ke dashboard</Link>.
                </div>
              )}
              <p className="mt-6 text-center text-[11px] leading-5 text-[#9aa396]">Jangan bagikan PIN kartu kepada orang lain.</p>
            </div>
          </section>
        </div>
      </div>
      </main>
    </>
  );
}
