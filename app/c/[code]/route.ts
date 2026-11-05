
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isGoogleMapsUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    return (
      url.protocol === "https:" &&
      (
        host === "maps.app.goo.gl" ||
        host === "maps.google.com" ||
        host === "goo.gl" ||
        (
          ["google.com", "www.google.com"].includes(host) &&
          url.pathname.startsWith("/maps")
        )
      )
    );
  } catch {
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !secretKey) {
      console.error("Supabase server environment belum lengkap.");

      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: card, error: cardError } = await supabase
      .from("nfc_cards")
      .select("id, destination_url, active")
      .eq("public_code", code)
      .maybeSingle();

    if (cardError) {
      console.error("Card lookup error:", cardError);

      return NextResponse.json(
        { error: "Unable to find card." },
        { status: 500 }
      );
    }

    if (!card || !card.active) {
      return NextResponse.json(
        { error: "Kartu tidak ditemukan atau sudah dinonaktifkan." },
        { status: 404 }
      );
    }

    if (!isGoogleMapsUrl(card.destination_url)) {
      return NextResponse.json(
        { error: "Destination URL tidak valid." },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent") || "";
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim();

    const visitorHash = ip
      ? createHash("sha256")
          .update(`${ip}:${userAgent}:${secretKey}`)
          .digest("hex")
      : null;

    const { error: eventError } = await supabase
      .from("tap_events")
      .insert({
        card_id: card.id,
        event_type: "tap",
        visitor_hash: visitorHash,
        user_agent: userAgent,
      });

    if (eventError) {
      console.error("Tap tracking error:", eventError);
    }

    return NextResponse.redirect(card.destination_url, 302);
  } catch (error) {
    console.error("NFC route error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
