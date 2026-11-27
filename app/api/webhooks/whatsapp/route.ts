import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET(request: NextRequest) {
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && verifyToken && token === verifyToken && challenge) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const appSecret = process.env.META_APP_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SECRET_KEY;
    if (!appSecret || !supabaseUrl || !serviceKey) return json({ success: false }, 503);

    const length = Number(request.headers.get("content-length") || 0);
    if (length > 1_000_000) return json({ success: false }, 413);

    const rawBody = await request.text();
    if (rawBody.length > 1_000_000) return json({ success: false }, 413);

    const signature = request.headers.get("x-hub-signature-256") || "";
    const match = /^sha256=([a-f0-9]{64})$/i.exec(signature);
    if (!match) return json({ success: false }, 401);

    const expected = createHmac("sha256", appSecret).update(rawBody).digest();
    const received = Buffer.from(match[1], "hex");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      return json({ success: false }, 401);
    }

    const payload = JSON.parse(rawBody) as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            statuses?: Array<{
              id?: string;
              status?: string;
              errors?: Array<{ title?: string; message?: string; code?: number }>;
            }>;
          };
        }>;
      }>;
    };

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        for (const status of change.value?.statuses || []) {
          if (!status.id || !["sent", "delivered", "read", "failed"].includes(status.status || "")) continue;

          const nextStatus = status.status as "sent" | "delivered" | "read" | "failed";
          const now = new Date().toISOString();
          const update: Record<string, unknown> = { whatsapp_status: nextStatus };
          if (nextStatus === "sent") update.whatsapp_sent_at = now;
          if (nextStatus === "delivered" || nextStatus === "read") update.whatsapp_delivered_at = now;
          if (nextStatus === "read") update.whatsapp_read_at = now;
          if (nextStatus === "failed") {
            update.whatsapp_attempts = 5;
            update.whatsapp_locked_until = null;
            update.whatsapp_last_error = (status.errors || []).map(item => item.message || item.title || String(item.code || "")).join("; ").slice(0, 500) || "Meta reported delivery failure.";
          }

          let query = admin.from("superadmin_notifications")
            .update(update)
            .eq("whatsapp_provider_message_id", status.id);
          if (nextStatus === "sent") query = query.in("whatsapp_status", ["processing", "sent"]);
          else if (nextStatus === "delivered") query = query.in("whatsapp_status", ["sent", "delivered"]);
          else if (nextStatus === "read") query = query.in("whatsapp_status", ["sent", "delivered", "read"]);
          else query = query.in("whatsapp_status", ["processing", "sent"]);

          const { error } = await query;
          if (error) console.error("WhatsApp status webhook update failed:", error);
        }
      }
    }

    return json({ success: true });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return json({ success: false }, 400);
  }
}
