-- Re-notify Superadmins when a pending payment proof is replaced.
create or replace function private.notify_superadmins_on_order_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_total numeric;
  v_customer text;
  v_product text;
begin
  v_total := coalesce(new.unit_price, 0)::numeric * coalesce(new.quantity, 1)
    + coalesce(new.shipping_cost, 0);
  v_customer := coalesce(nullif(btrim(new.customer_name), ''), 'Pelanggan');
  v_product := coalesce(nullif(btrim(new.product_name), ''), 'Produk');

  if tg_op = 'INSERT' then
    perform private.create_superadmin_notification(
      'order-created:' || new.id::text,
      'order_created',
      'important',
      'Pesanan baru masuk',
      v_customer || ' memesan ' || v_product || ' × ' || new.quantity::text
        || '. Total Rp' || round(v_total)::bigint::text || '.',
      'order',
      new.id,
      '/admin/orders',
      jsonb_build_object(
        'customer_name', v_customer,
        'product_name', v_product,
        'quantity', new.quantity,
        'total', round(v_total)::bigint
      ),
      true
    );
    return new;
  end if;

  if new.payment_status = 'pending_verification'
     and (
       old.payment_status is distinct from new.payment_status
       or old.payment_proof_path is distinct from new.payment_proof_path
     ) then
    perform private.create_superadmin_notification(
      'payment-proof:' || new.id::text || ':' || coalesce(new.payment_proof_path, 'no-path') || ':' || coalesce(new.updated_at::text, now()::text),
      'payment_proof_submitted',
      'critical',
      'Bukti pembayaran perlu diperiksa',
      v_customer || ' mengirim bukti pembayaran untuk pesanan #' || upper(left(new.id::text, 8))
        || '. Total Rp' || round(v_total)::bigint::text || '.',
      'order',
      new.id,
      '/admin/orders',
      jsonb_build_object(
        'customer_name', v_customer,
        'product_name', v_product,
        'quantity', new.quantity,
        'total', round(v_total)::bigint,
        'payment_method', new.payment_method
      ),
      true
    );
  elsif old.payment_status is distinct from new.payment_status
        and new.payment_status = 'paid' then
    perform private.create_superadmin_notification(
      'payment-approved:' || new.id::text || ':' || coalesce(new.paid_at, new.updated_at)::text,
      'payment_approved',
      'important',
      'Pembayaran telah disetujui',
      'Pembayaran pesanan #' || upper(left(new.id::text, 8)) || ' telah ditandai lunas.',
      'order',
      new.id,
      '/admin/orders',
      jsonb_build_object('customer_name', v_customer, 'total', round(v_total)::bigint),
      true
    );
  elsif old.payment_status is distinct from new.payment_status
        and old.payment_status = 'pending_verification'
        and new.payment_status = 'unpaid' then
    perform private.create_superadmin_notification(
      'payment-rejected:' || new.id::text || ':' || coalesce(new.updated_at, now())::text,
      'payment_rejected',
      'important',
      'Pembayaran dikembalikan',
      'Pembayaran pesanan #' || upper(left(new.id::text, 8)) || ' dikembalikan ke status belum lunas.',
      'order',
      new.id,
      '/admin/orders',
      jsonb_build_object('customer_name', v_customer, 'total', round(v_total)::bigint),
      true
    );
  elsif old.payment_status is distinct from new.payment_status
        and new.payment_status = 'refunded' then
    perform private.create_superadmin_notification(
      'payment-refunded:' || new.id::text || ':' || coalesce(new.updated_at, now())::text,
      'payment_refunded',
      'important',
      'Pembayaran dikembalikan',
      'Pesanan #' || upper(left(new.id::text, 8)) || ' telah ditandai refund.',
      'order',
      new.id,
      '/admin/orders',
      jsonb_build_object('customer_name', v_customer, 'total', round(v_total)::bigint),
      true
    );
  end if;

  if old.status is distinct from new.status and new.status = 'cancelled' then
    perform private.create_superadmin_notification(
      'order-cancelled:' || new.id::text || ':' || coalesce(new.updated_at, now())::text,
      'order_cancelled',
      'important',
      'Pesanan dibatalkan',
      'Pesanan #' || upper(left(new.id::text, 8)) || ' milik ' || v_customer || ' dibatalkan.',
      'order',
      new.id,
      '/admin/orders',
      jsonb_build_object('customer_name', v_customer, 'product_name', v_product),
      true
    );
  elsif old.status is distinct from new.status
        and new.status in ('confirmed', 'processing', 'shipped', 'completed') then
    perform private.create_superadmin_notification(
      'order-status:' || new.id::text || ':' || new.status || ':' || coalesce(new.updated_at, now())::text,
      'order_status_changed',
      case when new.status in ('shipped', 'completed') then 'important' else 'info' end,
      'Status pesanan diperbarui',
      'Pesanan #' || upper(left(new.id::text, 8)) || ' kini berstatus ' || new.status || '.',
      'order',
      new.id,
      '/admin/orders',
      jsonb_build_object('customer_name', v_customer, 'from', old.status, 'to', new.status),
      new.status = 'shipped'
    );
  end if;

  if old.shipping_courier is distinct from new.shipping_courier
     or old.tracking_number is distinct from new.tracking_number
     or old.shipping_cost is distinct from new.shipping_cost then
    if new.shipping_courier is not null or new.tracking_number is not null then
      perform private.create_superadmin_notification(
        'shipping-updated:' || new.id::text || ':' || coalesce(new.updated_at, now())::text,
        'shipping_updated',
        'info',
        'Informasi pengiriman diperbarui',
        'Informasi pengiriman pesanan #' || upper(left(new.id::text, 8)) || ' telah diperbarui.',
        'order',
        new.id,
        '/admin/orders',
        jsonb_build_object('courier', new.shipping_courier, 'has_tracking_number', new.tracking_number is not null),
        false
      );
    end if;
  end if;

  return new;
end;
$function$;

