import { createHmac } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!/^[a-zA-Z0-9]{12}$/.test(code)) {
      return NextResponse.json({ error: "Kartu tidak ditemukan." }, { status: 404 });
    }

    const origin = request.headers.get("origin");
    if (origin) {
      try {
        if (new URL(origin).origin !== request.nextUrl.origin) {
          return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
      }
    }

    const authorization = request.headers.get("authorization") || "";
    const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!accessToken) {
      return NextResponse.json({ error: "Login diperlukan untuk preview." }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !anonKey || !secretKey) {
      return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser(accessToken);
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Sesi login tidak valid." }, { status: 401 });
    }

    const admin = createClient(supabaseUrl, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: card, error: cardError } = await admin
      .from("nfc_cards")
      .select("id,user_id,active,archived_at")
      .eq("public_code", code)
      .maybeSingle();

    if (cardError) throw cardError;
    if (!card || card.user_id !== authData.user.id || !card.active || card.archived_at) {
      return NextResponse.json({ error: "Kartu tidak ditemukan atau bukan milik akun ini." }, { status: 404 });
    }

    const payload = Buffer.from(JSON.stringify({
      code,
      userId: authData.user.id,
      exp: Math.floor(Date.now() / 1000) + 300,
    })).toString("base64url");
    const signature = createHmac("sha256", secretKey).update(payload).digest("base64url");
    const response = NextResponse.json({ url: "/c/" + code + "?preview=1" });
    response.cookies.set("ditapaja_preview_" + code, payload + "." + signature, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/c/" + code,
      maxAge: 300,
    });
    return response;
  } catch (error) {
    console.error("NFC preview authorization error:", error);
    return NextResponse.json({ error: "Preview tidak dapat dibuka." }, { status: 500 });
  }
}
