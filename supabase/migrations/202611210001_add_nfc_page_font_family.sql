-- Add selectable typography to custom NFC landing pages.
alter table public.nfc_card_pages
  add column if not exists font_family text not null default 'Manrope';

alter table public.nfc_card_pages
  drop constraint if exists nfc_card_pages_font_family_check;

alter table public.nfc_card_pages
  add constraint nfc_card_pages_font_family_check
  check (font_family in ('Manrope', 'DM Sans', 'Arial', 'Georgia'));
