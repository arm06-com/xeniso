import SealMaker from "@/components/SealMaker";
import ToolFaq from "@/components/ToolFaq";
import ToolLayout from "@/components/ToolLayout";

export const metadata = {
  title: "Seal Maker | Xeniso",
  description:
    "Create professional circular seals online for free. Download as PNG instantly.",
};


export default function SealMakerPage() {
  return (
    <ToolLayout
      title="Seal Maker"
      description="Create custom circular seals online. Download your seal as a transparent PNG."
    >
        <SealMaker />

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