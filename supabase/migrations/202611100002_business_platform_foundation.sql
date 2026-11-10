-- DiTapAja platform foundation: business profiles, locations, notifications, team access and orders.
-- Apply once in Supabase SQL Editor. Existing NFC cards remain valid; location_id is optional.

alter table public.profiles
  add column if not exists business_name text,
  add column if not exists business_category text,
  add column if not exists business_phone text,
  add column if not exists business_address text,
  add column if not exists business_logo_url text,
  add column if not exists onboarding_completed_at timestamptz;

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
  add column if not exists location_id uuid references public.business_locations(id) on delete set null;
create index if not exists nfc_cards_location_idx on public.nfc_cards(location_id);

create table if not exists public.ditapaja_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  notification_type text not null default 'system',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ditapaja_notifications_user_idx
  on public.ditapaja_notifications(user_id, created_at desc);

create table if not exists public.business_team_members (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  member_user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('manager','viewer')),
  created_at timestamptz not null default now(),
  unique(owner_user_id, member_user_id),
  check (owner_user_id <> member_user_id)
);
create index if not exists business_team_owner_idx
  on public.business_team_members(owner_user_id);

create table if not exists public.ditapaja_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  product_name text not null,
  quantity integer not null default 1 check (quantity > 0 and quantity <= 1000),
  unit_price integer not null default 0 check (unit_price >= 0),
  status text not null default 'pending' check (status in ('pending','confirmed','processing','shipped','completed','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ditapaja_orders_user_idx
  on public.ditapaja_orders(user_id, created_at desc);

alter table public.business_locations enable row level security;
alter table public.ditapaja_notifications enable row level security;
alter table public.business_team_members enable row level security;
alter table public.ditapaja_orders enable row level security;

drop policy if exists "Owners manage their business locations" on public.business_locations;
create policy "Owners manage their business locations" on public.business_locations
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users read their notifications" on public.ditapaja_notifications;
create policy "Users read their notifications" on public.ditapaja_notifications
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "Users update their notifications" on public.ditapaja_notifications;
create policy "Users update their notifications" on public.ditapaja_notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Owners manage their team" on public.business_team_members;
create policy "Owners manage their team" on public.business_team_members
  for all to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
drop policy if exists "Members can view their team membership" on public.business_team_members;
create policy "Members can view their team membership" on public.business_team_members
  for select to authenticated using (member_user_id = auth.uid());

drop policy if exists "Owners manage their orders" on public.ditapaja_orders;
create policy "Owners manage their orders" on public.ditapaja_orders
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Keep service-generated notifications writable only by trusted server-side code.
