-- Generate owner notifications for important NFC card changes.
create or replace function public.notify_nfc_card_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  message_text text;
begin
  if old.active is distinct from new.active then
    message_text := case when new.active
      then 'Kartu ' || coalesce(new.card_name, 'NFC') || ' telah diaktifkan.'
      else 'Kartu ' || coalesce(new.card_name, 'NFC') || ' telah dinonaktifkan.'
    end;
    insert into public.ditapaja_notifications(user_id,title,message,notification_type)
    values(new.user_id,'Status kartu berubah',message_text,'card_status');
  elsif old.destination_url is distinct from new.destination_url then
    insert into public.ditapaja_notifications(user_id,title,message,notification_type)
    values(new.user_id,'Link kartu diperbarui','Tujuan Google Maps untuk kartu ' || coalesce(new.card_name,'NFC') || ' telah diperbarui.','card_link');
  elsif old.card_name is distinct from new.card_name then
    insert into public.ditapaja_notifications(user_id,title,message,notification_type)
    values(new.user_id,'Nama kartu diperbarui','Nama kartu berhasil diubah menjadi ' || coalesce(new.card_name,'NFC') || '.','card_name');
  end if;
  return new;
end;
$$;

drop trigger if exists nfc_cards_notification_trigger on public.nfc_cards;
create trigger nfc_cards_notification_trigger
after update of card_name,destination_url,active on public.nfc_cards
for each row execute function public.notify_nfc_card_changes();
