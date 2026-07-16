import type { Metadata } from "next";
import PdfConverter from "@/components/PdfConverter";
import ToolLayout from "@/components/ToolLayout";
import ToolFaq from "@/components/ToolFaq";

export const metadata: Metadata = {
  title: "JPG to PDF Converter Online | Convert Images to PDF",
  description: "Convert JPG, PNG, and WebP images into a single PDF file online for free with Xeniso.",
  alternates: {
    canonical: "/tools/jpg-to-pdf",
  },
};

export default function Page() {
  return (
    <ToolLayout
      title="JPG to PDF Converter"
      description="Convert JPG, PNG and WebP images into a single PDF."
    >
      <PdfConverter />

      <ToolFaq
        items={[
          {
            question:
              "Is this JPG to PDF converter free?",
            answer:
              "Yes, it is completely free.",
          },
          {
            question:
              "Are my files uploaded?",
            answer:
              "No. Everything happens in your browser.",
          },
        ]}
      />
    </ToolLayout>
  );
}