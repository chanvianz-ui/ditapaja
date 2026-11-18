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
      .select("id,pin_hint,status,created_at,claimed_at,card_id,claimed_by,card:nfc_cards!nfc_activation_pins_card_id_fkey(id,card_name,public_code,destination_url,user_id,active,created_at,archived_at)")
      .order("created_at", { ascending: false }).limit(200);
    if (error) throw error;

    const rows = (data ?? []).map((pin: any) => ({
      ...pin,
      card: Array.isArray(pin.card) ? pin.card[0] ?? null : pin.card ?? null,
    }));
    const userIds = [...new Set(rows.map((pin: any) => pin.card?.user_id).filter(Boolean))] as string[];
    let profilesById: Record<string, { full_name: string | null; username: string | null }> = {};
    if (userIds.length) {
      const [{ data: profiles }, { data: usernames }] = await Promise.all([
        auth.supabase!.from("profiles").select("id,full_name").in("id", userIds),
        auth.supabase!.from("account_usernames").select("user_id,username").in("user_id", userIds),
      ]);
      for (const profile of profiles ?? []) profilesById[profile.id] = { full_name: profile.full_name, username: null };
      for (const account of usernames ?? []) {
        profilesById[account.user_id] = { ...(profilesById[account.user_id] ?? { full_name: null, username: null }), username: account.username };
      }
    }
    const inventory = rows.map((pin: any) => ({
      ...pin,
      owner: pin.card?.user_id ? profilesById[pin.card.user_id] ?? null : null,
    }));
    return NextResponse.json({ success: true, pins: inventory });
  } catch (error) {
    console.error("PIN list error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat daftar PIN." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;
    return NextResponse.json({ success: false, error: "PIN harus dibuat bersama kartu melalui form inventaris." }, { status: 410 });
    /* Legacy standalone PIN generation disabled. The paired card + PIN flow is the only supported path.
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
  */
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;
    const { id, action = "revoke" } = await request.json();
    if (!/^[0-9a-f-]{36}$/i.test(String(id || "")))
      return NextResponse.json({ success: false, error: "ID PIN tidak valid." }, { status: 400 });
    if (action === "archive") {
      const { data: pin, error: pinError } = await auth.supabase!.from("nfc_activation_pins")
        .select("id,status,card_id").eq("id", id).maybeSingle();
      if (pinError) throw pinError;
      if (!pin?.card_id) return NextResponse.json({ success: false, error: "Kartu untuk PIN ini tidak ditemukan." }, { status: 404 });
      const { data: card, error: cardError } = await auth.supabase!.from("nfc_cards")
        .update({ archived_at: new Date().toISOString(), archived_by: auth.user!.id })
        .eq("id", pin.card_id).is("archived_at", null).select("id").maybeSingle();
      if (cardError) throw cardError;
      if (!card) return NextResponse.json({ success: false, error: "Kartu sudah diarsipkan atau tidak ditemukan." }, { status: 409 });
      if (pin.status === "available") {
        const { error: revokeError } = await auth.supabase!.from("nfc_activation_pins")
          .update({ status: "revoked" }).eq("id", id).eq("status", "available");
        if (revokeError) throw revokeError;
      }
      return NextResponse.json({ success: true });
    }
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
