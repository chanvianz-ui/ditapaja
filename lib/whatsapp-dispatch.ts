import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type AdminClient = SupabaseClient<any>;
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

function getConfig() {
  const phone = (process.env.WHATSAPP_ADMIN_PHONE || "").replace(/\D/g, "");
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v27.0";
  const config = {
    accessToken: process.env.WHATSAPP_CLOUD_API_TOKEN || "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    adminPhone: phone,
    templateName: process.env.WHATSAPP_TEMPLATE_NAME || "",
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "id",
    apiVersion,
    baseUrl: process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://ditapaja.web.id",
  };
  const configured = process.env.WHATSAPP_ADMIN_OPT_IN === "true"
    && Boolean(config.accessToken)
    && Boolean(config.phoneNumberId)
    && Boolean(config.templateName)
    && /^\d{8,15}$/.test(config.adminPhone)
    && /^v\d+\.\d+$/.test(config.apiVersion);
  return { ...config, configured };
}

async function updateFailure(
  admin: AdminClient,
  notification: QueuedNotification,
  errorMessage: string,
  transient: boolean
) {
  const attempts = notification.whatsapp_attempts;
  const shouldRetry = transient && attempts < 5;
  const nextAttempt = new Date(Date.now() + retryDelaySeconds(attempts) * 1000).toISOString();
  const { error } = await admin.from("superadmin_notifications").update({
    whatsapp_status: shouldRetry ? "pending" : "failed",
    whatsapp_next_attempt_at: nextAttempt,
    whatsapp_locked_until: null,
    whatsapp_last_error: cleanText(errorMessage, 500),
  }).eq("id", notification.id);
  if (error) throw new Error("Could not save WhatsApp delivery failure: " + error.message);
  return shouldRetry ? "retried" : "failed";
}

async function deliverOne(
  admin: AdminClient,
  notification: QueuedNotification,
  config: ReturnType<typeof getConfig>
) {
  const title = cleanText(notification.title, 120);
  const message = cleanText(notification.message, 700);
  const actionPath = typeof notification.action_url === "string" && /^\/admin(?:\/|$)/.test(notification.action_url)
    ? notification.action_url
    : "/admin/notifications";
  let baseUrl: string;
  try {
    baseUrl = new URL(config.baseUrl).origin;
  } catch {
    baseUrl = "https://ditapaja.web.id";
  }
  const actionUrl = new URL(actionPath, baseUrl).toString();

  try {
    const response = await fetch(
      "https://graph.facebook.com/" + config.apiVersion + "/" + encodeURIComponent(config.phoneNumberId) + "/messages",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + config.accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: config.adminPhone,
          type: "template",
          template: {
            name: config.templateName,
            language: { code: config.templateLanguage },
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
        signal: AbortSignal.timeout(12000),
      }
    );

    const payload = await response.json().catch(() => null) as {
      messages?: Array<{ id?: string }>;
      error?: { message?: string; code?: number };
    } | null;

    if (!response.ok) {
      const errorMessage = payload?.error?.message || "Meta API returned HTTP " + response.status;
      return await updateFailure(admin, notification, errorMessage, response.status === 429 || response.status >= 500);
    }

    const providerMessageId = payload?.messages?.[0]?.id;
    if (!providerMessageId) {
      return await updateFailure(admin, notification, "Meta accepted no message ID in its response.", true);
    }

    const { error } = await admin.from("superadmin_notifications").update({
      whatsapp_status: "sent",
      whatsapp_provider_message_id: providerMessageId,
      whatsapp_sent_at: new Date().toISOString(),
      whatsapp_locked_until: null,
      whatsapp_last_error: null,
    }).eq("id", notification.id);

    if (error) {
      // Meta may already have accepted this message. Do not automatically resend on a DB write failure.
      console.error("WhatsApp accepted a message but delivery state could not be saved:", error);
      return "state_error";
    }
    return "sent";
  } catch (error) {
    return await updateFailure(
      admin,
      notification,
      error instanceof Error ? error.message : "Unknown WhatsApp delivery error.",
      true
    );
  }
}

export async function dispatchSuperadminWhatsAppNotifications(
  existingClient?: AdminClient,
  requestedLimit = 5
) {
  const config = getConfig();
  if (!config.configured) {
    return { configured: false, claimed: 0, sent: 0, retried: 0, failed: 0, stateErrors: 0 };
  }

  let admin = existingClient;
  if (!admin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase server credentials are not configured.");
    admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  }

  const limit = Math.max(1, Math.min(10, Math.trunc(requestedLimit) || 5));
  const { data, error } = await admin.rpc("claim_superadmin_notification_deliveries", { p_limit: limit });
  if (error) throw new Error("Could not claim WhatsApp notifications: " + error.message);

  const outcomes = await Promise.all((data || []).map((notification: QueuedNotification) =>
    deliverOne(admin!, notification, config)
  ));

  return {
    configured: true,
    claimed: (data || []).length,
    sent: outcomes.filter(result => result === "sent").length,
    retried: outcomes.filter(result => result === "retried").length,
    failed: outcomes.filter(result => result === "failed").length,
    stateErrors: outcomes.filter(result => result === "state_error").length,
  };
}
