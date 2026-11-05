
import { createClient } from "@supabase/supabase-js";
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
      width: 100%;
      border: 0;
      cursor: pointer;
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
    <button class="button" id="reviewButton" type="button">
      ★ &nbsp; Buka Google Maps Review
    </button>
    <p id="status" role="status" aria-live="polite" style="min-height:20px;font-size:12px;color:#64748b"></p>
    <div class="footer">Powered by DiTapAja · Tap. Review. Grow.</div>
  </main>
  <script>
    (function () {
      var code = ${JSON.stringify(code)};
      var button = document.getElementById("reviewButton");
      var status = document.getElementById("status");
      var tapKey = "ditapaja-tap-" + code;

      // Count once per browser tab session after the page is rendered.
      try {
        if (!sessionStorage.getItem(tapKey)) {
          sessionStorage.setItem(tapKey, "1");
          fetch("/api/track/" + encodeURIComponent(code), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            keepalive: true
          }).catch(function () {});
        }
      } catch (_) {
        fetch("/api/track/" + encodeURIComponent(code), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true
        }).catch(function () {});
      }

      button.addEventListener("click", async function () {
        button.disabled = true;
        button.textContent = "Membuka Google Maps...";
        status.textContent = "";
        try {
          var response = await fetch("/api/review/" + encodeURIComponent(code), {
            method: "POST"
          });
          var result = await response.json();
          if (!response.ok || !result.url) {
            throw new Error("Tidak dapat membuka halaman review.");
          }
          window.location.assign(result.url);
        } catch (_) {
          button.disabled = false;
          button.textContent = "★  Buka Google Maps Review";
          status.textContent = "Gagal membuka halaman review. Silakan coba lagi.";
        }
      });
    })();
  </script>
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
