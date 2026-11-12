
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);

    if (!auth.authorized) {
      return auth.response;
    }

    const supabase = auth.supabase!;

    // Total seluruh pengguna
    let totalUsers = 0;
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data, error } =
        await supabase.auth.admin.listUsers({
          page,
          perPage,
        });

      if (error) throw error;

      totalUsers += data.users.length;

      if (data.users.length < perPage) break;

      page++;
    }

    // Total seluruh kartu NFC
    const { count: totalCards, error: cardsError } =
      await supabase
        .from("nfc_cards")
        .select("*", { count: "exact", head: true });

    if (cardsError) throw cardsError;

    // Total kartu aktif
    const { count: activeCards, error: activeError } =
      await supabase
        .from("nfc_cards")
        .select("*", { count: "exact", head: true })
        .eq("active", true);

    if (activeError) throw activeError;

    // Total tap
    const { count: totalTaps, error: tapsError } =
      await supabase
        .from("tap_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "tap");

    if (tapsError) throw tapsError;

    // Total klik review
    const { count: totalReviewClicks, error: reviewError } =
      await supabase
        .from("tap_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "review_click");

    if (reviewError) throw reviewError;

    // Sales overview: paginate all rows so large order histories are not silently truncated.
    const orders: any[] = [];
    const orderPageSize = 1000;
    let orderOffset = 0;
    while (true) {
      const { data: orderPage, error: ordersError } = await supabase
        .from("ditapaja_orders")
        .select("product_name,quantity,unit_price,shipping_cost,status,payment_status,paid_at,created_at")
        .order("created_at", { ascending: false })
        .range(orderOffset, orderOffset + orderPageSize - 1);

      if (ordersError) throw ordersError;
      const rows = orderPage ?? [];
      orders.push(...rows);
      if (rows.length < orderPageSize) break;
      orderOffset += orderPageSize;
    }
    const totalOrders = orders.length;
    const paidOrders = orders.filter((order: any) => order.payment_status === "paid");
    const pendingOrders = orders.filter((order: any) => ["unpaid", "pending_verification"].includes(order.payment_status));
    const paidRevenue = paidOrders.reduce((sum: number, order: any) =>
      sum + Number(order.unit_price || 0) * Number(order.quantity || 0) + Number(order.shipping_cost || 0), 0);
    // Business reporting month follows Indonesia western time (Asia/Jakarta),
    // independent of the hosting runtime's timezone.
    const now = new Date();
    const jakartaNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const monthStart = new Date(Date.UTC(
      jakartaNow.getUTCFullYear(),
      jakartaNow.getUTCMonth(),
      1,
      -7,
      0,
      0,
      0
    ));
    const monthlyRevenue = paidOrders
      .filter((order: any) => order.paid_at && new Date(order.paid_at).getTime() >= monthStart.getTime())
      .reduce((sum: number, order: any) =>
        sum + Number(order.unit_price || 0) * Number(order.quantity || 0) + Number(order.shipping_cost || 0), 0);
    const topProductsMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const order of paidOrders as any[]) {
      const name = String(order.product_name || "Produk");
      const item = topProductsMap.get(name) || { name, quantity: 0, revenue: 0 };
      item.quantity += Number(order.quantity || 0);
      item.revenue += Number(order.unit_price || 0) * Number(order.quantity || 0);
      topProductsMap.set(name, item);
    }
    const topProducts = [...topProductsMap.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalCards: totalCards ?? 0,
        activeCards: activeCards ?? 0,
        totalTaps: totalTaps ?? 0,
        totalReviewClicks: totalReviewClicks ?? 0,
        totalOrders,
        paidOrders: paidOrders.length,
        pendingOrders: pendingOrders.length,
        paidRevenue,
        monthlyRevenue,
        topProducts,
      },
    });
  } catch (error) {
    console.error("Admin overview error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load admin statistics",
      },
      { status: 500 }
    );
  }
}
