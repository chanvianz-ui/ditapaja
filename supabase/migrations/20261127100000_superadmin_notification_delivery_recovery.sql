-- Recover notification deliveries if a scheduled invocation stops after claiming a row.
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
      and n.whatsapp_attempts < 5
      and n.whatsapp_next_attempt_at <= now()
      and (
        n.whatsapp_status in ('pending', 'failed')
        or (n.whatsapp_status = 'processing' and n.whatsapp_locked_until < now())
      )
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
