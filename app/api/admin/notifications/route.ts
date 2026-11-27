import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

function isWhatsAppConfigured() {
  const phone = (process.env.WHATSAPP_ADMIN_PHONE || "").replace(/\D/g, "");
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v27.0";
  return process.env.WHATSAPP_ADMIN_OPT_IN === "true"
    && /^\d{8,15}$/.test(phone)
    && /^v\d+\.\d+$/.test(apiVersion)
    && Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID)
    && Boolean(process.env.WHATSAPP_CLOUD_API_TOKEN)
    && Boolean(process.env.WHATSAPP_TEMPLATE_NAME);
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    const requestedLimit = Number(request.nextUrl.searchParams.get("limit") || 30);
    const limit = Number.isInteger(requestedLimit) ? Math.max(1, Math.min(50, requestedLimit)) : 30;
    const supabase = auth.supabase!;

    const [{ data, error }, { count, error: countError }, { count: proofCount, error: proofError }] = await Promise.all([
      supabase.from("superadmin_notifications")
        .select("id,event_type,severity,title,message,entity_type,entity_id,action_url,metadata,created_at,read_at,whatsapp_eligible,whatsapp_status,whatsapp_attempts,whatsapp_last_error,whatsapp_sent_at,whatsapp_delivered_at")
        .eq("recipient_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase.from("superadmin_notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", auth.user.id)
        .is("read_at", null),
      supabase.from("ditapaja_orders")
        .select("id", { count: "exact", head: true })
        .eq("payment_status", "pending_verification"),
    ]);

    if (error || countError || proofError) {
      console.error("Superadmin notification query failed:", error || countError || proofError);
      return json({ success: false, error: "Notifikasi belum dapat dimuat." }, 500);
    }

    return json({
      success: true,
      notifications: data ?? [],
      unreadCount: count ?? 0,
      pendingPaymentReviewCount: proofCount ?? 0,
      whatsappConfigured: isWhatsAppConfigured(),
    });
  } catch (error) {
    console.error("Superadmin notifications GET failed:", error);
    return json({ success: false, error: "Terjadi kesalahan saat memuat notifikasi." }, 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    const body = await request.json().catch(() => null) as { action?: unknown; id?: unknown } | null;
    const action = typeof body?.action === "string" ? body.action : "";
    const supabase = auth.supabase!;

    if (action === "mark_all_read") {
      const { error } = await supabase.from("superadmin_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("recipient_id", auth.user.id)
        .is("read_at", null);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "mark_read") {
      const id = typeof body?.id === "string" ? body.id : "";
      if (!UUID.test(id)) return json({ success: false, error: "ID notifikasi tidak valid." }, 400);
      const { error } = await supabase.from("superadmin_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id)
        .eq("recipient_id", auth.user.id)
        .is("read_at", null);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "retry_whatsapp") {
      const id = typeof body?.id === "string" ? body.id : "";
      if (!UUID.test(id)) return json({ success: false, error: "ID notifikasi tidak valid." }, 400);
      if (!isWhatsAppConfigured()) {
        return json({ success: false, error: "WhatsApp belum dikonfigurasi." }, 409);
      }
      const { data, error } = await supabase.from("superadmin_notifications")
        .update({
          whatsapp_status: "pending",
          whatsapp_attempts: 0,
          whatsapp_next_attempt_at: new Date().toISOString(),
          whatsapp_locked_until: null,
          whatsapp_last_error: null,
        })
        .eq("id", id)
        .eq("recipient_id", auth.user.id)
        .eq("whatsapp_eligible", true)
        .eq("whatsapp_status", "failed")
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ success: false, error: "Notifikasi tidak ditemukan atau tidak dapat dicoba ulang." }, 404);
      return json({ success: true });
    }

    return json({ success: false, error: "Aksi notifikasi tidak dikenal." }, 400);
  } catch (error) {
    console.error("Superadmin notifications PATCH failed:", error);
    return json({ success: false, error: "Perubahan notifikasi gagal disimpan." }, 500);
  }
}
