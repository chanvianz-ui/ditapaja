
"use client";

import { useEffect, useState } from "react";
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

    const isDirectReviewLink =
      host === "search.google.com" &&
      url.pathname === "/local/writereview" &&
      Boolean(url.searchParams.get("placeid")?.trim());

    const isMapsLink =
      host === "maps.app.goo.gl" ||
      host === "maps.google.com" ||
      host === "goo.gl" ||
      (
        ["google.com", "www.google.com"].includes(host) &&
        url.pathname.startsWith("/maps")
      );

    return (
      url.protocol === "https:" &&
      (isDirectReviewLink || isMapsLink)
    );
  } catch {
    return false;
  }
}

export default function NewCardPage() {
  const router = useRouter();

  const [cardName, setCardName] = useState("");
  const [destination, setDestination] = useState("");
  const [linkTested, setLinkTested] = useState(false);
  const [linkConfirmed, setLinkConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locations, setLocations] = useState<{id:string;name:string}[]>([]);
  const [locationId, setLocationId] = useState("");

  useEffect(() => {
    async function loadLocations() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase.from("business_locations").select("id,name").eq("user_id", auth.user.id).order("name");
      setLocations(data || []);
    }
    loadLocations();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cleanName = cardName.trim();
    const cleanDestination = destination.trim();

    if (!cleanName) {
      setError("Nama kartu wajib diisi.");
      return;
    }

    if (!isGoogleMapsUrl(cleanDestination)) {
      setError("Masukkan link Google Maps Review yang valid.");
      return;
    }

    if (!linkTested || !linkConfirmed) {
      setError("Uji link dan konfirmasi bahwa halaman Google Review sudah benar sebelum menyimpan kartu.");
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

      const cardPayload = {
        user_id: data.user.id,
        card_name: cleanName,
        public_code: publicCode,
        destination_url: cleanDestination,
        active: false,
      };

      let insertError: any = null;
      if (locationId) {
        const result = await supabase
          .from("nfc_cards")
          .insert({ ...cardPayload, location_id: locationId });
        insertError = result.error;

        // Keep card creation available when the optional location migration
        // has not been applied to this Supabase project yet.
        if (
          insertError &&
          (insertError.code === "PGRST204" ||
            insertError.message?.includes("location_id"))
        ) {
          console.warn("Card location column is unavailable; retrying without location assignment.");
          const fallback = await supabase
            .from("nfc_cards")
            .insert(cardPayload);
          insertError = fallback.error;
        }
      } else {
        const result = await supabase
          .from("nfc_cards")
          .insert(cardPayload);
        insertError = result.error;
      }

      if (insertError) throw insertError;

      router.replace("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("DITAPAJA INSERT ERROR:", err);

      const errorMessage = [
        err?.message,
        err?.details,
        err?.hint,
        err?.code ? `Code: ${err.code}` : null,
      ]
        .filter(Boolean)
        .join(" | ");

      setError(
        errorMessage || "Kartu gagal dibuat. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-6 sm:px-6 sm:py-9">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Kembali ke Dashboard
        </Link>

        <div className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:mt-8 sm:p-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 ring-1 ring-blue-100">
            <CreditCard size={27} />
          </div>

          <div className="mt-6">
            <p className="text-xs font-bold tracking-widest text-blue-600">
              NFC CARD MANAGEMENT
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Tambahkan kartu NFC
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Hubungkan kartu NFC dengan halaman Google Maps Review
              bisnis kamu. Setiap kartu mendapatkan kode unik.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-4 text-sm outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Nama ini digunakan untuk mengenali kartu kamu.
              </p>
            </div>

            {locations.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Lokasi bisnis</label>
                <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50">
                  <option value="">Tanpa lokasi / bisnis utama</option>
                  {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                </select>
                <p className="mt-2 text-xs text-slate-400">Pilih cabang agar aktivitas kartu dapat dianalisis per lokasi.</p>
              </div>
            )}

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
                  onChange={(e) => { setDestination(e.target.value); setLinkTested(false); setLinkConfirmed(false); }}
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-4 text-sm outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Bisa menggunakan link Google Maps biasa atau link Google Review langsung.
              </p>
              <button
                type="button"
                disabled={!isGoogleMapsUrl(destination.trim())}
                onClick={() => {
                  window.open(destination.trim(), "_blank", "noopener,noreferrer");
                  setLinkTested(true);
                  setLinkConfirmed(false);
                  setError("");
                }}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Link2 size={16} /> Uji link Google Review
              </button>
              {linkTested && (
                <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-xs font-medium leading-5 text-emerald-800">
                    Link sudah dibuka di tab baru. Periksa nama bisnis dan pastikan halaman ulasan mengarah ke bisnis yang tepat.
                  </p>
                  <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm font-medium leading-5 text-slate-700">
                    <input
                      type="checkbox"
                      checked={linkConfirmed}
                      onChange={(e) => setLinkConfirmed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
                    />
                    Saya sudah memeriksa link dan memastikan halaman Google Review sudah benar.
                  </label>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:p-5">
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
                    Kartu baru disimpan dalam status nonaktif. Setelah link diuji, aktifkan kartu dari dashboard saat siap digunakan.
                    Tidak ada biaya langganan bulanan untuk mengelola kartu dan melihat statistik.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
