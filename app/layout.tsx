import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Personal Hub",
  description: "Jorge's personal productivity hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main className="pb-20 min-h-screen">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
