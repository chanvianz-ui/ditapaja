import type { Metadata } from "next";
import HomeExperience from "./home-experience";

export const metadata: Metadata = {
  title: "Kartu NFC Review untuk Bisnis — DiTapAja",
  description:
    "Permudah pelanggan membuka halaman review bisnismu lewat satu tap NFC atau scan QR. Termasuk dashboard monitoring tanpa biaya bulanan.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "DiTapAja",
    locale: "id_ID",
    title: "DiTapAja — Satu Tap, Lebih Banyak Review",
    description:
      "NFC Review Card dengan QR Code dan dashboard monitoring tanpa biaya bulanan.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DiTapAja — Satu Tap, Lebih Banyak Review",
    description:
      "Permudah pelanggan membuka halaman review bisnismu lewat satu tap NFC atau scan QR.",
  },
};

export default function HomePage() {
  return <HomeExperience />;
}
