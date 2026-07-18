import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CHW Companion | Resilient Health Tools",
  description:
    "Offline-first companion for CHWs at CHPS compounds in Northern Ghana — danger-sign checklists, deterministic risk tiers, and referral tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-clay selection:text-white">
        {children}
      </body>
    </html>
  );
}
