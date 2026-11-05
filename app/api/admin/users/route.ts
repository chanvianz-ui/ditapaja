
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);

    if (!auth.authorized) {
      return auth.response;
    }

    const supabase = auth.supabase!;

    const { searchParams } = new URL(request.url);
    const requestedPage = Number(searchParams.get("page") || "1");

    const page = Number.isInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

    const perPage = 20;

    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;

    const users = data.users.map((user) => ({
      id: user.id,
      email: user.email ?? "",
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
      emailConfirmedAt: user.email_confirmed_at,
    }));

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        perPage,
        hasMore: users.length === perPage,
      },
    });
  } catch (error) {
    console.error("Admin users error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load users",
      },
      { status: 500 }
    );
  }
}
