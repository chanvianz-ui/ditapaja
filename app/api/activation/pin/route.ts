import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function responseError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        if (new URL(origin).origin !== request.nextUrl.origin) {
          return responseError("Permintaan tidak valid.", 403);
        }
      } catch {
        return responseError("Permintaan tidak valid.", 403);
      }
    }

    const body = await request.json();
    const pin = String(body.pin || "").trim().toUpperCase();
    const action = body.action === "link" ? "link" : "activate";

    if (!/^DTJ-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(pin)) {
      return responseError("Format PIN kartu tidak valid.", 400);
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!url || !anonKey || !secretKey) {
      return responseError("Layanan aktivasi belum dikonfigurasi.", 500);
    }

    let userId: string | null = null;
    if (action === "link") {
      const authorization = request.headers.get("authorization") || "";
      const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
      if (!token) return responseError("Silakan login terlebih dahulu untuk menghubungkan kartu.", 401);

      const authClient = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      const { data, error } = await authClient.auth.getUser(token);
      if (error || !data.user) return responseError("Sesi login tidak valid. Silakan login kembali.", 401);
      userId = data.user.id;
    }

    const admin = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const pinHash = createHash("sha256").update(pin).digest("hex");

    const { data, error } = action === "link"
      ? await admin.rpc("link_nfc_card_with_pin", { p_pin_hash: pinHash, p_user_id: userId })
      : await admin.rpc("activate_nfc_card_with_pin", { p_pin_hash: pinHash });

    if (error) {
      const code = error.message || "";
      if (code.includes("PIN_UNAVAILABLE")) return responseError("PIN tidak ditemukan, sudah digunakan, atau belum dipasangkan ke kartu.", 409);
      if (code.includes("PIN_NOT_LINKABLE")) return responseError("PIN ini belum pernah digunakan untuk aktivasi, atau sudah terhubung ke akun.", 409);
      if (code.includes("CARD_UNAVAILABLE")) return responseError("Kartu sudah digunakan, dimiliki akun lain, atau tidak tersedia.", 409);
      if (code.includes("PIN_INVALID")) return responseError("PIN kartu tidak valid.", 400);
      console.error("Card activation RPC error:", error);
      return responseError("Aktivasi kartu belum berhasil. Silakan coba lagi.", 500);
    }

    return NextResponse.json({
      success: true,
      message: action === "link"
        ? "Kartu berhasil dihubungkan ke akun kamu."
        : "Kartu berhasil diaktifkan. Simpan PIN ini untuk menghubungkannya ke akun kapan saja.",
    });
  } catch (error) {
    console.error("Card activation error:", error);
    return responseError("Terjadi kesalahan saat memproses aktivasi.", 500);
  }
}
