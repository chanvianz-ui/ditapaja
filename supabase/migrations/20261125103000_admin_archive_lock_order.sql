-- Keep the lock order consistent with bulk archive: card first, then PIN rows.
CREATE OR REPLACE FUNCTION public.admin_archive_nfc_card_by_pin(
  p_pin_id uuid,
  p_archived_by uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO ''
AS $$
DECLARE
  v_card_id uuid;
BEGIN
  SELECT pin.card_id
  INTO v_card_id
  FROM public.nfc_activation_pins AS pin
  WHERE pin.id = p_pin_id;

  IF NOT FOUND OR v_card_id IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.nfc_cards
  SET archived_at = now(),
      archived_by = p_archived_by
  WHERE id = v_card_id
    AND archived_at IS NULL;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  UPDATE public.nfc_activation_pins
  SET status = 'revoked'
  WHERE card_id = v_card_id
    AND status = 'available';

  RETURN 1;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_archive_nfc_card_by_pin(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_archive_nfc_card_by_pin(uuid, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_archive_nfc_card_by_pin(uuid, uuid) TO service_role;

NOTIFY pgrst, 'reload schema';
