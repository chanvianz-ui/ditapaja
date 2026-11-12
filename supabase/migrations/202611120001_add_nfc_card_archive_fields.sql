alter table public.nfc_cards
  add column if not exists archived_at timestamptz null,
  add column if not exists archived_by uuid null;

create index if not exists nfc_cards_user_active_archive_idx
  on public.nfc_cards (user_id, archived_at, created_at desc);

create index if not exists nfc_cards_archived_at_idx
  on public.nfc_cards (archived_at)
  where archived_at is not null;
