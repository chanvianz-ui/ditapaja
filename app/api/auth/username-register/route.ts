import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function json(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST(request: NextRequest) {
  let createdUserId: string | null = null;
  try {
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return json({ success: false, error: "Content-Type tidak valid." }, 415);
    }
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).origin !== request.nextUrl.origin) {
      return json({ success: false, error: "Permintaan tidak valid." }, 403);
    }

    const length = Number(request.headers.get("content-length") || 0);
    if (length > 4096) return json({ success: false, error: "Permintaan terlalu besar." }, 413);
    const body = await request.json() as Record<string, unknown>;
    const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";

    if (!/^[a-z0-9][a-z0-9._-]{2,23}$/.test(username)) {
      return json({ success: false, error: "Username harus 3–24 karakter, diawali huruf/angka, dan hanya memakai huruf kecil, angka, titik, garis bawah, atau strip." }, 400);
    }
    if (password.length < 8 || password.length > 72) {
      return json({ success: false, error: "Password harus 8–72 karakter." }, 400);
    }
    if (!fullName || fullName.length > 100) {
      return json({ success: false, error: "Nama lengkap wajib diisi (maksimal 100 karakter)." }, 400);
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!url || !anonKey || !secretKey) {
      console.error("Username registration is missing Supabase configuration.");
      return json({ success: false, error: "Registrasi username sedang tidak tersedia." }, 503);
    }

    const admin = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const auth = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const authEmail = username + "@accounts.ditapaja.invalid";
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, account_type: "username" },
    });
    if (createError || !created.user) {
      const duplicate = createError?.message.toLowerCase().includes("already") ||
        createError?.message.toLowerCase().includes("registered");
      return json({ success: false, error: duplicate ? "Username sudah digunakan." : "Akun tidak dapat dibuat. Periksa data lalu coba lagi." }, duplicate ? 409 : 400);
    }
    createdUserId = created.user.id;

    const { error: mappingError } = await admin.from("account_usernames").insert({
      user_id: created.user.id,
      username,
      auth_email: authEmail,
    });
    if (mappingError) {
      await admin.auth.admin.deleteUser(created.user.id);
      createdUserId = null;
      if (mappingError.code === "23505") return json({ success: false, error: "Username sudah digunakan." }, 409);
      console.error("Username mapping insert failed:", mappingError);
      return json({ success: false, error: "Data akun gagal disimpan." }, 500);
    }

    const { data: signedIn, error: signInError } = await auth.auth.signInWithPassword({
      email: authEmail,
      password,
    });
    if (signInError || !signedIn.session) {
      await admin.auth.admin.deleteUser(created.user.id);
      createdUserId = null;
      console.error("New username account sign-in failed:", signInError);
      return json({ success: false, error: "Akun dibuat, tetapi sesi login gagal. Silakan masuk melalui username." }, 500);
    }

    return json({
      success: true,
      session: {
        access_token: signedIn.session.access_token,
        refresh_token: signedIn.session.refresh_token,
      },
    });
  } catch (error) {
    console.error("Username registration error:", error);
    return json({ success: false, error: "Registrasi gagal. Silakan coba lagi." }, 400);
  }
}
