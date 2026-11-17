
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

// =====================================
// GET: LIST USERS
// =====================================
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);

    if (!auth.authorized) {
      return auth.response;
    }

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

    const userIds = data.users.map((user) => user.id);
    const { data: usernameRows, error: usernameError } = userIds.length
      ? await supabase
          .from("account_usernames")
          .select("user_id, username")
          .in("user_id", userIds)
      : { data: [], error: null };

    if (usernameError) throw usernameError;

    const usernameById = new Map(
      (usernameRows || []).map((row) => [row.user_id, row.username])
    );

    const users = data.users.map((user) => {
      const username = usernameById.get(user.id) || null;
      return {
        id: user.id,
        email: username ? "" : user.email ?? "",
        username,
        accountType: username ? "username" : "email",
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        emailConfirmedAt: username ? null : user.email_confirmed_at,
      };
    });

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
    console.error("Admin users GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load users.",
      },
      { status: 500 }
    );
  }
}

// =====================================
// POST: CREATE NEW USER
// =====================================
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);

    if (!auth.authorized) {
      return auth.response;
    }

    const supabase = auth.supabase!;
    const body = await request.json();

    const fullName = String(body.fullName || "").trim();
    const accountType = body.accountType === "username" ? "username" : "email";
    const email = String(body.email || "").trim().toLowerCase();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!fullName || fullName.length > 100) {
      return NextResponse.json(
        { success: false, error: "Nama wajib diisi, maksimal 100 karakter." },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { success: false, error: "Password harus terdiri dari 8 sampai 72 karakter." },
        { status: 400 }
      );
    }

    let authEmail = email;

    if (accountType === "username") {
      if (!/^[a-z0-9][a-z0-9._-]{2,23}$/.test(username)) {
        return NextResponse.json(
          { success: false, error: "Username 3–24 karakter: huruf kecil, angka, titik, garis bawah, atau strip." },
          { status: 400 }
        );
      }

      authEmail = `${username}@accounts.ditapaja.invalid`;

      const { data: existingUsername, error: usernameLookupError } = await supabase
        .from("account_usernames")
        .select("user_id")
        .eq("username", username)
        .maybeSingle();

      if (usernameLookupError) throw usernameLookupError;
      if (existingUsername) {
        return NextResponse.json(
          { success: false, error: "Username tersebut sudah digunakan." },
          { status: 409 }
        );
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: "Format email tidak valid." },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        account_type: accountType,
        ...(accountType === "username" ? { username } : {}),
      },
    });

    if (error) {
      if (
        error.message.toLowerCase().includes("already") ||
        error.message.toLowerCase().includes("registered")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: accountType === "username"
              ? "Username tersebut sudah digunakan."
              : "Email tersebut sudah terdaftar.",
          },
          { status: 409 }
        );
      }
      throw error;
    }

    if (!data.user) throw new Error("User creation failed.");

    if (accountType === "username") {
      const { error: mappingError } = await supabase
        .from("account_usernames")
        .insert({
          user_id: data.user.id,
          username,
          auth_email: authEmail,
        });

      if (mappingError) {
        await supabase.auth.admin.deleteUser(data.user.id);
        if (mappingError.code === "23505") {
          return NextResponse.json(
            { success: false, error: "Username tersebut sudah digunakan." },
            { status: 409 }
          );
        }
        throw mappingError;
      }
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        { id: data.user.id, full_name: fullName },
        { onConflict: "id" }
      );

    if (profileError) console.error("Profile creation error:", profileError);

    return NextResponse.json(
      {
        success: true,
        message: "User berhasil dibuat.",
        user: {
          id: data.user.id,
          email: accountType === "email" ? data.user.email : "",
          username: accountType === "username" ? username : null,
          accountType,
          fullName,
          createdAt: data.user.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin users POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Gagal membuat akun pengguna.",
      },
      { status: 500 }
    );
  }
}
