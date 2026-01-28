import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vertex AI Next.js App",
  description: "Next.js application with Google Vertex AI integration",
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
