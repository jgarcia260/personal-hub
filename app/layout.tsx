import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
