-- Archive cards and revoke their still-available activation PINs atomically.
CREATE OR REPLACE FUNCTION public.admin_bulk_archive_nfc_cards(
  p_card_ids uuid[],
  p_archived_by uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO ''
AS $$
DECLARE
  v_archived_count integer;
BEGIN
  IF coalesce(cardinality(p_card_ids), 0) = 0 OR cardinality(p_card_ids) > 200 THEN
    RAISE EXCEPTION 'Expected between 1 and 200 card IDs';
  END IF;

  WITH archived AS (
    UPDATE public.nfc_cards
    SET archived_at = now(),
        archived_by = p_archived_by
    WHERE id = ANY(p_card_ids)
      AND archived_at IS NULL
    RETURNING id
  ),
  revoked AS (
    UPDATE public.nfc_activation_pins AS pin
    SET status = 'revoked'
    WHERE pin.card_id IN (SELECT id FROM archived)
      AND pin.status = 'available'
    RETURNING pin.id
  )
  SELECT count(*)::integer
  INTO v_archived_count
  FROM archived;

  RETURN v_archived_count;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_bulk_archive_nfc_cards(uuid[], uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_bulk_archive_nfc_cards(uuid[], uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_archive_nfc_cards(uuid[], uuid) TO service_role;

NOTIFY pgrst, 'reload schema';
