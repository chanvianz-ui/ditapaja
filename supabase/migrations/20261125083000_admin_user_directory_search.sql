-- Search the complete admin account directory in PostgreSQL instead of paging every Auth user into Worker memory.
CREATE OR REPLACE FUNCTION public.search_admin_user_directory(
  p_keyword text,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 20
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  WITH params AS (
    SELECT
      lower(btrim(p_keyword)) AS keyword,
      greatest(coalesce(p_page, 1), 1) AS page,
      least(greatest(coalesce(p_page_size, 20), 1), 100) AS page_size
  ),
  matched AS MATERIALIZED (
    SELECT
      u.id,
      CASE WHEN a.user_id IS NOT NULL THEN '' ELSE coalesce(u.email, '') END AS email,
      a.username,
      CASE WHEN a.user_id IS NOT NULL THEN 'username' ELSE 'email' END AS account_type,
      u.created_at,
      u.last_sign_in_at,
      CASE WHEN a.user_id IS NOT NULL THEN NULL ELSE u.email_confirmed_at END AS email_confirmed_at
    FROM auth.users u
    LEFT JOIN public.account_usernames a ON a.user_id = u.id
    CROSS JOIN params p
    WHERE p.keyword <> ''
      AND (
        position(p.keyword IN lower(u.id::text)) > 0
        OR (a.user_id IS NOT NULL AND position(p.keyword IN lower(a.username)) > 0)
        OR (a.user_id IS NULL AND position(p.keyword IN lower(coalesce(u.email, ''))) > 0)
      )
  ),
  page_rows AS (
    SELECT m.*
    FROM matched m
    ORDER BY m.created_at DESC NULLS LAST, m.id
    OFFSET (SELECT (page - 1) * page_size FROM params)
    LIMIT (SELECT page_size FROM params)
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM matched),
    'users', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'email', email,
          'username', username,
          'accountType', account_type,
          'createdAt', created_at,
          'lastSignInAt', last_sign_in_at,
          'emailConfirmedAt', email_confirmed_at
        )
        ORDER BY created_at DESC NULLS LAST, id
      )
      FROM page_rows
    ), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.search_admin_user_directory(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_admin_user_directory(text, integer, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_admin_user_directory(text, integer, integer) TO service_role;

NOTIFY pgrst, 'reload schema';