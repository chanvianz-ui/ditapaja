-- Deliver one WhatsApp message per event even if multiple Superadmins receive dashboard rows.
drop function if exists public.claim_superadmin_notification_deliveries(integer);

create function public.claim_superadmin_notification_deliveries(p_limit integer default 10)
returns table (
  event_key text,
  id uuid,
  title text,
  message text,
  action_url text,
  whatsapp_attempts smallint
)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  return query
  with candidate_keys as (
    select n.event_key, min(n.created_at) as first_created_at
    from public.superadmin_notifications as n
    where n.whatsapp_eligible is true
      and n.whatsapp_attempts < 5
      and n.whatsapp_next_attempt_at <= now()
      and (
        n.whatsapp_status in ('pending', 'failed')
        or (n.whatsapp_status = 'processing' and n.whatsapp_locked_until < now())
      )
    group by n.event_key
    having pg_catalog.pg_try_advisory_xact_lock(pg_catalog.hashtextextended(n.event_key, 0))
    order by min(n.created_at)
    limit greatest(1, least(coalesce(p_limit, 10), 25))
  ),
  claimed as (
    update public.superadmin_notifications as n
    set whatsapp_status = 'processing',
        whatsapp_locked_until = now() + interval '3 minutes',
        whatsapp_attempts = n.whatsapp_attempts + 1
    from candidate_keys as c
    where n.event_key = c.event_key
      and n.whatsapp_eligible is true
      and n.whatsapp_attempts < 5
      and n.whatsapp_next_attempt_at <= now()
      and (
        n.whatsapp_status in ('pending', 'failed')
        or (n.whatsapp_status = 'processing' and n.whatsapp_locked_until < now())
      )
    returning n.event_key, n.id, n.title, n.message, n.action_url, n.whatsapp_attempts, n.created_at
  )
  select distinct on (claimed.event_key)
    claimed.event_key, claimed.id, claimed.title, claimed.message, claimed.action_url, claimed.whatsapp_attempts
  from claimed
  order by claimed.event_key, claimed.created_at;
end;
$function$;

revoke all on function public.claim_superadmin_notification_deliveries(integer)
  from public, anon, authenticated;
grant execute on function public.claim_superadmin_notification_deliveries(integer) to service_role;
