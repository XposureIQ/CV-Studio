import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATS-Craft Pro | Build a CV that gets read",
  description:
    "Build a single-column, ATS-conscious CV with experience-level writing guidance and exportable Word and PDF documents."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
