-- Superadmin-only operational notifications and WhatsApp delivery state.
-- All events are generated inside PostgreSQL so Auth/Admin API and guest checkout
-- paths cannot bypass notification creation.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.superadmin_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null check (char_length(event_key) between 1 and 300),
  event_type text not null check (event_type in (
    'account_created',
    'order_created',
    'payment_proof_submitted',
    'payment_approved',
    'payment_rejected',
    'payment_refunded',
    'order_cancelled',
    'order_status_changed',
    'shipping_updated'
  )),
  severity text not null check (severity in ('info', 'important', 'critical')),
  title text not null check (char_length(title) <= 160),
  message text not null check (char_length(message) <= 2000),
  entity_type text,
  entity_id uuid,
  action_url text not null default '/admin/notifications',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  whatsapp_eligible boolean not null default false,
  whatsapp_status text not null default 'skipped' check (whatsapp_status in (
    'skipped', 'pending', 'processing', 'sent', 'delivered', 'read', 'failed'
  )),
  whatsapp_attempts smallint not null default 0 check (whatsapp_attempts between 0 and 10),
  whatsapp_next_attempt_at timestamptz not null default now(),
  whatsapp_locked_until timestamptz,
  whatsapp_provider_message_id text,
  whatsapp_last_error text,
  whatsapp_sent_at timestamptz,
  whatsapp_delivered_at timestamptz,
  whatsapp_read_at timestamptz,
  constraint superadmin_notifications_recipient_event_unique unique (recipient_id, event_key)
);

create index if not exists superadmin_notifications_recipient_created_idx
  on public.superadmin_notifications (recipient_id, created_at desc);
create index if not exists superadmin_notifications_unread_idx
  on public.superadmin_notifications (recipient_id, created_at desc)
  where read_at is null;
create index if not exists superadmin_notifications_whatsapp_queue_idx
  on public.superadmin_notifications (whatsapp_next_attempt_at, created_at)
  where whatsapp_eligible is true and whatsapp_status in ('pending', 'failed');
create index if not exists superadmin_notifications_provider_message_idx
  on public.superadmin_notifications (whatsapp_provider_message_id)
  where whatsapp_provider_message_id is not null;

alter table public.superadmin_notifications enable row level security;
alter table public.superadmin_notifications replica identity full;
revoke all on table public.superadmin_notifications from anon, authenticated;
grant select on table public.superadmin_notifications to authenticated;

drop policy if exists "Superadmins read their own notifications" on public.superadmin_notifications;
create policy "Superadmins read their own notifications"
  on public.superadmin_notifications
  for select
  to authenticated
  using (
    recipient_id = (select auth.uid())
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin'
  );

alter publication supabase_realtime add table public.superadmin_notifications;

create or replace function private.create_superadmin_notification(
  p_event_key text,
  p_event_type text,
  p_severity text,
  p_title text,
  p_message text,
  p_entity_type text,
  p_entity_id uuid,
  p_action_url text,
  p_metadata jsonb,
  p_whatsapp_eligible boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if p_event_key is null or p_event_type is null or p_severity is null
     or p_title is null or p_message is null then
    return;
  end if;

  insert into public.superadmin_notifications (
    recipient_id, event_key, event_type, severity, title, message,
    entity_type, entity_id, action_url, metadata, whatsapp_eligible, whatsapp_status
  )
  select
    u.id,
    p_event_key,
    p_event_type,
    p_severity,
    left(p_title, 160),
    left(p_message, 2000),
    p_entity_type,
    p_entity_id,
    coalesce(nullif(p_action_url, ''), '/admin/notifications'),
    coalesce(p_metadata, '{}'::jsonb),
    coalesce(p_whatsapp_eligible, false),
    case when coalesce(p_whatsapp_eligible, false) then 'pending' else 'skipped' end
  from auth.users as u
  where u.raw_app_meta_data ->> 'role' = 'superadmin'
    and u.deleted_at is null
  on conflict (recipient_id, event_key) do nothing;
end;
$function$;

revoke all on function private.create_superadmin_notification(text, text, text, text, text, text, uuid, text, jsonb, boolean)
  from public, anon, authenticated, service_role;

create or replace function private.notify_superadmins_on_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_label text;
  v_account_type text;
begin
  v_label := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'username'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    case
      when coalesce(new.email, '') like '%@accounts.ditapaja.invalid' then null
      else nullif(btrim(new.email), '')
    end,
    'Akun baru'
  );

  v_account_type := coalesce(
    nullif(new.raw_user_meta_data ->> 'account_type', ''),
    case when coalesce(new.email, '') like '%@accounts.ditapaja.invalid' then 'username' else 'email' end
  );

  perform private.create_superadmin_notification(
    'account-created:' || new.id::text,
    'account_created',
    'info',
    'Akun baru dibuat',
    v_label || ' baru terdaftar di DiTapAja.',
    'user',
    new.id,
    '/admin/users',
    jsonb_build_object(
      'account_type', v_account_type,
      'created_at', new.created_at
    ),
    false
  );

  return new;
