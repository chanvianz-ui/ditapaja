
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);

    if (!auth.authorized) {
      return auth.response;
    }

    const supabase = auth.supabase;

    // Total seluruh pengguna
    let totalUsers = 0;
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data, error } =
        await supabase.auth.admin.listUsers({
          page,
          perPage,
        });

      if (error) {
        throw error;
      }

      totalUsers += data.users.length;

      if (data.users.length < perPage) {
        break;
      }

      page++;
    }

    // Total seluruh kartu NFC
    const { count: totalCards, error: cardsError } =
      await supabase
        .from("nfc_cards")
        .select("*", { count: "exact", head: true });

    if (cardsError) throw cardsError;

    // Total kartu aktif
    const { count: activeCards, error: activeError } =
      await supabase
        .from("nfc_cards")
        .select("*", { count: "exact", head: true })
        .eq("active", true);

    if (activeError) throw activeError;

    // Total seluruh tap
    const { count: totalTaps, error: tapsError } =
      await supabase
        .from("tap_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "tap");

    if (tapsError) throw tapsError;

    // Total klik tombol review
    const { count: totalReviewClicks, error: reviewError } =
      await supabase
        .from("tap_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "review_click");

    if (reviewError) throw reviewError;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalCards: totalCards ?? 0,
        activeCards: activeCards ?? 0,
        totalTaps: totalTaps ?? 0,
        totalReviewClicks: totalReviewClicks ?? 0,
      },
    });
  } catch (error) {
    console.error("Admin overview error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load admin statistics",
      },
      { status: 500 }
    );
  }
}
