-- Prepare NFC cards for PIN-first activation and later account linking.
-- Existing cards keep their current owner; only future PIN-activated cards may be unowned.

alter table public.nfc_cards
  alter column user_id drop not null;

-- A status is shared by many PINs; uniqueness here was preventing bulk PIN inventory.
alter table public.nfc_activation_pins
  drop constraint if exists nfc_activation_pins_status_key;

-- One PIN may be assigned to at most one physical card.
alter table public.nfc_activation_pins
  add constraint nfc_activation_pins_card_id_fkey
  foreign key (card_id) references public.nfc_cards(id)
  on delete restrict;

create unique index if not exists nfc_activation_pins_card_id_unique
  on public.nfc_activation_pins(card_id)
  where card_id is not null;

create index if not exists nfc_activation_pins_status_created_idx
  on public.nfc_activation_pins(status, created_at desc);
