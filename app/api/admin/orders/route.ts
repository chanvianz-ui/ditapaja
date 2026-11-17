import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const orderStatuses = ["pending", "confirmed", "processing", "shipped", "completed", "cancelled"] as const;
const paymentStatuses = ["unpaid", "pending_verification", "paid", "refunded"] as const;

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    const params = request.nextUrl.searchParams;
    const page = Math.max(1, Math.min(10000, Number(params.get("page")) || 1));
    const pageSize = 25;
    const search = (params.get("search") || "").trim().slice(0, 100);
    const status = params.get("status") || "all";
    const paymentStatus = params.get("paymentStatus") || "all";

    let query = auth.supabase!.from("ditapaja_orders")
      .select("id,customer_name,customer_email,customer_phone,product_name,quantity,unit_price,status,payment_status,payment_method,payment_reference,payment_proof_path,shipping_courier,tracking_number,shipping_cost,paid_at,shipped_at,created_at,updated_at,notes", { count: "exact" })
      .order("created_at", { ascending: false });

    if (status !== "all" && (orderStatuses as readonly string[]).includes(status)) query = query.eq("status", status);
    if (paymentStatus !== "all" && (paymentStatuses as readonly string[]).includes(paymentStatus)) query = query.eq("payment_status", paymentStatus);
    if (search) query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%,product_name.ilike.%${search}%`);

    const from = (page - 1) * pageSize;
    const { data, count, error } = await query.range(from, from + pageSize - 1);
    if (error) throw error;

    return NextResponse.json({ success: true, orders: data ?? [], total: count ?? 0, page, pageSize });
  } catch (error) {
    console.error("Admin orders list error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat pesanan." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ success: false, error: "ID pesanan tidak valid." }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.status === "string") {
      if (!(orderStatuses as readonly string[]).includes(body.status)) {
        return NextResponse.json({ success: false, error: "Status pesanan tidak valid." }, { status: 400 });
      }
      updates.status = body.status;
      if (body.status === "shipped") updates.shipped_at = new Date().toISOString();
    }
    if (typeof body.payment_status === "string") {
      if (!(paymentStatuses as readonly string[]).includes(body.payment_status)) {
        return NextResponse.json({ success: false, error: "Status pembayaran tidak valid." }, { status: 400 });
      }
      updates.payment_status = body.payment_status;
      updates.paid_at = body.payment_status === "paid" ? new Date().toISOString() : null;
    }
    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ success: false, error: "Tidak ada perubahan yang dikirim." }, { status: 400 });
    }

    const { data, error } = await auth.supabase!.from("ditapaja_orders")
      .update(updates).eq("id", id)
      .select("id,status,payment_status,paid_at,shipped_at,updated_at").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ success: false, error: "Pesanan tidak ditemukan." }, { status: 404 });

    return NextResponse.json({ success: true, order: data });
  } catch (error) {
    console.error("Admin order update error:", error);
    return NextResponse.json({ success: false, error: "Gagal memperbarui pesanan." }, { status: 500 });
  }
}
