alter table public.ditapaja_orders
  add column if not exists public_upload_token_hash text,
  add column if not exists public_upload_token_expires_at timestamptz;

create schema if not exists private;

create table if not exists private.public_order_rate_limits (
  key_hash text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0)
);

alter table private.public_order_rate_limits enable row level security;
revoke all on table private.public_order_rate_limits from public, anon, authenticated;

create or replace function public.consume_public_order_rate_limit(p_key_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_key_hash is null or p_key_hash !~ '^[a-f0-9]{64}$' then
    return false;
  end if;

  insert into private.public_order_rate_limits as limits (key_hash, window_started_at, request_count)
  values (p_key_hash, now(), 1)
  on conflict (key_hash) do update
    set window_started_at = case
          when limits.window_started_at < now() - interval '15 minutes' then now()
          else limits.window_started_at
        end,
        request_count = case
          when limits.window_started_at < now() - interval '15 minutes' then 1
          else limits.request_count + 1
        end
  returning request_count into v_count;

  return v_count <= 10;
end;
$$;

revoke all on function public.consume_public_order_rate_limit(text) from public, anon, authenticated;
grant execute on function public.consume_public_order_rate_limit(text) to service_role;
