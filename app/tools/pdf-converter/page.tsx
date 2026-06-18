import PdfCompressor from "@/components/PdfConverter";
import ToolLayout from "@/components/ToolLayout";
import ToolFaq from "@/components/ToolFaq";

export default function Page() {
  return (
    <ToolLayout
      title="PDF Converter"
      description="Convert PDF file to Image."
    >
      <PdfCompressor />

      <ToolFaq
        items={[
          {
            question:
              "Is this PDF Conveter free?",
            answer:
              "Yes. You can convert PDF files for free.",
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