import type { Metadata } from "next";
import OrderForm from "../components/order-form";

export const metadata: Metadata = {
  title: "Pemesanan Kartu NFC | DiTapAja",
  description: "Pesan kartu NFC DiTapAja langsung di website, transfer ke rekening tujuan, dan unggah bukti pembayaran untuk konfirmasi via WhatsApp.",
  robots: { index: false, follow: true },
};

export default async function OrderPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const params = await searchParams;
  return <OrderForm initialProduct={params.product ?? "signature"} />;
}
