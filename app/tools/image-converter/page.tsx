import ToolLayout from "@/components/ToolLayout";
import ToolFaq from "@/components/ToolFaq";
import ImageConverter from "@/components/ImageConverter";

export default function ImageConverterPage() {
  return (
    <ToolLayout
      title="Free Image Converter"
      description="Convert JPG, PNG, and WebP images online for free."
    >
      <ImageConverter />

      <ToolFaq
        items={[
          {
            question: "Is this Image Converter free?",
            answer:
              "Yes, Xeniso Image Converter is completely free.",
          },
          {
            question: "Are my images uploaded?",
            answer:
              "No. Everything happens directly in your browser.",
          },
          {
            question: "Which formats are supported?",
            answer:
              "JPG, PNG, and WebP are supported.",
          },
        ]}
      />
    </ToolLayout>
  );
}