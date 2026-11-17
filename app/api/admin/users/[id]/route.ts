
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await verifyAdmin(request);

    if (!auth.authorized) {
      return auth.response;
    }

    const supabase = auth.supabase!;
    const { id } = await context.params;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(id);

    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const user = userData.user;

    const { data: usernameAccount, error: usernameError } = await supabase
      .from("account_usernames")
      .select("username")
      .eq("user_id", id)
      .maybeSingle();

    if (usernameError) throw usernameError;

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("full_name, created_at")
        .eq("id", id)
        .maybeSingle();

    if (profileError) throw profileError;

    const { data: cards, error: cardsError } =
      await supabase
        .from("nfc_cards")
        .select(
          "id, card_name, public_code, destination_url, active, created_at"
        )
        .eq("user_id", id)
        .order("created_at", { ascending: false });

    if (cardsError) throw cardsError;

    const cardsWithStats = await Promise.all(
      (cards || []).map(async (card) => {
        const { count: taps, error: tapsError } =
          await supabase
            .from("tap_events")
            .select("*", { count: "exact", head: true })
            .eq("card_id", card.id)
            .eq("event_type", "tap");

        if (tapsError) throw tapsError;

        const { count: reviewClicks, error: reviewError } =
          await supabase
            .from("tap_events")
            .select("*", { count: "exact", head: true })
            .eq("card_id", card.id)
            .eq("event_type", "review_click");

        if (reviewError) throw reviewError;

        return {
          ...card,
          totalTaps: taps ?? 0,
          totalReviewClicks: reviewClicks ?? 0,
        };
      })
    );

    const totalTaps = cardsWithStats.reduce(
      (total, card) => total + card.totalTaps,
      0
    );

    const totalReviewClicks = cardsWithStats.reduce(
      (total, card) => total + card.totalReviewClicks,
      0
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: usernameAccount ? "" : user.email ?? "",
        username: usernameAccount?.username ?? null,
        accountType: usernameAccount ? "username" : "email",
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        emailConfirmedAt: usernameAccount ? null : user.email_confirmed_at,
        fullName: profile?.full_name ?? "",
      },
      stats: {
        totalCards: cardsWithStats.length,
        activeCards: cardsWithStats.filter((card) => card.active).length,
        totalTaps,
        totalReviewClicks,
      },
      cards: cardsWithStats,
    });
  } catch (error) {
    console.error("Admin user detail error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load user details",
      },
      { status: 500 }
    );
  }
}


export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await verifyAdmin(request);

    if (!auth.authorized) return auth.response;

    const { id } = await context.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
    }

    if (auth.user.id === id) {
      return NextResponse.json({ success: false, error: "Superadmin tidak dapat menangguhkan akunnya sendiri." }, { status: 400 });
    }

    const body = await request.json();
    const action = body.action;
    if (action !== "suspend" && action !== "activate") {
      return NextResponse.json({ success: false, error: "Aksi tidak valid." }, { status: 400 });
    }

    const { data, error } = await auth.supabase!.auth.admin.updateUserById(id, {
      ban_duration: action === "suspend" ? "876000h" : "none",
    });

    if (error) throw error;
    if (!data.user) throw new Error("User update returned no user.");

    return NextResponse.json({
      success: true,
      message: action === "suspend" ? "Akun berhasil ditangguhkan." : "Akun berhasil diaktifkan kembali.",
      bannedUntil: data.user.banned_until ?? null,
    });
  } catch (error) {
    console.error("Admin user status update error:", error);
    return NextResponse.json({ success: false, error: "Gagal memperbarui status akun." }, { status: 500 });
  }
}
