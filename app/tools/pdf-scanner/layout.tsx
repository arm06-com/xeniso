import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "PDF Scanner Online | Scan Documents to PDF from Phone or Desktop",
  description:
    "Scan documents into PDF quickly with this free online PDF scanner. Capture pages from your phone, adjust edges, and create a clean PDF in seconds.",
  keywords: [
    "pdf scanner",
    "scan to pdf",
    "document scanner",
    "mobile pdf scanner",
    "scan documents online",
    "convert images to pdf",
  ],
  alternates: {
    canonical: "/tools/pdf-scanner",
  },
  openGraph: {
    title: "PDF Scanner Online | Scan Documents to PDF from Phone or Desktop",
    description:
      "Use a free online PDF scanner to capture documents from your phone, adjust page edges, and turn them into a professional PDF.",
    type: "website",
    url: "/tools/pdf-scanner",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Scanner Online | Scan Documents to PDF from Phone or Desktop",
    description:
      "Scan documents to PDF quickly from your phone or desktop with easy edge adjustment and fast uploads.",
  },
};

export default function PdfScannerLayout({ children }: { children: ReactNode }) {
  return children;
}
