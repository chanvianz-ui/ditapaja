-- Aggregate Admin overview metrics in PostgreSQL instead of loading every row into the Worker.
-- This endpoint is called only after verifyAdmin() using the server-side service role key.
CREATE OR REPLACE FUNCTION public.get_admin_overview_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  WITH month_window AS (
    SELECT (
      date_trunc('month', now() AT TIME ZONE 'Asia/Jakarta')
      AT TIME ZONE 'Asia/Jakarta'
    ) AS starts_at
  ),
  order_metrics AS (
    SELECT
      count(*)::bigint AS total_orders,
      count(*) FILTER (WHERE o.payment_status = 'paid')::bigint AS paid_orders,
      count(*) FILTER (
        WHERE o.payment_status IN ('unpaid', 'pending_verification')
      )::bigint AS pending_orders,
      COALESCE(sum(
        o.unit_price::numeric * o.quantity + o.shipping_cost
      ) FILTER (WHERE o.payment_status = 'paid'), 0) AS paid_revenue,
      COALESCE(sum(
        o.unit_price::numeric * o.quantity + o.shipping_cost
      ) FILTER (
        WHERE o.payment_status = 'paid'
          AND o.paid_at >= (SELECT starts_at FROM month_window)
      ), 0) AS monthly_revenue
    FROM public.ditapaja_orders o
  ),
  top_products AS (
    SELECT
      o.product_name AS name,
      sum(o.quantity)::bigint AS quantity,
      sum(o.unit_price::numeric * o.quantity) AS revenue
    FROM public.ditapaja_orders o
    WHERE o.payment_status = 'paid'
    GROUP BY o.product_name
    ORDER BY sum(o.quantity) DESC, o.product_name ASC
    LIMIT 5
  )
  SELECT jsonb_build_object(
    'totalUsers', (SELECT count(*)::bigint FROM auth.users),
    'totalCards', (SELECT count(*)::bigint FROM public.nfc_cards),
    'activeCards', (
      SELECT count(*)::bigint FROM public.nfc_cards WHERE active IS TRUE
    ),
    'totalTaps', (
      SELECT count(*)::bigint FROM public.tap_events WHERE event_type = 'tap'
    ),
    'totalReviewClicks', (
      SELECT count(*)::bigint FROM public.tap_events WHERE event_type = 'review_click'
    ),
    'totalOrders', om.total_orders,
    'paidOrders', om.paid_orders,
    'pendingOrders', om.pending_orders,
    'paidRevenue', om.paid_revenue,
    'monthlyRevenue', om.monthly_revenue,
    'topProducts', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'name', tp.name,
        'quantity', tp.quantity,
        'revenue', tp.revenue
      ) ORDER BY tp.quantity DESC, tp.name ASC)
      FROM top_products tp
    ), '[]'::jsonb)
  )
  FROM order_metrics om;
$$;

REVOKE ALL ON FUNCTION public.get_admin_overview_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_overview_stats() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_overview_stats() TO service_role;

NOTIFY pgrst, 'reload schema';
