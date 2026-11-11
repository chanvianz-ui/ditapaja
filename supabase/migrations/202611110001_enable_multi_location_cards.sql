-- DiTapAja: enable multi-location card assignment.
-- Safe to run in Supabase SQL Editor. All statements are idempotent.

create table if not exists public.business_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  address text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_locations_user_idx
  on public.business_locations(user_id, created_at desc);

alter table public.nfc_cards
  add column if not exists location_id uuid
  references public.business_locations(id) on delete set null;

create index if not exists nfc_cards_location_idx
  on public.nfc_cards(location_id);

alter table public.business_locations enable row level security;

drop policy if exists "Owners manage their business locations"
  on public.business_locations;
create policy "Owners manage their business locations"
  on public.business_locations
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.validate_nfc_card_location_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.location_id is not null and not exists (
    select 1
    from public.business_locations
    where id = new.location_id
      and user_id = new.user_id
  ) then
    raise exception 'Lokasi bisnis tidak valid untuk pemilik kartu ini.';
  end if;
  return new;
end;
$$;

drop trigger if exists nfc_cards_location_owner_guard
  on public.nfc_cards;
create trigger nfc_cards_location_owner_guard
before insert or update of location_id, user_id
on public.nfc_cards
for each row
execute function public.validate_nfc_card_location_owner();
