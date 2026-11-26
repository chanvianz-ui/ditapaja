import { createHash, createHmac, randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { readRequestBodyLimited } from "../../lib/read-request-body-limited";

export const dynamic = "force-dynamic";

const MAX_BODY_SIZE = 16_384;
const PRODUCTS = {
  "DiTapAja Noir": { price: 50000, minimum: 1 },
  "DiTapAja Blanc": { price: 50000, minimum: 1 },
  "DiTapAja Signature": { price: 60000, minimum: 10 },
} as const;

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (!origin) {
      return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
    }
    try {
      if (new URL(origin).origin !== request.nextUrl.origin) {
        return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_BODY_SIZE) {
      return NextResponse.json({ error: "Data pesanan terlalu besar." }, { status: 413 });
    }

    let bodyBytes: Uint8Array;
    try {
      bodyBytes = await readRequestBodyLimited(request, MAX_BODY_SIZE);
    } catch (error) {
      if (error instanceof RangeError) {
        return NextResponse.json({ error: "Data pesanan terlalu besar." }, { status: 413 });
      }
      throw error;
    }

    let body: unknown;
    try {
      body = JSON.parse(new TextDecoder().decode(bodyBytes));
    } catch {
      return NextResponse.json({ error: "Format data pesanan tidak valid." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Format data pesanan tidak valid." }, { status: 400 });
    }
    const payload = body as Record<string, unknown>;

    // Honeypot field: bots often fill every input, real visitors never see it.
    if (typeof payload.website === "string" && payload.website.trim()) {
      return NextResponse.json({ success: true });
    }

    const customer = typeof payload.customer === "string" ? payload.customer.trim() : "";
    const customerEmail = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const business = typeof payload.business === "string" ? payload.business.trim() : "";
    const phone = typeof payload.phone === "string" ? payload.phone.replace(/\D/g, "") : "";
    const destination = typeof payload.destination === "string" ? payload.destination.trim() : "";
    const productName = typeof payload.product === "string" ? payload.product : "";
    const quantity = Number(payload.quantity);
    const notes = typeof payload.notes === "string" ? payload.notes.trim() : "";

    if (
      !customer || customer.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) || customerEmail.length > 254 ||
      !business || business.length > 120 ||
      !destination || destination.length > 250 ||
      phone.length < 10 || phone.length > 15 ||
      !Number.isInteger(quantity) || quantity < 1 || quantity > 1000 ||
      notes.length > 1000 ||
      !Object.prototype.hasOwnProperty.call(PRODUCTS, productName)
    ) {
      return NextResponse.json({ error: "Periksa kembali data pesanan." }, { status: 400 });
    }

    const product = PRODUCTS[productName as keyof typeof PRODUCTS];
    if (quantity < product.minimum) {
      return NextResponse.json(
        { error: "Jumlah minimum untuk produk ini adalah " + product.minimum + " kartu." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    const ownerUserId = process.env.ADMIN_USER_ID;
    if (!supabaseUrl || !secretKey || !ownerUserId) {
      console.error("Public order intake is missing server configuration.");
      return NextResponse.json({ error: "Layanan pemesanan belum dikonfigurasi." }, { status: 503 });
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = request.headers.get("x-real-ip") || forwardedFor?.split(",")[0]?.trim() || "";
    if (!clientIp) return NextResponse.json({ error: "Permintaan tidak dapat diverifikasi." }, { status: 400 });
    const rateKey = createHmac("sha256", secretKey).update(clientIp).digest("hex");

    const supabase = createClient(supabaseUrl, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: withinLimit, error: rateLimitError } = await supabase.rpc("consume_public_order_rate_limit", { p_key_hash: rateKey });
    if (rateLimitError) {
      console.error("Public order rate limit check failed:", rateLimitError);
      return NextResponse.json({ error: "Layanan pemesanan sedang sibuk. Coba kembali beberapa saat lagi." }, { status: 503 });
    }
    if (withinLimit !== true) return NextResponse.json({ error: "Terlalu banyak percobaan pemesanan. Silakan coba lagi dalam 15 menit." }, { status: 429, headers: { "Retry-After": "900", "Cache-Control": "no-store, max-age=0" } });

    const publicUploadToken = randomBytes(32).toString("base64url");
    const publicUploadTokenHash = createHash("sha256").update(publicUploadToken).digest("hex");
    const publicUploadTokenExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const orderNotes = [
      "Nama bisnis: " + business,
      "Alamat/kota pengiriman: " + destination,
      "Catatan pelanggan: " + (notes || "-"),
      "Sumber: Formulir pemesanan publik DiTapAja",
    ].join("\n");

    const { data, error } = await supabase.from("ditapaja_orders").insert({
      user_id: ownerUserId,
      customer_name: customer,
      customer_email: customerEmail,
      customer_phone: phone,
      product_name: productName,
      quantity,
      unit_price: product.price,
      status: "pending",
      notes: orderNotes,
      public_upload_token_hash: publicUploadTokenHash,
      public_upload_token_expires_at: publicUploadTokenExpiresAt,
    }).select("id").single();

    if (error) {
      console.error("Public order insert failed:", error);
      return NextResponse.json(
        { error: "Pesanan belum berhasil disimpan. Silakan lanjutkan melalui WhatsApp." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, orderId: data.id, uploadToken: publicUploadToken }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Public order intake error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan saat mencatat pesanan." }, { status: 500 });
  }
}
