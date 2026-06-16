import PdfCompressor from "@/components/PdfCompressor";
import ToolLayout from "@/components/ToolLayout";
import ToolFaq from "@/components/ToolFaq";

export default function Page() {
  return (
    <ToolLayout
      title="PDF Compressor"
      description="Reduce PDF file size online for free while keeping good quality."
    >
      <PdfCompressor />

      <ToolFaq
        items={[
          {
            question:
              "Is this PDF Compressor free?",
            answer:
              "Yes. You can compress PDF files for free.",
          },
          {
            question:
              "Do my files get uploaded?",
            answer:
              "No. Your PDFs are processed directly in your browser.",
          },
        ]}
      />
    </ToolLayout>
  );
}