import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    const { data, error } = await auth.supabase!.from("nfc_activation_pins")
      .select("id,pin_hint,status,created_at,claimed_at,card_id,claimed_by,card:nfc_cards!nfc_activation_pins_card_id_fkey(id,card_name,public_code,destination_url,user_id,active,created_at,archived_at)")
      .order("created_at", { ascending: false }).limit(200);
    if (error) throw error;

    const rows = (data ?? [])
      .map((pin: any) => ({
        ...pin,
        card: Array.isArray(pin.card) ? pin.card[0] ?? null : pin.card ?? null,
      }))
      .filter((pin: any) => pin.card);

    const userIds = [...new Set(rows.map((pin: any) => pin.card?.user_id).filter(Boolean))] as string[];
    let profilesById: Record<string, { full_name: string | null; username: string | null }> = {};
    if (userIds.length) {
      const [{ data: profiles }, { data: usernames }] = await Promise.all([
        auth.supabase!.from("profiles").select("id,full_name").in("id", userIds),
        auth.supabase!.from("account_usernames").select("user_id,username").in("user_id", userIds),
      ]);
      for (const profile of profiles ?? []) profilesById[profile.id] = { full_name: profile.full_name, username: null };
      for (const account of usernames ?? []) {
        profilesById[account.user_id] = {
          ...(profilesById[account.user_id] ?? { full_name: null, username: null }),
          username: account.username,
        };
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
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;
  return NextResponse.json(
    { success: false, error: "PIN harus dibuat bersama kartu melalui form inventaris." },
    { status: 410 },
  );
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    const { id, action = "revoke", ids = [] } = await request.json();
    if (!/^[0-9a-f-]{36}$/i.test(String(id || ""))) {
      return NextResponse.json({ success: false, error: "ID PIN tidak valid." }, { status: 400 });
    }

    if (action === "bulk_archive" || action === "bulk_revoke") {
      const requestedIds = Array.isArray(ids) ? ids : [];
      const uniqueIds = [...new Set(requestedIds.filter((value: unknown) => typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value)))];
      if (!uniqueIds.length || uniqueIds.length > 200) {
        return NextResponse.json({ success: false, error: "Pilih antara 1 sampai 200 item." }, { status: 400 });
      }
      const { data: selectedPins, error: selectedError } = await auth.supabase!.from("nfc_activation_pins")
        .select("id,status,card_id").in("id", uniqueIds);
      if (selectedError) throw selectedError;
      if (action === "bulk_revoke") {
        const availableIds = (selectedPins ?? []).filter((pin: any) => pin.status === "available").map((pin: any) => pin.id);
        if (!availableIds.length) return NextResponse.json({ success: false, error: "Tidak ada PIN tersedia dalam pilihan." }, { status: 409 });
        const { data: updated, error: updateError } = await auth.supabase!.from("nfc_activation_pins")
          .update({ status: "revoked" }).in("id", availableIds).eq("status", "available").select("id");
        if (updateError) throw updateError;
        return NextResponse.json({ success: true, updated: updated?.length ?? 0 });
      }
      const cardIds = [...new Set((selectedPins ?? []).map((pin: any) => pin.card_id).filter(Boolean))];
      if (!cardIds.length) return NextResponse.json({ success: false, error: "Tidak ada kartu valid dalam pilihan." }, { status: 404 });
      const { data: archivedCards, error: archiveError } = await auth.supabase!.from("nfc_cards")
        .update({ archived_at: new Date().toISOString(), archived_by: auth.user!.id })
        .in("id", cardIds).is("archived_at", null).select("id");
      if (archiveError) throw archiveError;
      const archivedIds = (archivedCards ?? []).map((card: any) => card.id);
      const availablePinIds = (selectedPins ?? []).filter((pin: any) => pin.status === "available" && archivedIds.includes(pin.card_id)).map((pin: any) => pin.id);
      if (availablePinIds.length) {
        const { error: revokeError } = await auth.supabase!.from("nfc_activation_pins")
          .update({ status: "revoked" }).in("id", availablePinIds).eq("status", "available");
        if (revokeError) throw revokeError;
      }
      return NextResponse.json({ success: true, updated: archivedIds.length });
    }

    if (action === "archive") {
      const { data: pin, error: pinError } = await auth.supabase!.from("nfc_activation_pins")
        .select("id,status,card_id").eq("id", id).maybeSingle();
      if (pinError) throw pinError;
      if (!pin?.card_id) {
        return NextResponse.json({ success: false, error: "Kartu untuk PIN ini tidak ditemukan." }, { status: 404 });
      }

      const { data: card, error: cardError } = await auth.supabase!.from("nfc_cards")
        .update({ archived_at: new Date().toISOString(), archived_by: auth.user!.id })
        .eq("id", pin.card_id).is("archived_at", null).select("id").maybeSingle();
      if (cardError) throw cardError;
      if (!card) {
        return NextResponse.json({ success: false, error: "Kartu sudah diarsipkan atau tidak ditemukan." }, { status: 409 });
      }

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
    if (!data) {
      return NextResponse.json({ success: false, error: "PIN tidak ditemukan atau sudah diklaim." }, { status: 409 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PIN revoke error:", error);
    return NextResponse.json({ success: false, error: "Gagal menonaktifkan PIN." }, { status: 500 });
  }
}
