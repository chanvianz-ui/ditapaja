
"use client";

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
    <main className="min-h-screen bg-[#f7f9fc] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        <Link href="/" className="text-2xl font-bold tracking-tight text-slate-900">
          DiTap<span className="text-blue-600">Aja.</span>
        </Link>

        <div className="mt-10">
          <p className="text-sm font-semibold text-blue-600">
            MULAI GRATIS
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Buat akun kamu
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Kelola kartu NFC dan pantau performanya dalam satu dashboard.
          </p>
        </div>

        <form onSubmit={handleRegister} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Nama lengkap
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kamu"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {message && (
            <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
              {message}
            </p>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Buat Akun Gratis"}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link href={nextPath ? "/login?next=" + encodeURIComponent(nextPath) : "/login"} className="font-semibold text-blue-600 hover:underline">
            Masuk
          </Link>
        </p>

        <p className="mt-8 text-center text-xs text-slate-400">
          Dengan mendaftar, kamu menyetujui ketentuan layanan DiTapAja.
        </p>
      </div>
    </main>
  );
}
