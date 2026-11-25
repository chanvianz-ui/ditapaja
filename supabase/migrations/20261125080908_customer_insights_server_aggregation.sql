CREATE OR REPLACE FUNCTION public.get_customer_insights(
  p_days integer DEFAULT 7,
  p_card_id uuid DEFAULT NULL::uuid,
  p_location_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path TO ''
AS $function$
with
params as (
  select case when p_days in (7, 30, 90) then p_days else 7 end as days,
    ((now() at time zone 'Asia/Jakarta')::date)::timestamp at time zone 'Asia/Jakarta' as today_start
),
bounds as (
  select days,
    today_start - make_interval(days => days - 1) as current_start,
    today_start + interval '1 day' as current_end,
    today_start - make_interval(days => (days * 2) - 1) as previous_start
  from params
),
scoped_cards as (
  select c.id, coalesce(c.card_name, 'Untitled Card') as card_name, c.location_id
  from public.nfc_cards c
  where c.user_id = (select auth.uid())
    and (p_card_id is null or c.id = p_card_id)
    and (p_location_id is null
      or (p_location_id = '00000000-0000-0000-0000-000000000000'::uuid and c.location_id is null)
      or c.location_id = p_location_id)
),
scoped_events as (
  select e.card_id, e.event_type, e.visitor_hash, e.created_at
  from public.tap_events e
  join scoped_cards c on c.id = e.card_id
  cross join bounds b
  where e.event_type in ('tap', 'review_click')
    and e.created_at >= b.previous_start and e.created_at < b.current_end
),
current_events as (
  select e.* from scoped_events e cross join bounds b
  where e.created_at >= b.current_start and e.created_at < b.current_end
),
previous_events as (
  select e.* from scoped_events e cross join bounds b
  where e.created_at >= b.previous_start and e.created_at < b.current_start
),
daily_counts as (
  select (e.created_at at time zone 'Asia/Jakarta')::date as day,
    count(*) filter (where e.event_type = 'tap')::bigint as taps,
    count(*) filter (where e.event_type = 'review_click')::bigint as clicks
  from current_events e group by 1
),
card_counts as (
  select c.id, c.card_name, c.location_id,
    count(e.*) filter (where e.event_type = 'tap')::bigint as taps,
    count(e.*) filter (where e.event_type = 'review_click')::bigint as clicks,
    count(distinct e.visitor_hash) filter (where e.event_type = 'tap' and e.visitor_hash is not null)::bigint as unique_visitors
  from scoped_cards c left join current_events e on e.card_id = c.id
  group by c.id, c.card_name, c.location_id
),
location_counts as (
  select c.location_id, count(distinct c.id)::bigint as card_count,
    count(e.*) filter (where e.event_type = 'tap')::bigint as taps,
    count(e.*) filter (where e.event_type = 'review_click')::bigint as clicks
  from scoped_cards c left join current_events e on e.card_id = c.id
  group by c.location_id
),
summary as (
  select count(*) filter (where event_type = 'tap')::bigint as taps,
    count(distinct visitor_hash) filter (where event_type = 'tap' and visitor_hash is not null)::bigint as unique_visitors,
    count(*) filter (where event_type = 'review_click')::bigint as clicks
  from current_events
),
previous_summary as (
  select count(*) filter (where event_type = 'tap')::bigint as taps,
    count(*) filter (where event_type = 'review_click')::bigint as clicks
  from previous_events
)
select jsonb_build_object(
  'period_days', b.days,
  'summary', jsonb_build_object('total_taps', s.taps, 'unique_visitors', s.unique_visitors,
    'review_clicks', s.clicks, 'ctr', case when s.taps > 0 then round((s.clicks::numeric / s.taps) * 100, 2) else 0 end),
  'previous', jsonb_build_object('total_taps', ps.taps, 'review_clicks', ps.clicks),
  'daily', coalesce((
    select jsonb_agg(jsonb_build_object('day', to_char(d.day, 'YYYY-MM-DD'),
      'taps', coalesce(dc.taps, 0), 'clicks', coalesce(dc.clicks, 0)) order by d.day)
    from generate_series((b.current_start at time zone 'Asia/Jakarta')::date,
      ((b.current_end - interval '1 day') at time zone 'Asia/Jakarta')::date, interval '1 day') as d(day)
    left join daily_counts dc on dc.day = d.day::date
  ), '[]'::jsonb),
  'cards', coalesce((
    select jsonb_agg(jsonb_build_object('card_id', cc.id, 'card_name', cc.card_name,
      'location_id', cc.location_id, 'taps', cc.taps, 'clicks', cc.clicks,
      'unique_visitors', cc.unique_visitors,
      'ctr', case when cc.taps > 0 then round((cc.clicks::numeric / cc.taps) * 100, 2) else 0 end)
      order by cc.taps desc, cc.card_name) from card_counts cc
  ), '[]'::jsonb),
  'locations', coalesce((
    select jsonb_agg(jsonb_build_object('location_id', lc.location_id, 'card_count', lc.card_count,
      'taps', lc.taps, 'clicks', lc.clicks,
      'ctr', case when lc.taps > 0 then round((lc.clicks::numeric / lc.taps) * 100, 2) else 0 end)
      order by lc.taps desc) from location_counts lc
  ), '[]'::jsonb),
  'insight_comparison', jsonb_build_object(
    'tap_change_pct', case when ps.taps = 0 then null else round(((s.taps - ps.taps)::numeric / ps.taps) * 100, 2) end,
    'click_change_pct', case when ps.clicks = 0 then null else round(((s.clicks - ps.clicks)::numeric / ps.clicks) * 100, 2) end)
)
from bounds b cross join summary s cross join previous_summary ps;
$function$;

REVOKE ALL ON FUNCTION public.get_customer_insights(integer, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_customer_insights(integer, uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_customer_insights(integer, uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
