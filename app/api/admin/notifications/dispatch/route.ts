import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { dispatchSuperadminWhatsAppNotifications } from "@/lib/whatsapp-dispatch";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const result = await dispatchSuperadminWhatsAppNotifications(auth.supabase!, 5);
    return NextResponse.json(
      { success: true, ...result },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Admin-triggered WhatsApp dispatch failed:", error);
    return NextResponse.json(
      { success: false, error: "Pengiriman WhatsApp belum berhasil diproses." },
      { status: 500, headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  }
}
