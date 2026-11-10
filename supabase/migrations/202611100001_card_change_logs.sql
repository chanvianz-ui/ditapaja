-- DiTapAja: audit trail for NFC card changes
-- Run once in Supabase SQL Editor.

create table if not exists public.nfc_card_change_logs (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.nfc_cards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  change_type text not null check (change_type in ('card_name', 'destination_url', 'active')),
  old_values jsonb not null default '{}'::jsonb,
  new_values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists nfc_card_change_logs_user_created_idx
  on public.nfc_card_change_logs(user_id, created_at desc);

alter table public.nfc_card_change_logs enable row level security;

drop policy if exists "Users can read their own card change logs" on public.nfc_card_change_logs;
create policy "Users can read their own card change logs"
  on public.nfc_card_change_logs
  for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.log_nfc_card_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.card_name is distinct from new.card_name then
    insert into public.nfc_card_change_logs(card_id, user_id, change_type, old_values, new_values)
    values (new.id, new.user_id, 'card_name',
      jsonb_build_object('value', old.card_name),
      jsonb_build_object('value', new.card_name));
  end if;

  if old.destination_url is distinct from new.destination_url then
    insert into public.nfc_card_change_logs(card_id, user_id, change_type, old_values, new_values)
    values (new.id, new.user_id, 'destination_url',
      jsonb_build_object('value', old.destination_url),
      jsonb_build_object('value', new.destination_url));
  end if;

  if old.active is distinct from new.active then
    insert into public.nfc_card_change_logs(card_id, user_id, change_type, old_values, new_values)
    values (new.id, new.user_id, 'active',
      jsonb_build_object('value', old.active),
      jsonb_build_object('value', new.active));
  end if;

  return new;
end;
$$;

drop trigger if exists nfc_cards_change_log_trigger on public.nfc_cards;
create trigger nfc_cards_change_log_trigger
after update of card_name, destination_url, active
on public.nfc_cards
for each row
execute function public.log_nfc_card_changes();
