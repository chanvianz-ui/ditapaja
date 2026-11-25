import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function json(data: Record<string, unknown>, status = 200, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", ...extraHeaders },
  });
}

async function readJsonBody(request: NextRequest): Promise<unknown> {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 4096) throw new Error("PAYLOAD_TOO_LARGE");

  const reader = request.body?.getReader();
  if (!reader) throw new Error("INVALID_BODY");

  const decoder = new TextDecoder();
  let body = "";
  let size = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 4096) {
      await reader.cancel();
      throw new Error("PAYLOAD_TOO_LARGE");
    }
    body += decoder.decode(value, { stream: true });
  }

  body += decoder.decode();
  return JSON.parse(body);
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return json({ success: false, error: "Content-Type tidak valid." }, 415);
    }

    const origin = request.headers.get("origin");
    if (!origin) {
      return json({ success: false, error: "Permintaan tidak valid." }, 403);
    }
    try {
      if (new URL(origin).origin !== request.nextUrl.origin) {
        return json({ success: false, error: "Permintaan tidak valid." }, 403);
      }
    } catch {
      return json({ success: false, error: "Permintaan tidak valid." }, 403);
    }

    let body: unknown;
    try {
      body = await readJsonBody(request);
    } catch (error) {
      if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
        return json({ success: false, error: "Permintaan terlalu besar." }, 413);
      }
      return json({ success: false, error: "Format permintaan tidak valid." }, 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ success: false, error: "Username atau password salah." }, 401);
    }

    const payload = body as Record<string, unknown>;
    const username = typeof payload.username === "string"
      ? payload.username.trim().toLowerCase()
      : "";
    const password = typeof payload.password === "string" ? payload.password : "";

    if (!/^[a-z0-9][a-z0-9._-]{2,23}$/.test(username) || password.length < 8 || password.length > 72) {
      return json({ success: false, error: "Username atau password salah." }, 401);
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    if (!url || !anonKey || !secretKey) {
      console.error("Username login is missing Supabase configuration.");
      return json({ success: false, error: "Login username sedang tidak tersedia." }, 503);
    }

    const ip = request.headers.get("x-real-ip")?.trim()
      || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (!ip || ip.length > 128) {
      console.error("Username login request has no trusted client IP.");
      return json({ success: false, error: "Login username sedang tidak tersedia." }, 503);
    }

    const admin = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const auth = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data: allowed, error: rateLimitError } = await admin.rpc("consume_username_login_attempt", {
      p_username: username,
      p_ip: ip,
    });

    if (rateLimitError) {
      console.error("Username login rate limit error:", rateLimitError);
      return json({ success: false, error: "Login username sedang tidak tersedia." }, 503);
    }
    if (allowed !== true) {
      return json(
        { success: false, error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." },
        429,
        { "Retry-After": "900" },
      );
    }

    const { data: account, error: lookupError } = await admin
      .from("account_usernames")
      .select("auth_email")
      .eq("username", username)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!account?.auth_email) {
      return json({ success: false, error: "Username atau password salah." }, 401);
    }

    const { data, error } = await auth.auth.signInWithPassword({
      email: account.auth_email,
      password,
    });

    if (error || !data.session) {
      return json({ success: false, error: "Username atau password salah." }, 401);
    }

    return json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  } catch (error) {
    console.error("Username login error:", error);
    return json({ success: false, error: "Login gagal. Silakan coba lagi." }, 500);
  }
}
