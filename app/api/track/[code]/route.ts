import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Browser requests from the public NFC page must be same-origin.
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        if (new URL(origin).origin !== request.nextUrl.origin) {
          return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
      }
    }

    if (!/^[a-zA-Z0-9]{12}$/.test(code)) {
      return NextResponse.json({ error: "Kartu tidak ditemukan." }, { status: 404 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !secretKey) {
      console.error("Tap tracking is missing Supabase server configuration.");
      return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: card, error: cardError } = await supabase
      .from("nfc_cards")
      .select("id, active")
      .eq("public_code", code)
      .maybeSingle();

    if (cardError) throw cardError;

    if (!card || !card.active) {
      return NextResponse.json({ error: "Kartu tidak ditemukan atau tidak aktif." }, { status: 404 });
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const userAgent = (request.headers.get("user-agent") || "").slice(0, 500);

    // Store only a one-way visitor identifier, never the raw IP address.
    const visitorHash = createHash("sha256")
      .update(clientIp + "|" + userAgent + "|" + secretKey)
      .digest("hex");

    // Ignore retries/repeated requests from the same visitor for this card
    // within a short window, preventing accidental duplicate analytics rows.
    const dedupeSince = new Date(Date.now() - 10_000).toISOString();
    const { data: recentEvent, error: dedupeError } = await supabase
      .from("tap_events")
      .select("id")
      .eq("card_id", card.id)
      .eq("event_type", "tap")
      .eq("visitor_hash", visitorHash)
      .gte("created_at", dedupeSince)
      .limit(1)
      .maybeSingle();

    if (dedupeError) throw dedupeError;
    if (recentEvent) return NextResponse.json({ success: true, duplicate: true });

    const { error: insertError } = await supabase.from("tap_events").insert({
      card_id: card.id,
      event_type: "tap",
      visitor_hash: visitorHash,
      user_agent: userAgent,
    });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tap tracking error:", error);
    return NextResponse.json({ error: "Gagal mencatat aktivitas tap." }, { status: 500 });
  }
}
