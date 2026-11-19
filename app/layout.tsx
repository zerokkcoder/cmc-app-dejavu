import type { Metadata } from "next";
import "./globals.css";

const title = "DÉJÀVU · 市场既视感";
const description =
  "A market déjà-vu engine built on CoinMarketCap data. Six-dimensional market fingerprints, historical nearest neighbours, and what happened next.";
const liveUrl = "https://cmc-app-dejavu.vercel.app/";

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(liveUrl),
  icons: { icon: "/logo.svg", shortcut: "/logo.svg", apple: "/logo.svg" },
  openGraph: { title, description, url: liveUrl, siteName: "DÉJÀVU", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
