import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { renderNfcPageDocument } from "@/lib/nfc-page-template";

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
      if (!token || token.length > 2048) return false;
      const parts = token.split(".");
      if (parts.length !== 2) return false;
      const [payload, signature] = parts;
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
        .select("is_published,headline,description,theme,font_family,accent_color,button_style,logo_url,logo_size,logo_position,whatsapp_url,instagram_url,website_url")
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
    const businessName = profile?.business_name?.trim() || "Bisnis Kami";
    const branchName = locationResult.data?.name?.trim() || "";
    const branchAddress = locationResult.data?.address?.trim() || "";
    const pageHeadline = customPage?.headline?.trim() || "Bantu kami menjadi lebih baik";
    const pageDescription = customPage?.description?.trim() || "Senang bisa menyambut kamu. Bagikan pengalaman dan ulasan melalui Google Maps agar lebih banyak orang mengenal kami.";
    const accentColor = /^#[0-9a-fA-F]{6}$/.test(customPage?.accent_color || "") ? customPage!.accent_color : "#2563eb";
    const logoUrl = typeof customPage?.logo_url === "string" && customPage.logo_url.startsWith(supabaseUrl + "/storage/v1/object/public/ditapaja-brand-assets/") ? customPage.logo_url : "";

    const visual = renderNfcPageDocument({
      theme: customPage?.theme || "ocean",
      font_family: customPage?.font_family || "Manrope",
      accent_color: accentColor,
      button_style: customPage?.button_style || "solid",
      logo_url: logoUrl,
      logo_size: Number.isInteger(customPage?.logo_size) ? Math.min(128, Math.max(40, customPage!.logo_size)) : 72,
      logo_position: customPage?.logo_position || "center",
      business_name: businessName,
      branch_name: branchName,
      branch_address: branchAddress,
      headline: pageHeadline,
      description: pageDescription,
      whatsapp_url: customPage?.whatsapp_url || "",
      instagram_url: customPage?.instagram_url || "",
      website_url: customPage?.website_url || "",
      preview: previewMode,
    });
    const trackingScript = `  <script>
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
  </script>`;
    const html = visual.replace("</body>", trackingScript + "</body>");

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
