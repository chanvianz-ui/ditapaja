import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DiTapAja — Satu Tap, Lebih Banyak Review",
  description: "Bantu pelanggan menemukan halaman review bisnismu dengan NFC Review Card dari DiTapAja.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
