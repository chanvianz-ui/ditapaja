import type { Metadata } from "next";
import "./globals.css";
import "./styles/interface-v3.css";
import "./styles/experience-v4.css";
import "./styles/experience-v4-consistency.css";
import "./styles/homepage-ui-fixes.css";
import "./styles/auth-page-fixes.css";
import "./styles/design-tokens.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ditapaja.web.id"),
  title: { default: "DiTapAja — Satu Tap, Lebih Banyak Review", template: "%s | DiTapAja" },
  description: "Bantu pelanggan menemukan halaman review bisnismu dengan NFC Review Card dari DiTapAja.",
  openGraph: {
    type: "website", siteName: "DiTapAja", locale: "id_ID",
    title: "DiTapAja — Satu Tap, Lebih Banyak Review",
    description: "NFC Review Card dengan QR Code dan dashboard monitoring tanpa biaya bulanan.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
