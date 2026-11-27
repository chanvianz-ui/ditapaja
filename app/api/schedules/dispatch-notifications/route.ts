import { handleSchedule } from "@vercel/schedules";
import { dispatchSuperadminWhatsAppNotifications } from "@/lib/whatsapp-dispatch";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = handleSchedule(async (metadata) => {
  const result = await dispatchSuperadminWhatsAppNotifications(undefined, 5);
  console.info("Superadmin WhatsApp scheduled dispatch", {
    schedule: metadata.name,
    scheduledAt: metadata.scheduledAt.toISOString(),
    ...result,
  });
});
