-- Username-based accounts created by Super Admin.
-- Supabase Auth still receives an internal, non-deliverable address; users never see or enter it.
create table if not exists public.account_usernames (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  auth_email text not null unique,
  created_at timestamptz not null default now(),
  constraint account_usernames_username_format
    check (username = lower(username) and username ~ '^[a-z0-9][a-z0-9._-]{2,23}$')
);

create unique index if not exists account_usernames_username_unique
  on public.account_usernames (username);

alter table public.account_usernames enable row level security;

revoke all on table public.account_usernames from anon, authenticated;
grant all on table public.account_usernames to service_role;
