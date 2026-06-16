import ImageResizer from "@/components/ImageResizer";
import ToolLayout from "@/components/ToolLayout";
import ToolFaq from "@/components/ToolFaq";

export const metadata = {
  title: "Free Image Resizer Online | Resize Images Instantly - Xeniso",
  description:
    "Resize JPG, PNG, and WebP images online for free. Adjust dimensions manually or use presets for Instagram, Facebook, YouTube, Passport photos, and more. No uploads required.",
  alternates: {
    canonical: "https://xeniso.com/tools/image-resizer",
  },
};

export default function ImageResizerPage() {
  return (
    <ToolLayout
      title="Free Image Resizer"
      description="Resize JPG, PNG, and WebP images instantly. Use custom dimensions or presets for social media and passport photos."
    >
      <ImageResizer />

      <ToolFaq
        items={[
          {
            question: "Is this Image Resizer free?",
            answer:
              "Yes, Xeniso Image Resizer is completely free to use.",
          },
          {
            question: "Are my images uploaded to a server?",
            answer:
              "No. All resizing happens directly in your browser, ensuring privacy and speed.",
          },
          {
            question: "Which image formats are supported?",
            answer:
              "JPG, JPEG, PNG, and WebP images are supported.",
          },
          {
            question: "Can I resize images for Instagram and YouTube?",
            answer:
              "Yes. Built-in presets are available for Instagram, Facebook, YouTube, Twitter, LinkedIn, and Passport photos.",
          },
          {
            question: "Can I maintain the original aspect ratio?",
            answer:
              "Yes. Simply enable the 'Maintain Aspect Ratio' option while resizing.",
          },
        ]}
      />
    </ToolLayout>
  );
}