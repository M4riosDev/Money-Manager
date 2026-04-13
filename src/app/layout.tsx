import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Money Manager",
  description: "Track your expenses, understand your spending.",
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
