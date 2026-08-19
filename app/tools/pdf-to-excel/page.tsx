import type { Metadata } from "next";
import ToolLayout from "@/components/ToolLayout";
import ToolFaq from "@/components/ToolFaq";
import PdfToExcel from "@/components/PdfToExcel";

export const metadata: Metadata = {
  title: "PDF to Excel Converter - Xeniso",
  description: "Convert scanned or text-based PDF documents to an editable Excel worksheet online.",
  alternates: {
    canonical: "/tools/pdf-to-excel",
  },
};

export default function PdfToExcelPage() {
  return (
    <ToolLayout
      title="PDF to Excel"
      description="Upload a PDF document and convert its content into an editable Excel-compatible table."
    >
      <PdfToExcel />

      <ToolFaq
        items={[
          {
            question: "How does PDF to Excel work?",
            answer:
              "The tool reads text from your uploaded PDF and arranges the content into rows and columns that can be edited before export.",
          },
          {
            question: "Can I edit extracted rows?",
            answer:
              "Yes. Every cell appears in an editable table where you can update details before downloading the workbook.",
          },
          {
            question: "Will my files be uploaded?",
            answer:
              "The extraction runs in the browser to keep your document local and private.",
          },
        ]}
      />
    </ToolLayout>
  );
}
