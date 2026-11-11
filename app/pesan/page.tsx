import type { Metadata } from "next";
import OrderForm from "../components/order-form";

export const metadata: Metadata = {
  title: "Pemesanan Kartu NFC | DiTapAja",
  description: "Kirim detail pemesanan kartu NFC + QR DiTapAja melalui WhatsApp. Dashboard termasuk tanpa biaya bulanan.",
  robots: { index: false, follow: true },
};

export default async function OrderPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const params = await searchParams;
  return <OrderForm initialProduct={params.product ?? "signature"} />;
}
