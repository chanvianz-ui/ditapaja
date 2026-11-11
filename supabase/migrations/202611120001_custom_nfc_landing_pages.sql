-- DiTapAja Custom NFC Landing Page (MVP)
-- Safe additive migration: does not modify existing NFC card or analytics records.

create table if not exists public.nfc_card_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.nfc_cards(id) on delete cascade,
  is_published boolean not null default false,
  headline text not null default 'Bagikan pengalaman kamu',
  description text not null default 'Terima kasih sudah berkunjung. Kami menghargai ulasan dan dukungan kamu.',
  theme text not null default 'ocean',
  accent_color text not null default '#2563eb',
  button_style text not null default 'solid',
  whatsapp_url text,
  instagram_url text,
  website_url text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint nfc_card_pages_card_unique unique(card_id),
  constraint nfc_card_pages_theme_check check (theme in ('ocean','midnight','rose','forest')),
  constraint nfc_card_pages_button_check check (button_style in ('solid','outline'))
);

create index if not exists nfc_card_pages_user_id_idx on public.nfc_card_pages(user_id);

alter table public.nfc_card_pages enable row level security;

drop policy if exists "Owners manage their NFC landing pages" on public.nfc_card_pages;
create policy "Owners manage their NFC landing pages"
on public.nfc_card_pages for all
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.nfc_cards c
    where c.id = card_id and c.user_id = auth.uid()
  )
);

comment on table public.nfc_card_pages is 'Optional per-card custom landing page settings for DiTapAja. Public reads are performed server-side with the service role after validating an active NFC card.';
