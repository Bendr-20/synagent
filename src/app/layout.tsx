import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Synagent — Launch Your Agent Token",
  description: "The agent aggregator for Base. Launch your token, claim your profile, earn your cred.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
