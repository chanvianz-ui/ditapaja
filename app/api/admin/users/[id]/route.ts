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
    if (!auth.authorized) return auth.response;

    const { id } = await context.params;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const supabase = auth.supabase!;
    const [userResult, usernameResult, profileResult, cardStatsResult] =
      await Promise.all([
        supabase.auth.admin.getUserById(id),
        supabase
          .from("account_usernames")
          .select("username")
          .eq("user_id", id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("full_name, created_at")
          .eq("id", id)
          .maybeSingle(),
        supabase.rpc("get_admin_user_card_stats", { p_user_id: id }),
      ]);

    if (userResult.error || !userResult.data.user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }
    if (usernameResult.error) throw usernameResult.error;
    if (profileResult.error) throw profileResult.error;
    if (cardStatsResult.error) throw cardStatsResult.error;

    const cardStats = cardStatsResult.data as {
      stats?: {
        totalCards: number;
        activeCards: number;
        totalTaps: number;
        totalReviewClicks: number;
      };
      cards?: Array<{
        id: string;
        card_name: string;
        public_code: string;
        destination_url: string;
        active: boolean;
        created_at: string;
        totalTaps: number;
        totalReviewClicks: number;
      }>;
    } | null;

    if (!cardStats?.stats || !Array.isArray(cardStats.cards)) {
      throw new Error("Admin user card stats RPC returned an invalid payload.");
    }

    const user = userResult.data.user;
    const usernameAccount = usernameResult.data;
    const profile = profileResult.data;

    return NextResponse.json(
      {
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
        stats: cardStats.stats,
        cards: cardStats.cards,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error("Admin user detail error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load user details" },
      {
        status: 500,
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
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
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    if (auth.user.id === id) {
      return NextResponse.json(
        {
          success: false,
          error: "Superadmin tidak dapat menangguhkan akunnya sendiri.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const action = body.action;

    if (action !== "suspend" && action !== "activate") {
      return NextResponse.json(
        { success: false, error: "Aksi tidak valid." },
        { status: 400 }
      );
    }

    const { data, error } = await auth.supabase!.auth.admin.updateUserById(id, {
      ban_duration: action === "suspend" ? "876000h" : "none",
    });

    if (error) throw error;
    if (!data.user) throw new Error("User update returned no user.");

    return NextResponse.json({
      success: true,
      message:
        action === "suspend"
          ? "Akun berhasil ditangguhkan."
          : "Akun berhasil diaktifkan kembali.",
      bannedUntil: data.user.banned_until ?? null,
    });
  } catch (error) {
    console.error("Admin user status update error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui status akun." },
      { status: 500 }
    );
  }
}
