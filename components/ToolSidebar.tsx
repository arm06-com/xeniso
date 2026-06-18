import Link from "next/link";
import AdBanner from "@/components/AdBanner";

export default function ToolSidebar() {
  return (
    <aside className="lg:col-span-1">
      <div className="sticky top-24 space-y-6">

        {/* Related Tools */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 text-black">
            Related Tools
          </h2>

          <div className="space-y-3">
            <Link
              href="/tools/pdf-compressor"
              className="block border rounded-xl p-4 hover:shadow-md transition text-gray-800"
            >
              PDF Compressor
            </Link>
            <Link
              href="/tools/pdf-converter"
              className="block border rounded-xl p-4 hover:shadow-md transition text-gray-800"
            >
              Image to PDF Converter
            </Link>
            <Link
              href="/tools/pdf-splitter"
              className="block border rounded-xl p-4 hover:shadow-md transition text-gray-800"
            >
              PDF Splitter 
            </Link>
            <Link
              href="/tools/image-compressor"
              className="block border rounded-xl p-4 hover:shadow-md transition text-gray-800"
            >
              Image Compressor
            </Link>

            <Link
              href="/tools/image-converter"
              className="block border rounded-xl p-4 hover:shadow-md transition text-gray-800"
            >
              Image Converter
            </Link>

            <Link
              href="/tools/image-resizer"
              className="block border rounded-xl p-4 hover:shadow-md transition text-gray-800"
            >
              Image Resizer
            </Link>

            <Link
              href="/tools/qr-generator"
              className="block border rounded-xl p-4 hover:shadow-md transition text-gray-800"
            >
              QR Code Generator
            </Link>
            <Link
              href="/tools/background-remover"
              className="block border rounded-xl p-4 hover:shadow-md transition text-gray-800"
            >
              Background Remover
            </Link>
            <Link
              href="/tools/seal-maker"
              className="block border rounded-xl p-4 hover:shadow-md transition text-gray-800"
            >
              Seal Maker
            </Link>
          </div>
        </div>

        {/* Sidebar Ad */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <AdBanner
            slot="SIDEBAR-300x250"
            className="my-0"
          />
        </div>

        {/* CTA / More Tools */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-lg text-black">
            More Free Tools
          </h3>

          <p className="text-sm text-gray-600 mt-2">
            Explore free image converters,
            compressors, QR generators, and
            productivity tools to simplify your work.
          </p>

          <Link
            href="/"
            className="inline-block mt-4 text-sm font-medium hover:underline text-black"
          >
            Explore All Tools →
          </Link>
        </div>

      </div>
    </aside>
  );
}