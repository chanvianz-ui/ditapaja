
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!/^[a-zA-Z0-9]{12}$/.test(code)) {
      return new NextResponse("Kartu tidak ditemukan.", {
        status: 404,
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !secretKey) {
      return new NextResponse("Server configuration error.", {
        status: 500,
      });
    }

    const supabase = createClient(supabaseUrl, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: card, error } = await supabase
      .from("nfc_cards")
      .select("id, active")
      .eq("public_code", code)
      .maybeSingle();

    if (error) throw error;

    if (!card || !card.active) {
      return new NextResponse("Kartu tidak ditemukan atau tidak aktif.", {
        status: 404,
      });
    }

    const userAgent = request.headers.get("user-agent") || "";
    const ip = request.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();

    const visitorHash = ip
      ? createHash("sha256")
          .update(`${ip}:${userAgent}:${secretKey}`)
          .digest("hex")
      : null;

    const { error: trackingError } = await supabase
      .from("tap_events")
      .insert({
        card_id: card.id,
        event_type: "tap",
        visitor_hash: visitorHash,
        user_agent: userAgent,
      });

    if (trackingError) {
      console.error("Tap tracking error:", trackingError);
    }

    const clickUrl = `/api/review/${encodeURIComponent(code)}`;

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Review Bisnis | DiTapAja</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: #f7f9fc;
      font-family: Arial, sans-serif;
      color: #0f172a;
    }
    .card {
      width: 100%;
      max-width: 420px;
      padding: 36px 28px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      text-align: center;
      box-shadow: 0 15px 45px rgba(15, 23, 42, .06);
    }
    .icon {
      width: 64px;
      height: 64px;
      display: grid;
      place-items: center;
      margin: 0 auto 24px;
      border-radius: 20px;
      background: #eff6ff;
      color: #2563eb;
      font-size: 30px;
    }
    .brand {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -1px;
    }
    .brand span { color: #2563eb; }
    h1 {
      margin: 28px 0 12px;
      font-size: 25px;
      letter-spacing: -.7px;
    }
    p {
      color: #64748b;
      font-size: 14px;
      line-height: 1.7;
    }
    .button {
      display: block;
      margin-top: 28px;
      padding: 17px;
      border-radius: 13px;
      background: #2563eb;
      color: white;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 8px 18px rgba(37, 99, 235, .2);
    }
    .footer {
      margin-top: 28px;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <main class="card">
    <div class="icon">★</div>
    <div class="brand">DiTap<span>Aja.</span></div>
    <h1>Bantu bisnis kami berkembang!</h1>
    <p>
      Punya pengalaman menyenangkan?
      Bagikan pengalaman kamu dengan memberikan ulasan
      melalui Google Maps.
    </p>
    <a class="button" href="${clickUrl}">
      ★ &nbsp; Buka Google Maps Review
    </a>
    <div class="footer">Powered by DiTapAja · Tap. Review. Grow.</div>
  </main>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("NFC route error:", error);

    return new NextResponse("Terjadi kesalahan pada server.", {
      status: 500,
    });
  }
}
