import MergePdf from "@/components/MergePdf";
import ToolLayout from "@/components/ToolLayout";
import ToolFaq from "@/components/ToolFaq";

export default function MergePdfPage()  {
  return (
    <ToolLayout
      title="Merge PDF"
      description="Merge multiple pdf files in a single file"
    >
      <MergePdf />

      <ToolFaq
        items={[
          {
            question:
              "Is this PDF Merge tool free?",
            answer:
              "Yes. You can merge multiple PDF files in a single file for free.",
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