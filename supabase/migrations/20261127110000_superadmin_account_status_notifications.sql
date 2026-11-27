-- Track account suspension/reactivation through Supabase Auth Admin API changes.
alter table public.superadmin_notifications
  drop constraint if exists superadmin_notifications_event_type_check;

alter table public.superadmin_notifications
  add constraint superadmin_notifications_event_type_check
  check (event_type in (
    'account_created',
    'account_suspended',
    'account_activated',
    'order_created',
    'payment_proof_submitted',
    'payment_approved',
    'payment_rejected',
    'payment_refunded',
    'order_cancelled',
    'order_status_changed',
    'shipping_updated'
  ));

create or replace function private.notify_superadmins_on_auth_user_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_label text;
  v_suspended boolean;
  v_status text;
begin
  if old.banned_until is not distinct from new.banned_until then
    return new;
  end if;

  v_suspended := new.banned_until is not null and new.banned_until > now();
  v_status := case when v_suspended then 'suspended' else 'active' end;
  v_label := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'username'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    case
      when coalesce(new.email, '') like '%@accounts.ditapaja.invalid' then null
      else nullif(btrim(new.email), '')
    end,
    'Akun pengguna'
  );

  perform private.create_superadmin_notification(
    'account-status:' || new.id::text || ':' || v_status || ':' || coalesce(new.updated_at::text, now()::text),
    case when v_suspended then 'account_suspended' else 'account_activated' end,
    case when v_suspended then 'important' else 'info' end,
    case when v_suspended then 'Akun ditangguhkan' else 'Akun diaktifkan kembali' end,
    v_label || case when v_suspended then ' telah ditangguhkan.' else ' telah diaktifkan kembali.' end,
    'user',
    new.id,
    '/admin/users',
    jsonb_build_object(
      'account_status', v_status,
      'banned_until', new.banned_until
    ),
    v_suspended
  );

  return new;
end;
$function$;

drop trigger if exists superadmin_notify_auth_user_status_change on auth.users;
create trigger superadmin_notify_auth_user_status_change
  after update of banned_until on auth.users
  for each row
  execute function private.notify_superadmins_on_auth_user_status_change();

revoke all on function private.notify_superadmins_on_auth_user_status_change()
  from public, anon, authenticated, service_role;
