import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "404 - Page Not Found | Xeniso",
};

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-2xl text-center">

        {/* 404 */}
        <p className="text-8xl md:text-9xl font-bold text-gray-200">
          404
        </p>

        <h1 className="mt-4 text-4xl md:text-5xl font-bold">
          Page Not Found
        </h1>

        <p className="mt-6 text-lg text-gray-600 leading-8">
          Sorry, the page you're looking for doesn't exist,
          may have been moved, or the URL may be incorrect.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition"
          >
            <Home size={20} />
            Back to Home
          </Link>

          <Link
            href="/tools"
            className="inline-flex items-center justify-center gap-2 border border-gray-300 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition"
          >
            <Search size={20} />
            Browse Tools
          </Link>

        </div>

        {/* Helpful Links */}
        <div className="mt-16 border-t pt-8">

          <p className="text-sm text-gray-500 mb-6">
            You might be looking for:
          </p>

          <div className="flex flex-wrap justify-center gap-3">

            {[
              {
                label: "PDF Compressor",
                href: "/tools/pdf-compressor",
              },
              {
                label: "PDF Splitter",
                href: "/tools/pdf-splitter",
              },
              {
                label: "Image Compressor",
                href: "/tools/image-compressor",
              },
              {
                label: "Image Resizer",
                href: "/tools/image-resizer",
              },
              {
                label: "Background Remover",
                href: "/tools/background-remover",
              },
            ].map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="px-4 py-2 bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition"
              >
                {tool.label}
              </Link>
            ))}

          </div>

        </div>

        {/* Go Back */}
        <Link
            href="/"
            className="mt-10 inline-flex items-center gap-2 text-gray-500 hover:text-black transition"
            >
            <ArrowLeft size={18} />
            Return Home
        </Link>

      </div>
    </main>
  );
}