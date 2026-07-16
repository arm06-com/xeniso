import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tool Categories | PDF and Image Utilities",
  description: "Browse Xeniso tool categories to find the best PDF and image utilities for your document editing needs.",
  alternates: {
    canonical: "/categories",
  },
};

const categories = [
  {
    id: "pdf",
    title: "PDF Tools",
    description:
      "Manage, compress and organize PDF documents efficiently.",
    icon: "📄",
    tools: [
      {
        name: "PDF Scanner",
        href: "/tools/pdf-scanner",
      },
      {
        name: "PDF Compressor",
        href: "/tools/pdf-compressor",
      },
      {
        name: "PDF Splitter",
        href: "/tools/pdf-splitter",
      },
      {
        name: "Image to PDF",
        href: "/tools/pdf-converter",
      },
      {
        name: "Merge PDF",
        href: "/tools/merge-pdf",
      },
    ],
  },

  {
    id: "image",
    title: "Image Tools",
    description:
      "Compress, convert, resize and edit images effortlessly.",
    icon: "🖼️",
    tools: [
      {
        name: "Image Compressor",
        href: "/tools/image-compressor",
      },
      {
        name: "Image Converter",
        href: "/tools/image-converter",
      },
      {
        name: "Image Resizer",
        href: "/tools/image-resizer",
      },
      {
        name: "Background Remover",
        href: "/tools/background-remover",
      },
    ],
  },

  {
    id: "utility",
    title: "Utility Tools",
    description:
      "Simple productivity tools for everyday use.",
    icon: "⚙️",
    tools: [
      {
        name: "QR Code Generator",
        href: "/tools/qr-generator",
      },
      {
        name: "Seal Maker",
        href: "/tools/seal-maker",
      },
    ],
  },
];

export default function CategoriesPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">

      {/* Hero */}
      <section className="text-center">

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-black">
          Browse Categories
        </h1>

        <p className="mt-4 text-gray-600 text-sm sm:text-base lg:text-lg max-w-3xl mx-auto leading-relaxed">
          Discover Xeniso tools organized by category
          to help you work faster and smarter.
        </p>

      </section>

      {/* Categories */}
      <div className="mt-10 sm:mt-14 lg:mt-16 space-y-8 sm:space-y-10 lg:space-y-12">

        {categories.map((category) => (

          <section
            key={category.id}
            id={category.id}
            className="bg-white border rounded-2xl lg:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm"
          >

            {/* Category Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">

              <div className="text-4xl sm:text-5xl shrink-0">
                {category.icon}
              </div>

              <div>

                <h2 className="text-2xl sm:text-3xl font-bold text-black">
                  {category.title}
                </h2>

                <p className="mt-2 text-gray-600 text-sm sm:text-base">
                  {category.description}
                </p>

              </div>

            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mt-8 sm:mt-10">

              {category.tools.map((tool) => (

                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group border rounded-2xl p-5 sm:p-6 hover:shadow-lg hover:border-sky-200 transition-all duration-300 bg-white flex flex-col justify-between min-h-35"
                >

                  <h3 className="font-semibold text-base sm:text-lg text-black">
                    {tool.name}
                  </h3>

                  <p className="mt-4 text-sm text-gray-500 group-hover:text-sky-700 transition-colors">
                    Open Tool →
                  </p>

                </Link>

              ))}

            </div>

          </section>

        ))}

      </div>

      {/* Coming Soon */}
      <section className="mt-12 sm:mt-16 lg:mt-20 bg-gray-50 rounded-2xl lg:rounded-3xl p-6 sm:p-8 lg:p-12 text-center">

        <h2 className="text-2xl sm:text-3xl font-bold text-black">
          More Categories Coming Soon
        </h2>

        <p className="mt-4 text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
          Xeniso is continuously expanding with new
          tools to improve productivity.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">

          <span className="bg-white border px-4 py-2 rounded-full text-sm text-black">
            PDF Conversion
          </span>

          <span className="bg-white border px-4 py-2 rounded-full text-sm text-black">
            AI Tools
          </span>

          <span className="bg-white border px-4 py-2 rounded-full text-sm text-black">
            Document Editing
          </span>

          <span className="bg-white border px-4 py-2 rounded-full text-sm text-black">
            Image Enhancement
          </span>

          <span className="bg-white border px-4 py-2 rounded-full text-sm text-black">
            Productivity Tools
          </span>

        </div>

      </section>

    </main>
  );
}