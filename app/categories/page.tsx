import Link from "next/link";

const categories = [
  {
    id: "pdf",
    title: "PDF Tools",
    description:
      "Manage, compress and organize PDF documents efficiently.",
    icon: "📄",
    tools: [
      {
        name: "PDF Compressor",
        href: "/tools/pdf-compressor",
      },
      {
        name: "PDF Splitter",
        href: "/tools/pdf-splitter",
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
    <main className="max-w-7xl mx-auto px-6 py-16">

      {/* Hero */}
      <section className="text-center">

        <h1 className="text-5xl font-bold">
          Browse Categories
        </h1>

        <p className="mt-4 text-gray-600 max-w-3xl mx-auto">
          Discover Xeniso tools organized by category
          to help you work faster and smarter.
        </p>

      </section>

      {/* Categories */}
      <div className="mt-16 space-y-12">

        {categories.map((category) => (

          <section
            key={category.id}
            id={category.id}
            className="bg-white border rounded-3xl p-8 shadow-sm"
          >

            {/* Category Header */}
            <div className="flex items-center gap-4">

              <div className="text-5xl">
                {category.icon}
              </div>

              <div>

                <h2 className="text-3xl font-bold">
                  {category.title}
                </h2>

                <p className="mt-2 text-gray-600">
                  {category.description}
                </p>

              </div>

            </div>

            {/* Tools */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">

              {category.tools.map((tool) => (

                <Link
                  key={tool.href}
                  href={tool.href}
                  className="border rounded-2xl p-6 hover:shadow-lg transition"
                >

                  <h3 className="font-semibold text-lg">
                    {tool.name}
                  </h3>

                  <p className="mt-3 text-sm text-gray-500">
                    Open Tool →
                  </p>

                </Link>

              ))}

            </div>

          </section>

        ))}

      </div>

            {/* Coming Soon */}
      <section className="mt-20 bg-gray-50 rounded-3xl p-12 text-center">

        <h2 className="text-3xl font-bold">
          More Categories Coming Soon
        </h2>

        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
          Xeniso is continuously expanding with new
          tools to improve productivity.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">

          <span className="bg-white border px-4 py-2 rounded-full">
            PDF Conversion
          </span>

          <span className="bg-white border px-4 py-2 rounded-full">
            AI Tools
          </span>

          <span className="bg-white border px-4 py-2 rounded-full">
            Document Editing
          </span>

          <span className="bg-white border px-4 py-2 rounded-full">
            Image Enhancement
          </span>

          <span className="bg-white border px-4 py-2 rounded-full">
            Productivity Tools
          </span>

        </div>

      </section>

    </main>
  );
}