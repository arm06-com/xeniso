import Link from "next/link";

const toolCategories = [
  {
    title: "PDF Tools",
    tools: [
      {
        name: "PDF Compressor",
        description:
          "Reduce PDF file size while maintaining quality.",
        href: "/tools/pdf-compressor",
      },
      {
        name: "PDF Splitter",
        description:
          "Extract selected pages or split PDFs instantly.",
        href: "/tools/pdf-splitter",
      },
      {
        name: "Merge PDF",
        description:
          "Merge multiple PDF in a single pdf file in a minute.",
        href: "/tools/merge-pdf",
      },
    ],
  },

  {
    title: "Image Tools",
    tools: [
      {
        name: "Image Compressor",
        description:
          "Compress JPG, PNG and WebP images.",
        href: "/tools/image-compressor",
      },
      {
        name: "Image Converter",
        description:
          "Convert images between JPG, PNG and WebP.",
        href: "/tools/image-converter",
      },
      {
        name: "Image Resizer",
        description:
          "Resize images for social media and custom sizes.",
        href: "/tools/image-resizer",
      },
      {
        name: "Background Remover",
        description:
          "Remove image backgrounds automatically.",
        href: "/tools/background-remover",
      },
    ],
  },

  {
    title: "Utility Tools",
    tools: [
      {
        name: "QR Code Generator",
        description:
          "Generate QR codes for URLs, text and more.",
        href: "/tools/qr-generator",
      },
    ],
  },
];

export default function ToolsPage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-16">

      {/* Header */}
      <section className="text-center">

        <h1 className="text-5xl font-bold text-black">
          All Xeniso Tools
        </h1>

        <p className="mt-4 text-gray-600 max-w-3xl mx-auto">
          Discover all free PDF, image and productivity
          tools designed to simplify your workflow.
        </p>

      </section>

      {/* Categories */}
      <div className="mt-16 space-y-16">

        {toolCategories.map((category) => (

          <section key={category.title}>

            <h2 className="text-3xl font-bold mb-8 text-black">
              {category.title}
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

              {category.tools.map((tool) => (

                <Link
                  key={tool.href}
                  href={tool.href}
                  className="bg-white border rounded-2xl p-8 hover:shadow-xl transition"
                >

                  <h3 className="text-xl font-semibold text-black">
                    {tool.name}
                  </h3>

                  <p className="mt-3 text-gray-600">
                    {tool.description}
                  </p>

                  <div className="mt-6 font-medium text-black">
                    Open Tool →
                  </div>

                </Link>

              ))}

            </div>

          </section>

        ))}

      </div>

      <section className="mt-24 bg-gray-50 rounded-3xl p-12 text-center">

        <h2 className="text-3xl font-bold text-black">
            More Tools Coming Soon
        </h2>

        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            We're continuously expanding Xeniso with new
            productivity tools to help you work smarter.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">

            <span className="bg-white border px-4 py-2 rounded-full text-black">
            PDF to JPG
            </span>

            <span className="bg-white border px-4 py-2 rounded-full text-black">
            JPG to PDF
            </span>

            <span className="bg-white border px-4 py-2 rounded-full text-black">
            PDF to Word
            </span>

            <span className="bg-white border px-4 py-2 rounded-full text-black">
            Image Cropper
            </span>

            <span className="bg-white border px-4 py-2 rounded-full text-black">
            Image Upscaler
            </span>

            <span className="bg-white border px-4 py-2 rounded-full text-black">
            Signature Generator
            </span>

            <span className="bg-white border px-4 py-2 rounded-full text-black">
            Seal Maker
            </span>

        </div>

      </section>

    </main>
  );
}