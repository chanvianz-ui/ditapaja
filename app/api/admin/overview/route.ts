import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);

    if (!auth.authorized) {
      return auth.response;
    }

    const { data: stats, error } = await auth.supabase!.rpc(
      "get_admin_overview_stats"
    );

    if (error) throw error;
    if (!stats || typeof stats !== "object") {
      throw new Error("Admin overview RPC returned an invalid payload.");
    }

    return NextResponse.json(
      { success: true, stats },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error("Admin overview error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load admin statistics",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  }
}
