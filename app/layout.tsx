
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Family Dues Tracker",
  description: "A secure, modern family dues reporting app.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
