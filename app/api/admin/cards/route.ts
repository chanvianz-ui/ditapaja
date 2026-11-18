import { createHash, randomBytes, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

function makePin() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let raw = "";
  for (let i = 0; i < 8; i++) raw += alphabet[bytes[i] % alphabet.length];
  return `DTJ-${raw.slice(0, 4)}-${raw.slice(4)}`;
}

function validReviewUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && (
      (host === "search.google.com" && url.pathname === "/local/writereview" && Boolean(url.searchParams.get("placeid"))) ||
      host === "maps.app.goo.gl" || host === "maps.google.com" || host === "goo.gl" ||
      ((host === "google.com" || host === "www.google.com") && url.pathname.startsWith("/maps"))
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const cardName = String(body.cardName || "").trim();
    const destinationUrl = String(body.destinationUrl || "").trim();

    if (!cardName || cardName.length > 60) {
      return NextResponse.json({ success: false, error: "Nama kartu wajib diisi (maksimal 60 karakter)." }, { status: 400 });
    }
    if (!validReviewUrl(destinationUrl)) {
      return NextResponse.json({ success: false, error: "Masukkan tautan Google Maps Review yang valid." }, { status: 400 });
    }

    const pin = makePin();
    const pinHash = createHash("sha256").update(pin).digest("hex");
    const publicCode = randomUUID().replace(/-/g, "").slice(0, 12);

    const { data, error } = await auth.supabase!.rpc("create_nfc_card_pin_inventory", {
      p_card_name: cardName,
      p_destination_url: destinationUrl,
      p_public_code: publicCode,
      p_pin_hash: pinHash,
      p_pin_hint: pin.slice(-4),
      p_created_by: auth.user!.id,
    });
    if (error) throw error;

    return NextResponse.json({
      success: true,
      pin,
      cardUrl: `${request.nextUrl.origin}/c/${publicCode}`,
      cardName,
      message: "Kartu dan PIN berhasil dibuat sebagai satu paket.",
    }, { status: 201 });
  } catch (error) {
    console.error("Admin card inventory error:", error);
    return NextResponse.json({ success: false, error: "Gagal membuat kartu dan PIN. Silakan coba lagi." }, { status: 500 });
  }
}


export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const id = String(body.id || "");
    const cardName = String(body.cardName || "").trim();
    const destinationUrl = String(body.destinationUrl || "").trim();

    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ success: false, error: "ID kartu tidak valid." }, { status: 400 });
    }
    if (!cardName || cardName.length > 60) {
      return NextResponse.json({ success: false, error: "Nama kartu wajib diisi (maksimal 60 karakter)." }, { status: 400 });
    }
    if (!validReviewUrl(destinationUrl)) {
      return NextResponse.json({ success: false, error: "Masukkan tautan Google Maps Review yang valid." }, { status: 400 });
    }

    const { data, error } = await auth.supabase!.from("nfc_cards")
      .update({ card_name: cardName, destination_url: destinationUrl })
      .eq("id", id).is("archived_at", null)
      .select("id").maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ success: false, error: "Kartu tidak ditemukan atau sudah diarsipkan." }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Detail kartu berhasil diperbarui." });
  } catch (error) {
    console.error("Admin card update error:", error);
    return NextResponse.json({ success: false, error: "Gagal memperbarui kartu." }, { status: 500 });
  }
}
