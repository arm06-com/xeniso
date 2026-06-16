import ToolLayout from "@/components/ToolLayout";
import ToolFaq from "@/components/ToolFaq";
import BackgroundRemover from "@/components/BackgroundRemover";

export default function BackgroundRemoverPage() {
  return (
    <ToolLayout
      title="Free Background Remover"
      description="Remove image backgrounds instantly online for free."
    >
      <BackgroundRemover />

      <ToolFaq
        items={[
          {
            question:
              "Is this Background Remover free?",
            answer:
              "Yes. Xeniso Background Remover is completely free to use.",
          },
          {
            question:
              "Are my images uploaded?",
            answer:
              "No. Your images are processed directly in your browser. We do not store your files.",
          },
          {
            question:
              "Which image formats are supported?",
            answer:
              "JPG, PNG and WebP images are supported.",
          },
        ]}
      />
    </ToolLayout>
  );
}