import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Xeniso | Free online PDF and image tools",
    template: "%s | Xeniso",
  },
  description:
    "Free online PDF and image tools including PDF Compressor, Background Remover, Seal Maker, QR Generator, and more for fast document editing.",
  keywords: [
    "online pdf tools",
    "image tools",
    "pdf converter",
    "background remover",
    "seal maker",
    "qr generator",
    "document tools",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Xeniso | Free online PDF and image tools",
    description:
      "Use Xeniso to convert, compress, scan, and edit PDFs and images with easy online tools.",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Xeniso | Free online PDF and image tools",
    description: "Fast and simple online PDF and image tools for documents, images, and file conversion.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
