import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isGoogleMapsUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const directReview = host === "search.google.com" && url.pathname === "/local/writereview" && Boolean(url.searchParams.get("placeid")?.trim());
    const mapsLink = host === "maps.app.goo.gl" || host === "maps.google.com" || host === "goo.gl" || ((host === "google.com" || host === "www.google.com") && url.pathname.startsWith("/maps"));
    return url.protocol === "https:" && (directReview || mapsLink);
  } catch { return false; }
}

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
      .select("id, active, archived_at, user_id, location_id, destination_url")
      .eq("public_code", code)
      .maybeSingle();

    if (error) throw error;

    if (!card || !card.active || card.archived_at) {
      return new NextResponse("Kartu tidak ditemukan atau tidak aktif.", {
        status: 404,
      });
    }

    if (!isGoogleMapsUrl(card.destination_url)) {
      return new NextResponse("Destination URL tidak valid.", { status: 400 });
    }

    const fallbackReviewUrl = card.destination_url;

    const previewMode = (() => {
      if (request.nextUrl.searchParams.get("preview") !== "1") return false;
      const cookieName = "ditapaja_preview_" + code;
      const token = request.cookies.get(cookieName)?.value;
      if (!token) return false;
      const [payload, signature] = token.split(".");
      if (!payload || !signature) return false;
      const expected = createHmac("sha256", secretKey).update(payload).digest("base64url");
      const actualBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expected);
      if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return false;
      try {
        const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { code?: string; userId?: string; exp?: number };
        return data.code === code && data.userId === card.user_id && typeof data.exp === "number" && data.exp > Math.floor(Date.now() / 1000);
      } catch {
        return false;
      }
    })();
    const [{ data: profile }, locationResult, pageResult] = await Promise.all([
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
      supabase
        .from("nfc_card_pages")
        .select("is_published,headline,description,theme,accent_color,button_style,logo_url,logo_size,logo_position,whatsapp_url,instagram_url,website_url")
        .eq("card_id", card.id)
        .eq("user_id", card.user_id)
        .maybeSingle(),
    ]);

    if (locationResult.error) {
      console.error("NFC location lookup error:", locationResult.error);
    }
    // If the optional migration has not been applied yet, retain the original NFC page.
    if (pageResult.error) console.warn("Custom NFC page unavailable:", pageResult.error.message);

    const customPage = pageResult.data && (pageResult.data.is_published || previewMode) ? pageResult.data : null;
    const businessName = escapeHtml(profile?.business_name?.trim() || "Bisnis Kami");
    const branchName = escapeHtml(locationResult.data?.name?.trim() || "");
    const branchAddress = escapeHtml(locationResult.data?.address?.trim() || "");
    const category = escapeHtml(profile?.business_category?.trim() || "");
    const pageHeadline = escapeHtml(customPage?.headline?.trim() || "Bantu kami menjadi lebih baik");
    const pageDescription = escapeHtml(customPage?.description?.trim() || "Senang bisa menyambut kamu. Bagikan pengalaman dan ulasan melalui Google Maps agar lebih banyak orang mengenal kami.");
    const accentColor = /^#[0-9a-fA-F]{6}$/.test(customPage?.accent_color || "") ? customPage!.accent_color : "#2563eb";
    const themePalette: Record<string, { background: string; card: string; text: string; muted: string; border: string }> = {
      ocean: { background: "#f3f7ff", card: "#ffffff", text: "#172554", muted: "#64748b", border: "#dbeafe" },
      midnight: { background: "#0f172a", card: "#172033", text: "#f8fafc", muted: "#cbd5e1", border: "#334155" },
      rose: { background: "#fff1f2", card: "#ffffff", text: "#881337", muted: "#9f526a", border: "#ffe4e6" },
      forest: { background: "#f0fdf4", card: "#ffffff", text: "#14532d", muted: "#52765c", border: "#dcfce7" },
    };
    const palette = themePalette[customPage?.theme || "ocean"] || themePalette.ocean;
    const logoUrl = typeof customPage?.logo_url === "string" && customPage.logo_url.startsWith(supabaseUrl + "/storage/v1/object/public/ditapaja-brand-assets/") ? customPage.logo_url : "";
    const logoSize = Number.isInteger(customPage?.logo_size) ? Math.min(128, Math.max(40, customPage!.logo_size)) : 72;
    const logoPosition = ["left", "center", "right"].includes(customPage?.logo_position || "") ? customPage!.logo_position : "center";
    const additionalLinks = [
      ["WhatsApp", customPage?.whatsapp_url],
      ["Instagram", customPage?.instagram_url],
      ["Website", customPage?.website_url],
    ].filter((item): item is [string, string] => typeof item[1] === "string" && /^https:\/\//i.test(item[1]))
      .map(([label, url]) => `<a class="button secondary" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`)
      .join("");

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <meta name="theme-color" content="#f7f9fc">
  <meta name="description" content="Bagikan pengalaman kamu melalui Google Maps dan bantu bisnis ini berkembang.">
  <title>Review ${businessName} | DiTapAja</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: flex; align-items: center;
      justify-content: center; padding: max(22px, env(safe-area-inset-top)) max(22px, env(safe-area-inset-right)) max(22px, env(safe-area-inset-bottom)) max(22px, env(safe-area-inset-left));
      background: radial-gradient(ellipse at 50% 0%, #eaf1ff 0%, #f6f8fc 48%, #f8fafc 100%);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #101828; -webkit-font-smoothing: antialiased;
    }
    .card {
      position: relative; overflow: hidden; width: 100%; max-width: 430px;
      padding: 38px 30px 27px; background: rgba(255,255,255,.96);
      border: 1px solid rgba(226,232,240,.9); border-radius: 28px;
      text-align: center; box-shadow: 0 24px 70px rgba(15,23,42,.09), 0 3px 10px rgba(15,23,42,.025);
    }
    .card:before {
      content: ""; position: absolute; inset: 0 0 auto; height: 4px;
      background: linear-gradient(90deg,#93b4ff,#2563eb 48%,#7c9df5);
    }
    .icon {
      width: 64px; height: 64px; display: grid; place-items: center;
      margin: 0 auto 23px; border-radius: 22px;
      background: linear-gradient(145deg,#eff5ff,#e6edff);
      color: #2458c6; font-size: 29px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 8px 22px rgba(37,99,235,.09);
    }
    .eyebrow {
      margin: 0 0 10px; color: #718096; font-size: 10px;
      font-weight: 750; letter-spacing: 2.1px; text-transform: uppercase;
    }
    .business {
      margin: 0; font-size: clamp(21px, 5.8vw, 27px); line-height: 1.22;
      letter-spacing: -.85px; font-weight: 800; overflow-wrap: anywhere;
    }
    .business-label { display: block; margin: 0 0 8px; color: #98a3b3; font-size: 9px; font-weight: 750; letter-spacing: 1.7px; text-transform: uppercase; }
    .branch { max-width: 100%; white-space: normal; overflow-wrap: anywhere; justify-content: center; }
    .address { max-width: 320px; margin-left: auto; margin-right: auto; overflow-wrap: anywhere; }
    .branch {
      display: inline-flex; align-items: center; gap: 6px;
      margin-top: 13px; padding: 8px 12px; border: 1px solid #e8edf5;
      border-radius: 999px; background: #f8faff; color: #52627a;
      font-size: 11px; font-weight: 650;
    }
    .address { margin: 10px 0 0; color: #8995a7; font-size: 12px; line-height: 1.55; }
    .rule { width: 38px; height: 3px; margin: 26px auto 22px; border-radius: 9px; background: #dbe6fb; }
    h1 { margin: 0 0 10px; font-size: 21px; letter-spacing: -.55px; line-height: 1.3; }
    .description { margin: 0; color: #68768b; font-size: 13.5px; line-height: 1.8; }
    .button {
      width: 100%; border: 0; cursor: pointer; display: flex;
      align-items: center; justify-content: center; gap: 9px;
      margin-top: 25px; padding: 17px 18px; border-radius: 15px;
      background: linear-gradient(135deg,#326fe8,#2458c6); color: white;
      font-size: 14px; font-weight: 750; letter-spacing: .05px;
      box-shadow: 0 10px 22px rgba(37,88,198,.22), inset 0 1px 0 rgba(255,255,255,.18);
      transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
    }
    .button:hover { filter: brightness(1.04); box-shadow: 0 13px 26px rgba(37,88,198,.26); }
    .button:active { transform: translateY(1px) scale(.99); }
    .button:focus-visible { outline: 3px solid #a9c4ff; outline-offset: 3px; }
    .button:disabled { opacity: .68; cursor: wait; }
    .button:focus:not(:focus-visible) { outline: none; }
    .button-label { display: inline-flex; align-items: center; gap: 8px; }
    .google-mark { display: inline-grid; width: 21px; height: 21px; place-items: center; border-radius: 50%; background: white; color: #2458c6; font-size: 13px; font-weight: 850; }
    @media (max-height: 680px) and (min-width: 381px) { body { align-items: flex-start; } .card { margin: 10px auto; padding-top: 28px; padding-bottom: 22px; } .icon { width: 54px; height: 54px; margin-bottom: 17px; } .rule { margin-top: 19px; margin-bottom: 17px; } .footer { margin-top: 18px; } }
    .noscript { margin: 14px 0 0; font-size: 12px; line-height: 1.6; color: #68768b; }
    .noscript a { color: #2458c6; font-weight: 700; }
    .status { min-height: 18px; margin: 11px 0 0; color: #68768b; font-size: 11px; }
    .footer { margin-top: 25px; padding-top: 17px; border-top: 1px solid #f0f2f6; color: #9aa5b5; font-size: 10px; letter-spacing: .15px; }
    .footer strong { color: #65748a; font-weight: 750; }
    @media (max-width: 380px) {
      body { padding: 15px; }
      .card { padding: 32px 22px 23px; border-radius: 24px; }
      .business { font-size: 22px; }
      h1 { font-size: 19px; }
    }
    @media (prefers-reduced-motion: reduce) { .button { transition: none; } }
  </style>
  ${customPage ? `<style>
    body { background: ${palette.background}; color: ${palette.text}; }
    .card { background: ${palette.card}; border-color: ${palette.border}; }
    .card:before { background: ${accentColor}; }
    .icon { background: ${accentColor}20; color: ${accentColor}; }
    .brand-logo-wrap { display:flex; justify-content:${logoPosition}; margin:0 0 23px; }
    .brand-logo { width:${logoSize}px; height:${logoSize}px; object-fit:contain; border-radius:16px; }
    .business, h1 { color: ${palette.text}; }
    .eyebrow, .description, .address, .status { color: ${palette.muted}; }
    .button { background: ${customPage.button_style === "outline" ? "transparent" : accentColor}; color: ${customPage.button_style === "outline" ? accentColor : "#ffffff"}; border: 1px solid ${accentColor}; box-shadow: none; }
    .button.secondary { margin-top: 10px; }
    .rule { background: ${accentColor}55; }
  </style>` : ""}
</head>
<body>
  <main class="card">
    ${logoUrl ? `<div class="brand-logo-wrap"><img class="brand-logo" src="${escapeHtml(logoUrl)}" alt="Logo ${businessName}"></div>` : `<div class="icon" aria-hidden="true">★</div>`}
    <p class="eyebrow">${category || "Terima kasih sudah berkunjung"}</p>
    <span class="business-label">Kamu berkunjung ke</span>
    <p class="business">${businessName}</p>
    ${branchName ? `<div class="branch">${branchName}</div>` : ""}
    ${branchAddress ? `<p class="address">${branchAddress}</p>` : ""}
    <div class="rule" aria-hidden="true"></div>
    <h1>${pageHeadline}</h1>
    <p class="description">${pageDescription}</p>
    <button class="button" id="reviewButton" type="button" aria-label="Buka Google Maps untuk memberikan ulasan">
      <span class="button-label"><span class="google-mark" aria-hidden="true">G</span> Berikan Ulasan di Google</span>
    </button>
    ${additionalLinks}
    <noscript><p class="noscript">JavaScript tidak aktif. <a href="${escapeHtml(fallbackReviewUrl)}" rel="noopener noreferrer">Buka Google Maps untuk memberikan ulasan</a>.</p></noscript>
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
      var fallbackReviewUrl = ${JSON.stringify(fallbackReviewUrl)};

      if (!previewMode) {
        try {
          if (!sessionStorage.getItem(tapKey)) {
            fetch("/api/track/" + encodeURIComponent(code), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              keepalive: true
            }).then(function (response) {
              if (response.ok) sessionStorage.setItem(tapKey, "1");
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
          // Destination validated server-side: preserve the review action if tracking is unavailable.
          window.location.assign(fallbackReviewUrl);
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
