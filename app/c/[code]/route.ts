import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!/^[a-zA-Z0-9]{12}$/.test(code)) {
      return new NextResponse("Kartu tidak ditemukan.", { status: 404 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !secretKey) {
      return new NextResponse("Server configuration error.", { status: 500 });
    }

    const supabase = createClient(supabaseUrl, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: card, error } = await supabase
      .from("nfc_cards")
      .select("id, active, user_id, location_id")
      .eq("public_code", code)
      .maybeSingle();

    if (error) throw error;

    if (!card || !card.active) {
      return new NextResponse("Kartu tidak ditemukan atau tidak aktif.", {
        status: 404,
      });
    }

    const [{ data: profile }, locationResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("business_name, business_category")
        .eq("id", card.user_id)
        .maybeSingle(),
      card.location_id
        ? supabase
            .from("business_locations")
            .select("name, address")
            .eq("id", card.location_id)
            .eq("user_id", card.user_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (locationResult.error) {
      console.error("NFC location lookup error:", locationResult.error);
    }

    const businessName = escapeHtml(profile?.business_name?.trim() || "Bisnis Kami");
    const branchName = escapeHtml(locationResult.data?.name?.trim() || "");
    const branchAddress = escapeHtml(locationResult.data?.address?.trim() || "");
    const category = escapeHtml(profile?.business_category?.trim() || "");
    const previewMode = request.nextUrl.searchParams.get("preview") === "1";

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <meta name="theme-color" content="#f7f9fc">
  <title>Review ${businessName} | DiTapAja</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: flex; align-items: center;
      justify-content: center; padding: 24px; background: #f7f9fc;
      font-family: Arial, sans-serif; color: #0f172a;
    }
    .card {
      width: 100%; max-width: 440px; padding: 38px 30px 30px;
      background: white; border: 1px solid #e2e8f0; border-radius: 26px;
      text-align: center; box-shadow: 0 18px 55px rgba(15, 23, 42, .07);
    }
    .icon {
      width: 66px; height: 66px; display: grid; place-items: center;
      margin: 0 auto 22px; border-radius: 21px; background: #eff6ff;
      color: #2563eb; font-size: 30px;
    }
    .eyebrow {
      margin: 0 0 9px; color: #64748b; font-size: 10px;
      font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    }
    .business {
      margin: 0; font-size: 23px; line-height: 1.25;
      letter-spacing: -.7px; font-weight: 800; overflow-wrap: anywhere;
    }
    .branch {
      display: inline-block; margin-top: 12px; padding: 7px 11px;
      border-radius: 999px; background: #f1f5f9; color: #475569;
      font-size: 12px; font-weight: 600;
    }
    .address { margin: 10px 0 0; color: #94a3b8; font-size: 12px; line-height: 1.5; }
    h1 { margin: 30px 0 10px; font-size: 20px; letter-spacing: -.4px; }
    .description { margin: 0; color: #64748b; font-size: 14px; line-height: 1.75; }
    .button {
      width: 100%; border: 0; cursor: pointer; display: block;
      margin-top: 27px; padding: 17px; border-radius: 14px;
      background: #2563eb; color: white; font-size: 15px;
      font-weight: 700; box-shadow: 0 9px 20px rgba(37, 99, 235, .2);
      transition: background .2s, transform .2s;
    }
    .button:hover { background: #1d4ed8; }
    .button:active { transform: scale(.99); }
    .button:disabled { opacity: .65; cursor: wait; }
    .status { min-height: 20px; margin: 12px 0 0; color: #64748b; font-size: 12px; }
    .footer { margin-top: 26px; color: #94a3b8; font-size: 11px; }
    .footer strong { color: #64748b; }
    @media (max-width: 380px) { .card { padding: 30px 22px 24px; } .business { font-size: 21px; } }
  </style>
</head>
<body>
  <main class="card">
    <div class="icon" aria-hidden="true">★</div>
    <p class="eyebrow">${category || "Terima kasih sudah berkunjung"}</p>
    <p class="business">${businessName}</p>
    ${branchName ? `<div class="branch">${branchName}</div>` : ""}
    ${branchAddress ? `<p class="address">${branchAddress}</p>` : ""}
    <h1>Bantu kami menjadi lebih baik</h1>
    <p class="description">
      Senang bisa menyambut kamu. Bagikan pengalaman dan ulasan
      melalui Google Maps agar lebih banyak orang mengenal kami.
    </p>
    <button class="button" id="reviewButton" type="button">
      ★ &nbsp; Berikan Ulasan di Google
    </button>
    <p class="status" id="status" role="status" aria-live="polite"></p>
    <div class="footer">Powered by <strong>DiTapAja</strong> · Tap. Review. Grow.</div>
  </main>
  <script>
    (function () {
      var code = ${JSON.stringify(code)};
      var button = document.getElementById("reviewButton");
      var status = document.getElementById("status");
      var tapKey = "ditapaja-tap-" + code;
      var previewMode = ${JSON.stringify(previewMode)};

      if (!previewMode) {
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
      } else {
        button.disabled = true;
        button.textContent = "Mode Preview";
        status.textContent = "Pratinjau pemilik kartu — aktivitas tidak dicatat.";
      }

      if (!previewMode) button.addEventListener("click", async function () {
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
          button.textContent = "★  Berikan Ulasan di Google";
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
    return new NextResponse("Terjadi kesalahan pada server.", { status: 500 });
  }
}
