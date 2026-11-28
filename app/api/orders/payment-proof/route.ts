import { createHash, randomUUID, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { readRequestBodyLimited } from "../../../lib/read-request-body-limited";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "ditapaja-payment-proofs";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

function response(error: string, status: number) {
  return NextResponse.json({ success: false, error }, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function validSignature(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10";
  if (type === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (type === "application/pdf") return String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).origin !== request.nextUrl.origin) {
      return response("Permintaan tidak valid.", 403);
    }
    const maxBodySize = MAX_FILE_SIZE + 64_000;
    const length = Number(request.headers.get("content-length") || 0);
    if (length > maxBodySize) return response("Ukuran file maksimal 5 MB.", 413);

    let bodyBytes: Uint8Array;
    try {
      bodyBytes = await readRequestBodyLimited(request, maxBodySize);
    } catch (error) {
      if (error instanceof RangeError) return response("Ukuran file maksimal 5 MB.", 413);
      throw error;
    }

    const formHeaders = new Headers(request.headers);
    formHeaders.delete("content-length");
    const boundedRequest = new Request(request.url, {
      method: "POST",
      headers: formHeaders,
      body: bodyBytes as unknown as BodyInit,
    });
    const form = await boundedRequest.formData();
    const orderId = String(form.get("orderId") || "");
    const uploadToken = String(form.get("uploadToken") || "");
    const method = String(form.get("paymentMethod") || "bank_transfer");
    const reference = String(form.get("paymentReference") || "").trim();
    const file = form.get("file");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId) ||
      !/^[A-Za-z0-9_-]{40,64}$/.test(uploadToken) ||
      !["bank_transfer", "qris"].includes(method) || reference.length > 120 ||
      !(file instanceof File)) return response("Data bukti pembayaran tidak valid.", 400);

    const extension = EXTENSIONS[file.type];
    if (!extension || file.size < 1 || file.size > MAX_FILE_SIZE) {
      return response("File harus JPG, PNG, WEBP, atau PDF dengan ukuran maksimal 5 MB.", 400);
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!validSignature(file.type, bytes)) return response("Isi file tidak sesuai dengan format yang diizinkan.", 400);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) return response("Layanan pembayaran belum tersedia.", 503);
    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

    const tokenHash = createHash("sha256").update(uploadToken).digest("hex");
    const { data: order, error: lookupError } = await admin.from("ditapaja_orders")
      .select("id,user_id,status,payment_status,payment_proof_path,public_upload_token_hash,public_upload_token_expires_at")
      .eq("id", orderId).maybeSingle();
    if (lookupError) {
      console.error("Public payment proof lookup failed:", lookupError);
      return response("Pesanan belum dapat diperiksa.", 500);
    }
    if (!order || !order.public_upload_token_hash || !order.public_upload_token_expires_at) return response("Token upload tidak valid atau sudah digunakan.", 403);
    const expectedHash = Buffer.from(order.public_upload_token_hash, "hex");
    const providedHash = Buffer.from(tokenHash, "hex");
    if (expectedHash.length !== providedHash.length || !timingSafeEqual(expectedHash, providedHash) || new Date(order.public_upload_token_expires_at).getTime() < Date.now()) return response("Token upload tidak valid atau sudah kedaluwarsa. Masuk ke akun untuk mengunggah bukti pembayaran.", 403);
    if (order.status === "cancelled" || ["paid", "refunded"].includes(order.payment_status)) {
      return response("Bukti pembayaran tidak dapat dikirim untuk pesanan ini.", 409);
    }

    const path = order.user_id + "/" + order.id + "/" + randomUUID() + "." + extension;
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) {
      console.error("Public payment proof upload failed:", uploadError);
      return response("Bukti transfer gagal diunggah. Silakan coba kembali.", 500);
    }

    const { data: updatedOrder, error: updateError } = await admin.from("ditapaja_orders").update({
      payment_method: method,
      payment_reference: reference || null,
      payment_proof_path: path,
      payment_status: "pending_verification",
      public_upload_token_hash: null,
      public_upload_token_expires_at: null,
      updated_at: new Date().toISOString(),
    }).eq("id", order.id).eq("public_upload_token_hash", tokenHash).eq("status", order.status).eq("payment_status", order.payment_status).select("id").maybeSingle();
    if (updateError || !updatedOrder) {
      await admin.storage.from(BUCKET).remove([path]);
      console.error("Public payment proof update failed:", updateError);
      return response(updateError ? "File terunggah, tetapi status pembayaran gagal diperbarui. Hubungi DiTapAja." : "Token upload sudah digunakan atau pesanan berubah. Silakan login untuk melanjutkan.", updateError ? 500 : 409);
    }

    if (order.payment_proof_path) await admin.storage.from(BUCKET).remove([order.payment_proof_path]);
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Public payment proof error:", error);
    return response("Terjadi kesalahan saat mengirim bukti pembayaran.", 500);
  }
}
