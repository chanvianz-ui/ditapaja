import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "./components/theme-toggle";

export const metadata: Metadata = {
  title: "DiTapAja — Satu Tap, Lebih Banyak Review",
  description: "Bantu pelanggan menemukan halaman review bisnismu dengan NFC Review Card dari DiTapAja.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" suppressHydrationWarning><body>{children}<ThemeToggle/></body></html>;
}
