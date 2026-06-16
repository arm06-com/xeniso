import ToolSearch from "@/components/ToolSearch";
import Link from "next/link";

const tools = [
  {
    title: "PDF Compressor",
    description: "Reduce PDF file size instantly.",
    href: "/tools/pdf-compressor",
  },
  {
    title: "PDF Splitter",
    description: "Extract pages from PDF files.",
    href: "/tools/pdf-splitter",
  },
  {
    title: "Image Compressor",
    description: "Compress JPG, PNG and WebP.",
    href: "/tools/image-compressor",
  },
  {
    title: "Image Converter",
    description: "Convert images between formats.",
    href: "/tools/image-converter",
  },
  {
    title: "Image Resizer",
    description: "Resize images for any platform.",
    href: "/tools/image-resizer",
  },
  {
    title: "QR Generator",
    description: "Create QR codes in seconds.",
    href: "/tools/qr-generator",
  },
  {
    title: "Background Remover",
    description: "Remove image backgrounds instantly.",
    href: "/tools/background-remover",
  },
  {
    title: "Seal Maker",
    description: "Generate desired seals in seconds for your business.",
    href: "/tools/seal-maker",
  },
];

export default function HomePage() {
  return (
    <main>

      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">

          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Free Online PDF & Image Tools
          </h1>

          <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-600">
            Compress, convert, resize and edit files securely
            in your browser. Fast, private and completely free.
          </p>

          <div className="mt-10 flex justify-center">
            <ToolSearch />
          </div>

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">

            <Link
              href="/tools"
              className="bg-black text-white px-8 py-4 rounded-xl font-medium hover:bg-gray-800 transition"
            >
              Explore Tools
            </Link>

            <Link
              href="/categories"
              className="border border-gray-300 px-8 py-4 rounded-xl font-medium hover:bg-gray-50 transition"
            >
              View Categories
            </Link>

          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-500">

            <span>✓ 100% Free</span>

            <span>✓ Privacy First</span>

            <span>✓ No Registration</span>

            <span>✓ Browser-Based Processing</span>

          </div>

        </div>
      </section>

      {/* Popular Tools */}
      <section className="max-w-7xl mx-auto px-6 py-20">

        <div className="text-center">

          <h2 className="text-4xl font-bold">
            Popular Tools
          </h2>

          <p className="mt-4 text-gray-600">
            Everything you need to work with PDFs and images.
          </p>

        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">

          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="border rounded-2xl p-8 hover:shadow-lg transition bg-white"
            >
              <h3 className="text-xl font-semibold">
                {tool.title}
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

      {/* Statistics */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">

            <div>
              <h3 className="text-4xl font-bold">
                7+
              </h3>

              <p className="mt-2 text-gray-600">
                Free Tools
              </p>
            </div>

            <div>
              <h3 className="text-4xl font-bold">
                100%
              </h3>

              <p className="mt-2 text-gray-600">
                Browser Based
              </p>
            </div>

            <div>
              <h3 className="text-4xl font-bold">
                0
              </h3>

              <p className="mt-2 text-gray-600">
                Registration Required
              </p>
            </div>

            <div>
              <h3 className="text-4xl font-bold">
                ∞
              </h3>

              <p className="mt-2 text-gray-600">
                Productivity
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Why Choose Xeniso */}
      <section className="max-w-7xl mx-auto px-6 py-20">

        <div className="text-center">

          <h2 className="text-4xl font-bold">
            Why Choose Xeniso?
          </h2>

          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            We focus on speed, privacy and simplicity,
            helping you complete everyday tasks without
            unnecessary complexity.
          </p>

        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-14">

          <div className="border rounded-2xl p-8">
            <h3 className="text-xl font-semibold">
              Privacy First
            </h3>

            <p className="mt-3 text-gray-600">
              Your files are processed locally whenever
              possible and never stored permanently.
            </p>
          </div>

          <div className="border rounded-2xl p-8">
            <h3 className="text-xl font-semibold">
              Completely Free
            </h3>

            <p className="mt-3 text-gray-600">
              Use our tools without subscriptions or
              hidden charges.
            </p>
          </div>

          <div className="border rounded-2xl p-8">
            <h3 className="text-xl font-semibold">
              Fast Processing
            </h3>

            <p className="mt-3 text-gray-600">
              Convert and optimize files in seconds
              directly from your browser.
            </p>
          </div>

          <div className="border rounded-2xl p-8">
            <h3 className="text-xl font-semibold">
              Easy to Use
            </h3>

            <p className="mt-3 text-gray-600">
              Clean interfaces designed for everyone,
              from students to professionals.
            </p>
          </div>

        </div>

      </section>

      {/* Trust Section */}
      <section className="bg-black text-white py-16">

        <div className="max-w-7xl mx-auto px-6 text-center">

          <h2 className="text-3xl font-bold">
            Trusted for Everyday Productivity
          </h2>

          <p className="mt-4 text-gray-300 max-w-2xl mx-auto">
            Xeniso helps users simplify PDF and image
            workflows with tools designed for speed,
            privacy and reliability.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-8">

            <span>✓ Secure Processing</span>

            <span>✓ No Watermarks</span>

            <span>✓ No Sign Up</span>

            <span>✓ Mobile Friendly</span>

          </div>

        </div>

      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-20">

        <div className="text-center">
          <h2 className="text-4xl font-bold">
            How Xeniso Works
          </h2>

          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Complete your tasks in three simple steps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-14">

          <div className="text-center border rounded-2xl p-10">
            <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center mx-auto text-xl font-bold">
              1
            </div>

            <h3 className="mt-6 text-xl font-semibold">
              Upload
            </h3>

            <p className="mt-3 text-gray-600">
              Select or drag and drop your files into the tool.
            </p>
          </div>

          <div className="text-center border rounded-2xl p-10">
            <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center mx-auto text-xl font-bold">
              2
            </div>

            <h3 className="mt-6 text-xl font-semibold">
              Process
            </h3>

            <p className="mt-3 text-gray-600">
              Compress, convert, resize or edit instantly.
            </p>
          </div>

          <div className="text-center border rounded-2xl p-10">
            <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center mx-auto text-xl font-bold">
              3
            </div>

            <h3 className="mt-6 text-xl font-semibold">
              Download
            </h3>

            <p className="mt-3 text-gray-600">
              Save your processed files securely to your device.
            </p>
          </div>

        </div>

      </section>

      {/* Categories */}
      <section className="bg-gray-50 py-20">

        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center">
            <h2 className="text-4xl font-bold">
              Browse by Category
            </h2>

            <p className="mt-4 text-gray-600">
              Find the right tools for every task.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-14">

            <div className="bg-white border rounded-2xl p-8 text-center">

              <h3 className="text-2xl font-semibold">
                PDF Tools
              </h3>

              <p className="mt-3 text-gray-600">
                Compress, split and manage PDF documents.
              </p>

            </div>

            <div className="bg-white border rounded-2xl p-8 text-center">

              <h3 className="text-2xl font-semibold">
                Image Tools
              </h3>

              <p className="mt-3 text-gray-600">
                Compress, convert, resize and edit images.
              </p>

            </div>

            <div className="bg-white border rounded-2xl p-8 text-center">

              <h3 className="text-2xl font-semibold">
                Utility Tools
              </h3>

              <p className="mt-3 text-gray-600">
                Generate QR codes, Seals and future productivity tools.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 py-20">

        <div className="text-center">

          <h2 className="text-4xl font-bold">
            Frequently Asked Questions
          </h2>

        </div>

        <div className="mt-12 space-y-8">

          <div>
            <h3 className="font-semibold text-lg">
              Is Xeniso free to use?
            </h3>

            <p className="mt-2 text-gray-600">
              Yes. All current tools are available completely free.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg">
              Do I need to create an account?
            </h3>

            <p className="mt-2 text-gray-600">
              No registration is required to use Xeniso tools.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg">
              Are my files secure?
            </h3>

            <p className="mt-2 text-gray-600">
              Most processing happens locally in your browser and files are not permanently stored.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg">
              Which file formats are supported?
            </h3>

            <p className="mt-2 text-gray-600">
              Xeniso currently supports PDF, JPG, PNG and WebP formats.
            </p>
          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="bg-gray-100 text-black py-20">

        <div className="max-w-4xl mx-auto px-6 text-center">

          <h2 className="text-4xl font-bold">
            Ready to simplify your workflow?
          </h2>

          <p className="mt-4 text-black-300"> 
            Explore Xeniso's growing collection of free productivity tools.
          </p>

          <a
            href="/tools"
            className="inline-block mt-8 bg-blue-500 text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-600 transition"
          >
            Explore All Tools
          </a>

        </div>

      </section>

    </main>
  );
}