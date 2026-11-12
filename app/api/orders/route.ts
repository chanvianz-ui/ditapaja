import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PRODUCTS = {
  "DiTapAja Noir": { price: 50000, minimum: 1 },
  "DiTapAja Blanc": { price: 50000, minimum: 1 },
  "DiTapAja Signature": { price: 60000, minimum: 10 },
} as const;

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
    }

    const body = await request.json();
    // Honeypot field: bots often fill every input, real visitors never see it.
    if (typeof body.website === "string" && body.website.trim()) {
      return NextResponse.json({ success: true });
    }

    const customer = typeof body.customer === "string" ? body.customer.trim() : "";
    const business = typeof body.business === "string" ? body.business.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
    const destination = typeof body.destination === "string" ? body.destination.trim() : "";
    const productName = typeof body.product === "string" ? body.product : "";
    const quantity = Number(body.quantity);
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    if (!customer || customer.length > 100 || !business || business.length > 120 ||
        !destination || destination.length > 250 || phone.length < 10 || phone.length > 15 ||
        !Number.isInteger(quantity) || quantity < 1 || quantity > 1000 ||
        notes.length > 1000 || !Object.prototype.hasOwnProperty.call(PRODUCTS, productName)) {
      return NextResponse.json({ error: "Periksa kembali data pesanan." }, { status: 400 });
    }

    const product = PRODUCTS[productName as keyof typeof PRODUCTS];
    if (quantity < product.minimum) {
      return NextResponse.json({ error: "Jumlah minimum untuk produk ini adalah " + product.minimum + " kartu." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    const ownerUserId = process.env.ADMIN_USER_ID;
    if (!supabaseUrl || !secretKey || !ownerUserId) {
      console.error("Public order intake is missing server configuration.");
      return NextResponse.json({ error: "Layanan pemesanan belum dikonfigurasi." }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const orderNotes = [
      "Nama bisnis: " + business,
      "Alamat/kota pengiriman: " + destination,
      "Catatan pelanggan: " + (notes || "-"),
      "Sumber: Formulir pemesanan publik DiTapAja",
    ].join("\n");

    const { data, error } = await supabase.from("ditapaja_orders").insert({
      user_id: ownerUserId,
      customer_name: customer,
      customer_phone: phone,
      product_name: productName,
      quantity,
      unit_price: product.price,
      status: "pending",
      notes: orderNotes,
    }).select("id").single();

    if (error) {
      console.error("Public order insert failed:", error);
      return NextResponse.json({ error: "Pesanan belum berhasil disimpan. Silakan lanjutkan melalui WhatsApp." }, { status: 500 });
    }

    return NextResponse.json({ success: true, orderId: data.id });
  } catch (error) {
    console.error("Public order intake error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan saat mencatat pesanan." }, { status: 500 });
  }
}
