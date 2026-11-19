import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DÉJÀVU · 市场既视感",
  description:
    "A market déjà-vu engine built on CoinMarketCap data. Six-dimensional market fingerprints, historical nearest neighbours, and what happened next.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