end;
$function$;

drop trigger if exists superadmin_notify_auth_user_created on auth.users;
create trigger superadmin_notify_auth_user_created
  after insert on auth.users
  for each row
  execute function private.notify_superadmins_on_auth_user_created();

create or replace function private.notify_superadmins_on_order_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_total numeric;
  v_customer text;
  v_product text;
begin
  v_total := coalesce(new.unit_price, 0)::numeric * coalesce(new.quantity, 1)
    + coalesce(new.shipping_cost, 0);
  v_customer := coalesce(nullif(btrim(new.customer_name), ''), 'Pelanggan');
  v_product := coalesce(nullif(btrim(new.product_name), ''), 'Produk');

  if tg_op = 'INSERT' then
    perform private.create_superadmin_notification(
      'order-created:' || new.id::text,
      'order_created',
      'important',
      'Pesanan baru masuk',
      v_customer || ' memesan ' || v_product || ' × ' || new.quantity::text
        || '. Total Rp' || round(v_total)::bigint::text || '.',
      'order',
      new.id,
      '/admin/orders',
      jsonb_build_object(
        'customer_name', v_customer,
        'product_name', v_product,
        'quantity', new.quantity,
        'total', round(v_total)::bigint
      ),
      true
    );
    return new;
  end if;

  if old.payment_status is distinct from new.payment_status
     and new.payment_status = 'pending_verification' then
    perform private.create_superadmin_notification(
      'payment-proof:' || new.id::text || ':' || coalesce(new.payment_proof_path, new.updated_at::text),
      'payment_proof_submitted',
      'critical',
      'Bukti pembayaran perlu diperiksa',
      v_customer || ' mengirim bukti pembayaran untuk pesanan #' || upper(left(new.id::text, 8))
        || '. Total Rp' || round(v_total)::bigint::text || '.',
      'order',
      new.id,
      '/admin/orders',
      jsonb_build_object(
        'customer_name', v_customer,
        'product_name', v_product,
        'quantity', new.quantity,
        'total', round(v_total)::bigint,
        'payment_method', new.payment_method
      ),
      true
    );
  elsif old.payment_status is distinct from new.payment_status
        and new.payment_status = 'paid' then
    perform private.create_superadmin_notification(
      'payment-approved:' || new.id::text || ':' || coalesce(new.paid_at, new.updated_at)::text,
      'payment_approved',
      'important',
      'Pembayaran telah disetujui',
      'Pembayaran pesanan #' || upper(left(new.id::text, 8)) || ' telah ditandai lunas.',
      'order',
      new.id,
      '/admin/orders',
      jsonb_build_object('customer_name', v_customer, 'total', round(v_total)::bigint),
      true
    );
  elsif old.payment_status is distinct from new.payment_status
        and old.payment_status = 'pending_verification'
        and new.payment_status = 'unpaid' then
    perform private.create_superadmin_notification(
      'payment-rejected:' || new.id::text || ':' || coalesce(new.updated_at, now())::text,
      'payment_rejected',
      'important',
      'Pembayaran dikembalikan',
      'Pembayaran pesanan #' || upper(left(new.id::text, 8)) || ' dikembalikan ke status belum lunas.',
      'order',
      new.id,
      '/admin/orders',
      jsonb_build_object('customer_name', v_customer, 'total', round(v_total)::bigint),
      true
    );
  elsif old.payment_status is distinct from new.payment_status
        and new.payment_status = 'refunded' then
    perform private.create_superadmin_notification(
      'payment-refunded:' || new.id::text || ':' || coalesce(new.updated_at, now())::text,
      'payment_refunded',
      'important',
      'Pembayaran dikembalikan',
      'Pesanan #' || upper(left(new.id::text, 8)) || ' telah ditandai refund.',
      'order',
      new.id,
      '/admin/orders',
      jsonb_build_object('customer_name', v_customer, 'total', round(v_total)::bigint),
      true
    );
  end if;

  if old.status is distinct from new.status and new.status = 'cancelled' then
    perform private.create_superadmin_notification(
      'order-cancelled:' || new.id::text || ':' || coalesce(new.updated_at, now())::text,
      'order_cancelled',
      'important',
      'Pesanan dibatalkan',
      'Pesanan #' || upper(left(new.id::text, 8)) || ' milik ' || v_customer || ' dibatalkan.',
      'order',
      new.id,
      '/admin/orders',
      jsonb_build_object('customer_name', v_customer, 'product_name', v_product),
      true
    );
  elsif old.status is distinct from new.status
        and new.status in ('confirmed', 'processing', 'shipped', 'completed') then
    perform private.create_superadmin_notification(
      'order-status:' || new.id::text || ':' || new.status || ':' || coalesce(new.updated_at, now())::text,
      'order_status_changed',
      case when new.status in ('shipped', 'completed') then 'important' else 'info' end,
      'Status pesanan diperbarui',
      'Pesanan #' || upper(left(new.id::text, 8)) || ' kini berstatus ' || new.status || '.',
      'order',
      new.id,
      '/admin/orders',
      jsonb_build_object('customer_name', v_customer, 'from', old.status, 'to', new.status),
      new.status = 'shipped'
    );
  end if;

  if old.shipping_courier is distinct from new.shipping_courier
     or old.tracking_number is distinct from new.tracking_number
     or old.shipping_cost is distinct from new.shipping_cost then
    if new.shipping_courier is not null or new.tracking_number is not null then
      perform private.create_superadmin_notification(
        'shipping-updated:' || new.id::text || ':' || coalesce(new.updated_at, now())::text,
        'shipping_updated',
        'info',
        'Informasi pengiriman diperbarui',
        'Informasi pengiriman pesanan #' || upper(left(new.id::text, 8)) || ' telah diperbarui.',
        'order',
        new.id,
        '/admin/orders',
        jsonb_build_object('courier', new.shipping_courier, 'has_tracking_number', new.tracking_number is not null),
        false
      );
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists superadmin_notify_order_changes on public.ditapaja_orders;
create trigger superadmin_notify_order_changes
  after insert or update of status, payment_status, payment_proof_path, shipping_courier, tracking_number, shipping_cost
  on public.ditapaja_orders
  for each row
  execute function private.notify_superadmins_on_order_change();

create or replace function public.claim_superadmin_notification_deliveries(p_limit integer default 10)
returns setof public.superadmin_notifications
language plpgsql
security definer
set search_path = ''
as $function$
begin
  return query
  with candidates as (
    select n.id
    from public.superadmin_notifications as n
    where n.whatsapp_eligible is true
      and n.whatsapp_status in ('pending', 'failed')
      and n.whatsapp_attempts < 5
      and n.whatsapp_next_attempt_at <= now()
      and (n.whatsapp_locked_until is null or n.whatsapp_locked_until < now())
    order by n.created_at asc
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 10), 25))
  )
  update public.superadmin_notifications as n
  set whatsapp_status = 'processing',
      whatsapp_locked_until = now() + interval '3 minutes',
      whatsapp_attempts = n.whatsapp_attempts + 1
  from candidates as c
  where n.id = c.id
  returning n.*;
end;
$function$;

revoke all on function public.claim_superadmin_notification_deliveries(integer)
  from public, anon, authenticated;
grant execute on function public.claim_superadmin_notification_deliveries(integer) to service_role;
