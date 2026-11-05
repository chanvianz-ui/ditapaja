
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isGoogleMapsUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    const isDirectReviewLink =
      host === "search.google.com" &&
      url.pathname === "/local/writereview" &&
      url.searchParams.has("placeid");

    const isMapsLink =
      url.protocol === "https:" &&
      (
        host === "maps.app.goo.gl" ||
        host === "maps.google.com" ||
        host === "goo.gl" ||
        (
          ["google.com", "www.google.com"].includes(host) &&
          url.pathname.startsWith("/maps")
        )
      );

    return (
      url.protocol === "https:" &&
      (isDirectReviewLink || isMapsLink)
    );
  } catch {
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!/^[a-zA-Z0-9]{12}$/.test(code)) {
      return new NextResponse("Kartu tidak ditemukan.", {
        status: 404,
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !secretKey) {
      return new NextResponse("Server configuration error.", {
        status: 500,
      });
    }

    const supabase = createClient(supabaseUrl, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: card, error } = await supabase
      .from("nfc_cards")
      .select("id, destination_url, active")
      .eq("public_code", code)
      .maybeSingle();

    if (error) throw error;

    if (!card || !card.active) {
      return new NextResponse("Kartu tidak ditemukan atau tidak aktif.", {
        status: 404,
      });
    }

    if (!isGoogleMapsUrl(card.destination_url)) {
      return new NextResponse("Destination URL tidak valid.", {
        status: 400,
      });
    }

    const { error: trackingError } = await supabase
      .from("tap_events")
      .insert({
        card_id: card.id,
        event_type: "review_click",
        user_agent: request.headers.get("user-agent") || "",
      });

    if (trackingError) {
      console.error("Review click tracking error:", trackingError);
    }

    return NextResponse.json({ success: true, url: card.destination_url });
  } catch (error) {
    console.error("Review route error:", error);

    return new NextResponse("Terjadi kesalahan pada server.", {
      status: 500,
    });
  }
}
