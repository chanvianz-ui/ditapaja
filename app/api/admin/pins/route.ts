import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

function generatePin() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let value = "";
  for (let i = 0; i < 8; i++) value += alphabet[bytes[i] % alphabet.length];
  return `DTJ-${value.slice(0,4)}-${value.slice(4)}`;
}
const hashPin = (pin: string) => createHash("sha256").update(pin.toUpperCase()).digest("hex");

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;
    const { data, error } = await auth.supabase!.from("nfc_activation_pins")
      .select("id,pin_hint,status,created_at,claimed_at,card_id,claimed_by")
      .order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return NextResponse.json({ success: true, pins: data ?? [] });
  } catch (error) {
    console.error("PIN list error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat daftar PIN." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;
    const body = await request.json();
    const quantity = Number(body.quantity ?? 1);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100)
      return NextResponse.json({ success: false, error: "Jumlah PIN harus 1 sampai 100." }, { status: 400 });

    const pins: string[] = [];
    const rows: { pin_hash: string; pin_hint: string; created_by: string; status: string }[] = [];
    const seen = new Set<string>();
    while (pins.length < quantity) {
      const pin = generatePin();
      const pin_hash = hashPin(pin);
      if (seen.has(pin_hash)) continue;
      seen.add(pin_hash);
      pins.push(pin);
      rows.push({ pin_hash, pin_hint: pin.slice(-4), created_by: auth.user!.id, status: "available" });
    }
    const { error } = await auth.supabase!.from("nfc_activation_pins").insert(rows);
    if (error) throw error;
    return NextResponse.json({ success: true, message: `${quantity} PIN berhasil dibuat.`, pins }, { status: 201 });
  } catch (error: any) {
    console.error("PIN create error:", error);
    return NextResponse.json({ success: false, error: error?.code === "23505" ? "PIN duplikat. Silakan generate ulang." : "Gagal membuat PIN. Periksa struktur tabel." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;
    const { id } = await request.json();
    if (!/^[0-9a-f-]{36}$/i.test(String(id || "")))
      return NextResponse.json({ success: false, error: "ID PIN tidak valid." }, { status: 400 });
    const { data, error } = await auth.supabase!.from("nfc_activation_pins")
      .update({ status: "revoked" }).eq("id", id).eq("status", "available")
      .select("id").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ success: false, error: "PIN tidak ditemukan atau sudah diklaim." }, { status: 409 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PIN revoke error:", error);
    return NextResponse.json({ success: false, error: "Gagal menonaktifkan PIN." }, { status: 500 });
  }
}
