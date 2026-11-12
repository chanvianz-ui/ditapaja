import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BUCKET = "ditapaja-payment-proofs";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};
type PaymentMethod = "bank_transfer" | "qris";

function json(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return json({ error: "Pesanan tidak ditemukan." }, 404);
    }

    const origin = request.headers.get("origin");
    if (!origin) return json({ error: "Permintaan tidak valid." }, 403);
    try {
      if (new URL(origin).origin !== request.nextUrl.origin) {
        return json({ error: "Permintaan tidak valid." }, 403);
      }
    } catch {
      return json({ error: "Permintaan tidak valid." }, 403);
    }

    const authorization = request.headers.get("authorization") || "";
    const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!accessToken) return json({ error: "Silakan login untuk melanjutkan." }, 401);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !anonKey || !secretKey) {
      console.error("Payment proof endpoint is missing server configuration.");
      return json({ error: "Layanan upload bukti pembayaran belum tersedia." }, 503);
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser(accessToken);
    if (authError || !authData.user) return json({ error: "Sesi login tidak valid. Silakan login kembali." }, 401);

    const body = await request.json();
    const action = body?.action;
    if (action !== "create" && action !== "confirm") {
      return json({ error: "Permintaan upload tidak valid." }, 400);
    }

    const admin = createClient(supabaseUrl, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: order, error: orderError } = await admin
      .from("ditapaja_orders")
      .select("id,user_id,customer_user_id,status,payment_status,payment_proof_path")
      .eq("id", id)
      .eq("customer_user_id", authData.user.id)
      .maybeSingle();

    if (orderError) {
      console.error("Payment proof order lookup failed:", orderError);
      return json({ error: "Pesanan belum dapat diperiksa." }, 500);
    }
    if (!order) return json({ error: "Pesanan tidak ditemukan atau bukan milik akun ini." }, 404);
    if (order.status === "cancelled" || ["paid", "refunded"].includes(order.payment_status)) {
      return json({ error: "Bukti pembayaran tidak dapat diubah untuk pesanan ini." }, 409);
    }
    if (order.payment_proof_path && order.payment_status === "pending_verification") {
      return json({ error: "Bukti pembayaran untuk pesanan ini sudah dikirim dan sedang diperiksa." }, 409);
    }

    if (action === "create") {
      const fileType = typeof body.fileType === "string" ? body.fileType : "";
      const fileSize = Number(body.fileSize);
      const extension = MIME_EXTENSIONS[fileType];
      if (!extension || !Number.isSafeInteger(fileSize) || fileSize < 1 || fileSize > MAX_FILE_SIZE) {
        return json({ error: "File harus JPG, PNG, WEBP, atau PDF dengan ukuran maksimal 5 MB." }, 400);
      }

      // Store under the order owner's folder so the existing private-bucket
      // policy continues to let the admin review the proof using a signed URL.
      const path = order.user_id + "/" + order.id + "/" + randomUUID() + "." + extension;
      const { data, error: signedError } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
      if (signedError || !data?.token) {
        console.error("Payment proof signed upload URL failed:", signedError);
        return json({ error: "Link upload tidak dapat dibuat. Coba lagi." }, 500);
      }
      return json({ success: true, path, token: data.token });
    }

    const path = typeof body.path === "string" ? body.path : "";
    const paymentMethod = body.paymentMethod as PaymentMethod;
    const paymentReference = typeof body.paymentReference === "string" ? body.paymentReference.trim() : "";
    if (!["bank_transfer", "qris"].includes(paymentMethod) || paymentReference.length > 120) {
      return json({ error: "Periksa metode dan referensi pembayaran." }, 400);
    }

    const pathParts = path.split("/");
    const fileName = pathParts[2] || "";
    if (
      pathParts.length !== 3 ||
      pathParts[0] !== order.user_id ||
      pathParts[1] !== order.id ||
      !/^[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/i.test(fileName)
    ) {
      return json({ error: "File bukti pembayaran tidak valid." }, 400);
    }

    const { data: objects, error: listError } = await admin.storage.from(BUCKET).list(
      order.user_id + "/" + order.id,
      { search: fileName, limit: 10 }
    );
    if (listError) {
      console.error("Payment proof storage check failed:", listError);
      return json({ error: "File yang diunggah belum dapat diverifikasi." }, 500);
    }
    const uploadedFile = (objects || []).find((file) => file.name === fileName);
    if (!uploadedFile) return json({ error: "Upload belum selesai. Silakan coba lagi." }, 400);
    const metadata = uploadedFile.metadata as { size?: number | string; mimetype?: string } | null;
    const uploadedSize = Number(metadata?.size);
    const uploadedMime = metadata?.mimetype || "";
    const pathExtension = fileName.split(".").pop()?.toLowerCase();
    if (
      !Number.isSafeInteger(uploadedSize) ||
      uploadedSize < 1 ||
      uploadedSize > MAX_FILE_SIZE ||
      !Object.prototype.hasOwnProperty.call(MIME_EXTENSIONS, uploadedMime) ||
      MIME_EXTENSIONS[uploadedMime] !== pathExtension
    ) {
      await admin.storage.from(BUCKET).remove([path]);
      return json({ error: "Format atau ukuran file tidak diizinkan." }, 400);
    }

    const oldProofPath = order.payment_proof_path as string | null;
    const { error: updateError } = await admin.from("ditapaja_orders").update({
      payment_method: paymentMethod,
      payment_reference: paymentReference || null,
      payment_proof_path: path,
      payment_status: "pending_verification",
      updated_at: new Date().toISOString(),
    }).eq("id", order.id).eq("customer_user_id", authData.user.id);

    if (updateError) {
      console.error("Payment proof order update failed:", updateError);
      await admin.storage.from(BUCKET).remove([path]);
      return json({ error: "Bukti tersimpan, tetapi status pesanan gagal diperbarui. Hubungi tim DiTapAja." }, 500);
    }

    if (oldProofPath && oldProofPath !== path) {
      await admin.storage.from(BUCKET).remove([oldProofPath]);
    }
    return json({ success: true });
  } catch (error) {
    console.error("Customer payment proof error:", error);
    return json({ error: "Terjadi kesalahan saat mengirim bukti pembayaran." }, 500);
  }
}
