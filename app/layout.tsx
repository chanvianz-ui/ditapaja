import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"DiTapAja — Satu Tap, Lebih Banyak Review",description:"Bantu pelanggan menemukan halaman review bisnismu dengan NFC Review Card dari DiTapAja."};
const themeScript=`try{var saved=localStorage.getItem("ditapaja-theme");var theme=saved==="dark"||saved==="light"?saved:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme}catch(e){document.documentElement.dataset.theme="light"}`;
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="id" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeScript}}/></head><body>{children}</body></html>}
