-- Ensure an NFC card can only be assigned to a location owned by the same account.
create or replace function public.validate_nfc_card_location_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.location_id is not null and not exists (
    select 1 from public.business_locations
    where id = new.location_id and user_id = new.user_id
  ) then
    raise exception 'Lokasi bisnis tidak valid untuk pemilik kartu ini.';
  end if;
  return new;
end;
$$;

drop trigger if exists nfc_cards_location_owner_guard on public.nfc_cards;
create trigger nfc_cards_location_owner_guard
before insert or update of location_id,user_id on public.nfc_cards
for each row execute function public.validate_nfc_card_location_owner();
