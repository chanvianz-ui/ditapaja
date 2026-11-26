import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "ditapaja-payment-proofs";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    const orderId = request.nextUrl.searchParams.get("orderId") || "";
    if (!UUID.test(orderId)) {
      return json({ success: false, error: "ID pesanan tidak valid." }, 400);
    }

    const { data: order, error: orderError } = await auth.supabase!
      .from("ditapaja_orders")
      .select("id,user_id,payment_proof_path")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      console.error("Admin payment proof lookup failed:", orderError);
      return json({ success: false, error: "Bukti pembayaran gagal diperiksa." }, 500);
    }
    if (!order) return json({ success: false, error: "Pesanan tidak ditemukan." }, 404);

    const path = order.payment_proof_path;
    if (
      typeof path !== "string" ||
      !path ||
      typeof order.user_id !== "string" ||
      !path.startsWith(order.user_id + "/" + order.id + "/") ||
      path.includes("..") ||
      path.startsWith("/")
    ) {
      return json({ success: false, error: "File bukti pembayaran tidak valid atau tidak tersedia." }, 404);
    }

    const { data, error: signedUrlError } = await auth.supabase!.storage
      .from(BUCKET)
      .createSignedUrl(path, 90);

    if (signedUrlError || !data?.signedUrl) {
      console.error("Admin payment proof signed URL failed:", signedUrlError);
      return json({ success: false, error: "File bukti pembayaran tidak ditemukan atau tidak dapat diakses." }, 404);
    }

    return json({ success: true, signedUrl: data.signedUrl, expiresIn: 90 });
  } catch (error) {
    console.error("Admin payment proof endpoint error:", error);
    return json({ success: false, error: "Bukti pembayaran sementara tidak dapat dibuka." }, 500);
  }
}
