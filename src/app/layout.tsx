import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Synagent",
  description: "Build with AI. Refine with Humans.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
