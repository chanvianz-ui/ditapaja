
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Link2,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../../../../lib/supabase";

function isGoogleMapsUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    return (
      url.protocol === "https:" &&
      (
        host === "maps.app.goo.gl" ||
        host === "maps.google.com" ||
        host === "google.com" ||
        host === "www.google.com" ||
        host === "goo.gl"
      ) &&
      (
        host !== "google.com" &&
        host !== "www.google.com" ||
        url.pathname.startsWith("/maps")
      )
    );
  } catch {
    return false;
  }
}

export default function NewCardPage() {
  const router = useRouter();

  const [cardName, setCardName] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cleanDestination = destination.trim();

    if (!isGoogleMapsUrl(cleanDestination)) {
      setError("Masukkan link Google Maps Review yang valid.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } =
        await supabase.auth.getUser();

      if (authError || !data.user) {
        router.replace("/login");
        return;
      }

      const publicCode = crypto.randomUUID()
        .replace(/-/g, "")
        .slice(0, 12);

      const { error: insertError } = await supabase
        .from("nfc_cards")
        .insert({
          user_id: data.user.id,
          public_code: publicCode,
          destination_url: cleanDestination,
          active: true,
        });

      if (insertError) throw insertError;

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kartu gagal dibuat. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Kembali ke Dashboard
        </Link>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/40 sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <CreditCard size={27} />
          </div>

          <div className="mt-7">
            <p className="text-xs font-bold tracking-widest text-blue-600">
              NFC CARD MANAGEMENT
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Tambahkan kartu NFC
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Hubungkan kartu NFC kamu dengan halaman Google Maps
              Review bisnis. Setiap kartu akan mendapatkan alamat unik.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-9 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Nama kartu
              </label>

              <div className="relative">
                <CreditCard
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Contoh: Kartu Meja Kasir"
                  maxLength={60}
                  className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Nama ini hanya untuk memudahkan kamu mengenali kartu.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Google Maps Review URL
              </label>

              <div className="relative">
                <MapPin
                  size={18}
                  className="absolute left-4 top-4 text-slate-400"
                />
                <input
                  required
                  type="url"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Tempelkan link Google Maps yang mengarah ke halaman ulasan bisnis.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="rounded-2xl bg-blue-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={20}
                  className="mt-0.5 shrink-0 text-blue-600"
                />
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Dashboard gratis selamanya
                  </p>
                  <p className="mt-1 text-xs leading-5 text-blue-700">
                    Tidak ada biaya langganan bulanan untuk mengelola
                    kartu dan melihat statistik.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Menyimpan kartu...
                </>
              ) : (
                <>
                  <Link2 size={18} />
                  Simpan Kartu NFC
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          DiTapAja · Tap. Review. Grow.
        </p>
      </div>
    </main>
  );
}
