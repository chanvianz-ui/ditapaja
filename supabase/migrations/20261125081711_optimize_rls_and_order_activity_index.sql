-- Optimize RLS policy evaluation and add the missing order-activity FK index.
-- Policy predicates are unchanged; wrapping auth.uid() in a scalar subquery
-- lets PostgreSQL evaluate it once per statement instead of once per row.

ALTER POLICY "Owners manage their business locations" ON public.business_locations
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

ALTER POLICY "Owners manage their orders" ON public.ditapaja_orders
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

ALTER POLICY "Owners manage their NFC landing pages" ON public.nfc_card_pages
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.nfc_cards c
      WHERE c.id = nfc_card_pages.card_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

ALTER POLICY "Users can delete own NFC cards" ON public.nfc_cards
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can insert own cards" ON public.nfc_cards
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can update own cards" ON public.nfc_cards
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can view own cards" ON public.nfc_cards
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can insert own profile" ON public.profiles
  WITH CHECK (id = (SELECT auth.uid()));

ALTER POLICY "Users can update own profile" ON public.profiles
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

ALTER POLICY "Users can view own profile" ON public.profiles
  USING ((SELECT auth.uid()) = id);

CREATE INDEX IF NOT EXISTS ditapaja_order_activity_user_id_idx
  ON public.ditapaja_order_activity (user_id);

NOTIFY pgrst, 'reload schema';
