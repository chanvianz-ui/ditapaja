import { createClient } from "@supabase/supabase-js";
import { handleSchedule } from "@vercel/schedules";

export const runtime = "nodejs";

type QueuedNotification = {
  id: string;
  title: string;
  message: string;
  action_url: string;
  whatsapp_attempts: number;
};

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function retryDelaySeconds(attempt: number) {
  return [60, 300, 900, 3600][Math.max(0, Math.min(3, attempt - 1))];
}

async function updateFailure(
  admin: ReturnType<typeof createClient>,
  notification: QueuedNotification,
  errorMessage: string,
  transient: boolean
) {
  const attempts = notification.whatsapp_attempts;
  const shouldRetry = transient && attempts < 5;
  const nextAttempt = new Date(Date.now() + retryDelaySeconds(attempts) * 1000).toISOString();
  await admin.from("superadmin_notifications").update({
    whatsapp_status: shouldRetry ? "pending" : "failed",
    whatsapp_next_attempt_at: nextAttempt,
    whatsapp_locked_until: null,
    whatsapp_last_error: cleanText(errorMessage, 500),
  }).eq("id", notification.id);
}

export const POST = handleSchedule(async (metadata) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase server credentials are not configured.");

  const accessToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const adminPhone = (process.env.WHATSAPP_ADMIN_PHONE || "").replace(/\D/g, "");
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "id";
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v27.0";

  // Keep queued events in the database until the admin explicitly finishes Meta setup.
  if (
    process.env.WHATSAPP_ADMIN_OPT_IN !== "true" ||
    !accessToken ||
    !phoneNumberId ||
    !templateName ||
    !/^\d{8,15}$/.test(adminPhone) ||
    !/^v\d+\.\d+$/.test(apiVersion)
  ) return;

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });

  const { data, error } = await admin.rpc("claim_superadmin_notification_deliveries", { p_limit: 10 });
  if (error) throw new Error("Could not claim WhatsApp notifications: " + error.message);

  const baseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://ditapaja.web.id";

  for (const row of (data || []) as QueuedNotification[]) {
    const notification = row;
    const title = cleanText(notification.title, 120);
    const message = cleanText(notification.message, 700);
    const actionPath = typeof notification.action_url === "string" && /^\/admin(?:\/|$)/.test(notification.action_url)
      ? notification.action_url
      : "/admin/notifications";
    const actionUrl = new URL(actionPath, baseUrl).toString();

    try {
      const response = await fetch(
        "https://graph.facebook.com/" + apiVersion + "/" + encodeURIComponent(phoneNumberId) + "/messages",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: adminPhone,
            type: "template",
            template: {
              name: templateName,
              language: { code: templateLanguage },
              components: [{
                type: "body",
                parameters: [
                  { type: "text", text: title },
                  { type: "text", text: message },
                  { type: "text", text: actionUrl },
                ],
              }],
            },
          }),
          signal: AbortSignal.timeout(15000),
        }
      );

      const payload = await response.json().catch(() => null) as {
        messages?: Array<{ id?: string }>;
        error?: { message?: string; code?: number };
      } | null;

      if (!response.ok) {
        const messageText = payload?.error?.message || "Meta API returned HTTP " + response.status;
        await updateFailure(admin, notification, messageText, response.status === 429 || response.status >= 500);
        continue;
      }

      const providerMessageId = payload?.messages?.[0]?.id;
      if (!providerMessageId) {
        await updateFailure(admin, notification, "Meta accepted no message ID in its response.", true);
        continue;
      }

      const { error: updateError } = await admin.from("superadmin_notifications").update({
        whatsapp_status: "sent",
        whatsapp_provider_message_id: providerMessageId,
        whatsapp_sent_at: new Date().toISOString(),
        whatsapp_locked_until: null,
        whatsapp_last_error: null,
      }).eq("id", notification.id);

      if (updateError) throw updateError;
    } catch (error) {
      await updateFailure(
        admin,
        notification,
        error instanceof Error ? error.message : "Unknown WhatsApp delivery error.",
        true
      );
    }
  }

  console.info("Superadmin WhatsApp dispatch completed", {
    schedule: metadata.name,
    scheduledAt: metadata.scheduledAt.toISOString(),
    claimed: (data || []).length,
  });
});
