# DiTapAja Superadmin Notifications

This feature is restricted to users whose trusted Supabase `app_metadata.role` is `superadmin`.

## Event coverage

Database triggers create durable notifications for:
- Every newly created Auth account, including self-signups and accounts created from the Superadmin panel.
- New orders.
- Payment proof submissions requiring manual review.
- Payment approval, rejection, and refund status changes.
- Order cancellation and important order-status changes.
- Shipping detail changes.

Regular users do not receive these notifications and cannot read or modify the notification table.

## WhatsApp delivery

The dashboard notification center works without Meta credentials. WhatsApp delivery remains queued until all required environment variables are configured.

The recipient is the admin's personal WhatsApp number. The sender must be a separate business number registered with the official WhatsApp Business Platform Cloud API.

Add these variables to the **Production** environment of the Vercel project:

| Variable | Purpose |
| --- | --- |
| `WHATSAPP_ADMIN_OPT_IN` | Set to `true` only after the admin has explicitly agreed to receive operational alerts on this number. |
| `WHATSAPP_ADMIN_PHONE` | Recipient number in international digits, e.g. `62812...`; no plus sign, spaces, or punctuation. |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Cloud API sender Phone Number ID (not the recipient number). |
| `WHATSAPP_CLOUD_API_TOKEN` | Long-lived System User access token with WhatsApp messaging permission. Keep secret. |
| `WHATSAPP_TEMPLATE_NAME` | Approved template name, recommended `ditapaja_admin_alert`. |
| `WHATSAPP_TEMPLATE_LANGUAGE` | Template language code; default is `id`. |
| `WHATSAPP_API_VERSION` | Graph API version; default is `v27.0`. |
| `META_APP_SECRET` | Meta app secret used to verify webhook signatures. Keep secret. |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | A long random string used for webhook verification. Keep secret. |
| `APP_BASE_URL` | Public app URL, e.g. `https://ditapaja.web.id`. |

The Supabase server variables already used by the app are also required by the scheduled worker:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

Never prefix secrets with `NEXT_PUBLIC_`. Never commit them to Git.

## Meta setup checklist

1. Sign in at [Meta for Developers](https://developers.facebook.com/) with the business account that will own DiTapAja's WhatsApp sender.
2. Create a Business app and add the WhatsApp product.
3. Create or select a WhatsApp Business Account (WABA) and register a dedicated business sender number. The admin's personal number is the recipient, not the sender.
4. Create a System User token with the required WhatsApp Business permissions. Use a long-lived token for production, not the short-lived getting-started token.
5. Create and submit a **Utility** message template for approval:
   - Name: `ditapaja_admin_alert`
   - Language: Indonesian (`id`)
   - Body: `*{{1}}*\n{{2}}\n\nBuka dashboard: {{3}}`
   - Add examples for all three variables.
6. Add the Meta and WhatsApp values to Vercel Production environment variables, including the admin recipient number and explicit opt-in flag.
7. In Meta webhook configuration, set the callback URL to `https://ditapaja.web.id/api/webhooks/whatsapp`, enter the same `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, verify the callback, and subscribe to the WhatsApp `messages` field.
8. Redeploy Production after changing environment variables. Confirm the Vercel Schedules feature is enabled for the project and that the `superadmin-whatsapp-notifications` schedule is active.
9. Send a controlled test event and verify the dashboard status progresses from pending to sent, then delivered/read through webhook updates.

## Delivery behavior

- Only important and critical events are eligible for WhatsApp. Informational events stay in the dashboard.
- The scheduled worker checks the durable database queue every minute.
- Failed transient API calls retry with backoff, up to five attempts. Permanent errors are surfaced in the dashboard.
- Delivery status is updated from Meta webhook callbacks.
- If Meta is not configured, the database notifications remain available and no message is sent.
- Payment approval remains a manual Superadmin action. Notifications never approve payments automatically.

## Security notes

- The notification table has RLS. Authenticated clients can only read rows addressed to their own user ID and only when their trusted JWT app metadata says `superadmin`.
- Client writes are not granted. Read-state changes and delivery updates go through server-side routes using the existing `verifyAdmin` guard or a private scheduled function.
- The private payment-proof storage bucket is unchanged. Notifications never contain signed proof URLs or file contents.
- Webhook POST requests are verified using `X-Hub-Signature-256` and the Meta App Secret.
