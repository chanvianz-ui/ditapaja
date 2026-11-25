-- Aggregate per-user NFC card metrics in PostgreSQL to avoid two count queries per card.
-- The API route calls this only after verifyAdmin() with its server-side service role client.
CREATE OR REPLACE FUNCTION public.get_admin_user_card_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO ''
AS $$
  WITH card_metrics AS (
    SELECT
      c.id,
      c.card_name,
      c.public_code,
      c.destination_url,
      c.active,
      c.created_at,
      count(t.id) FILTER (WHERE t.event_type = 'tap')::bigint AS total_taps,
      count(t.id) FILTER (WHERE t.event_type = 'review_click')::bigint AS total_review_clicks
    FROM public.nfc_cards c
    LEFT JOIN public.tap_events t
      ON t.card_id = c.id
      AND t.event_type IN ('tap', 'review_click')
    WHERE c.user_id = p_user_id
    GROUP BY c.id
  ),
  summary AS (
    SELECT
      count(*)::bigint AS total_cards,
      count(*) FILTER (WHERE active IS TRUE)::bigint AS active_cards,
      COALESCE(sum(total_taps), 0)::bigint AS total_taps,
      COALESCE(sum(total_review_clicks), 0)::bigint AS total_review_clicks
    FROM card_metrics
  )
  SELECT jsonb_build_object(
    'stats', jsonb_build_object(
      'totalCards', s.total_cards,
      'activeCards', s.active_cards,
      'totalTaps', s.total_taps,
      'totalReviewClicks', s.total_review_clicks
    ),
    'cards', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', cm.id,
          'card_name', cm.card_name,
          'public_code', cm.public_code,
          'destination_url', cm.destination_url,
          'active', cm.active,
          'created_at', cm.created_at,
          'totalTaps', cm.total_taps,
          'totalReviewClicks', cm.total_review_clicks
        )
        ORDER BY cm.created_at DESC
      )
      FROM card_metrics cm
    ), '[]'::jsonb)
  )
  FROM summary s;
$$;

REVOKE ALL ON FUNCTION public.get_admin_user_card_stats(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_user_card_stats(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_user_card_stats(uuid) TO service_role;

NOTIFY pgrst, 'reload schema';
