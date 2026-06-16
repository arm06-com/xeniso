import PdfSplitter from "@/components/PdfSplitter";
import ToolLayout from "@/components/ToolLayout";
import ToolFaq from "@/components/ToolFaq";

const faqs = [
  {
    question: "Is Xeniso PDF Splitter free to use?",
    answer:
      "Yes. Xeniso PDF Splitter is completely free to use with no hidden charges or subscriptions.",
  },
  {
    question: "Are my PDF files uploaded to a server?",
    answer:
      "No. Your PDF files are processed directly in your browser. They are never uploaded to our servers.",
  },
  {
    question: "Can I extract specific pages from a PDF?",
    answer:
      "Yes. You can extract individual pages such as 1, 3, and 5, or any combination of pages you need.",
  },
  {
    question: "Can I split a PDF by page range?",
    answer:
      "Yes. Enter a page range such as 2-6 to create a new PDF containing only those pages.",
  },
  {
    question: "Is there a file size limit?",
    answer:
      "Since processing happens in your browser, the limit depends mainly on your device's available memory and performance.",
  },
  {
    question: "Will the quality of my PDF change after splitting?",
    answer:
      "No. Xeniso preserves the original PDF quality when extracting pages.",
  },
];
export default function PdfSplitterPage() {
  return (
    <ToolLayout
        title="Free PDF Splitter"
        description="Split PDF files online for free. Extract page ranges, specific pages, or separate every page into individual PDFs directly in your browser."
        >
        <PdfSplitter />

        <ToolFaq items={faqs} />
    </ToolLayout>
  );
}