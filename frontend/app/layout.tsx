import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Chores & Rewards",
  description: "Daily chores, parent approvals, points, and weekly payouts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
