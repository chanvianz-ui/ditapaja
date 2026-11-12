alter table public.ditapaja_orders
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists shipping_courier text,
  add column if not exists tracking_number text,
  add column if not exists shipping_cost integer not null default 0,
  add column if not exists paid_at timestamptz,
  add column if not exists shipped_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.ditapaja_orders'::regclass
      and conname = 'ditapaja_orders_payment_status_check'
  ) then
    alter table public.ditapaja_orders
      add constraint ditapaja_orders_payment_status_check
      check (payment_status in ('unpaid', 'paid', 'refunded'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.ditapaja_orders'::regclass
      and conname = 'ditapaja_orders_shipping_cost_check'
  ) then
    alter table public.ditapaja_orders
      add constraint ditapaja_orders_shipping_cost_check
      check (shipping_cost >= 0);
  end if;
end $$;

create index if not exists ditapaja_orders_user_payment_status_idx
  on public.ditapaja_orders (user_id, payment_status, created_at desc);
