
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);

    if (!auth.authorized) return auth.response;

    const supabase = auth.supabase!;
    const { searchParams } = new URL(request.url);

    const requestedPage = Number(searchParams.get("page") || "1");
    const page =
      Number.isInteger(requestedPage) && requestedPage > 0
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
      { success: false, error: "Failed to load users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);

    if (!auth.authorized) return auth.response;

    const supabase = auth.supabase!;
    const body = await request.json();

    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!fullName || fullName.length > 100) {
      return NextResponse.json(
        { success: false, error: "Nama wajib diisi, maksimal 100 karakter." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Format email tidak valid." },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        {
          success: false,
          error: "Password harus terdiri dari 8 sampai 72 karakter.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (error) {
      if (
        error.message.toLowerCase().includes("already") ||
        error.message.toLowerCase().includes("registered")
      ) {
        return NextResponse.json(
          { success: false, error: "Email tersebut sudah terdaftar." },
          { status: 409 }
        );
      }

      throw error;
    }

    if (!data.user) {
      throw new Error("User creation failed.");
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          full_name: fullName,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("Profile creation error:", profileError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "User berhasil dibuat.",
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName,
          createdAt: data.user.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin create user error:", error);

    return NextResponse.json(
      { success: false, error: "Gagal membuat akun pengguna." },
      { status: 500 }
    );
  }
}
