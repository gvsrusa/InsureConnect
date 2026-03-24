import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";

import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sora"
});

export const metadata: Metadata = {
  title: "InsureConnect",
  description: "Commercial lines insurance workflow platform"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en" className={sora.variable}>
      <body>{children}</body>
    </html>
  );
}