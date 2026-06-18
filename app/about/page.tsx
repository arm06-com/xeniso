import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Xeniso",
  description:
    "Learn more about Xeniso and our mission to provide free, fast, and privacy-focused online productivity tools.",
};

export default function AboutPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">

      {/* Hero */}
      <section className="text-center">

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          About Xeniso
        </h1>

        <p className="mt-5 sm:mt-6 text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Xeniso was created to make everyday digital tasks
          simple, fast, and accessible to everyone.
        </p>

      </section>

      {/* Our Story */}
      <section className="mt-12 sm:mt-16 lg:mt-20">

        <h2 className="text-2xl sm:text-3xl font-bold">
          Our Story
        </h2>

        <div className="mt-5 sm:mt-6 space-y-5 sm:space-y-6 text-gray-700 leading-relaxed sm:leading-8">

          <p>
            In today's digital world, people often need to
            compress PDFs, resize images, convert files,
            generate QR codes, create seals, and perform many
            other tasks. Unfortunately, many online tools are
            either complicated, expensive, or require
            unnecessary registrations.
          </p>

          <p>
            Xeniso was built to solve this problem by offering
            free and easy-to-use productivity tools that work
            directly from your browser whenever possible.
          </p>

          <p>
            Our goal is simple: save your time and help you
            complete everyday tasks without technical barriers.
          </p>

        </div>

      </section>

      {/* Mission */}
      <section className="mt-12 sm:mt-16 lg:mt-20 bg-gray-50 rounded-2xl lg:rounded-3xl p-6 sm:p-8 lg:p-10">

        <h2 className="text-2xl sm:text-3xl font-bold">
          Our Mission
        </h2>

        <p className="mt-5 sm:mt-6 text-gray-700 leading-relaxed sm:leading-8">
          To provide high-quality online productivity tools
          that are fast, secure, and accessible to everyone,
          regardless of technical expertise.
        </p>

      </section>

      {/* Values */}
      <section className="mt-12 sm:mt-16 lg:mt-20">

        <h2 className="text-2xl sm:text-3xl font-bold">
          What We Believe
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-8 mt-8 sm:mt-10">

          <div className="border rounded-2xl p-5 sm:p-6 lg:p-8 hover:shadow-md transition-shadow">

            <h3 className="text-lg sm:text-xl font-semibold">
              Privacy First
            </h3>

            <p className="mt-3 sm:mt-4 text-gray-600 leading-relaxed">
              Many Xeniso tools process files locally within
              your browser, reducing the need to upload files
              to external servers.
            </p>

          </div>

          <div className="border rounded-2xl p-5 sm:p-6 lg:p-8 hover:shadow-md transition-shadow">

            <h3 className="text-lg sm:text-xl font-semibold">
              Simplicity
            </h3>

            <p className="mt-3 sm:mt-4 text-gray-600 leading-relaxed">
              We design tools that anyone can use without
              lengthy tutorials or complicated workflows.
            </p>

          </div>

          <div className="border rounded-2xl p-5 sm:p-6 lg:p-8 hover:shadow-md transition-shadow">

            <h3 className="text-lg sm:text-xl font-semibold">
              Accessibility
            </h3>

            <p className="mt-3 sm:mt-4 text-gray-600 leading-relaxed">
              Useful digital tools should be available to
              everyone, regardless of budget or experience.
            </p>

          </div>

          <div className="border rounded-2xl p-5 sm:p-6 lg:p-8 hover:shadow-md transition-shadow">

            <h3 className="text-lg sm:text-xl font-semibold">
              Continuous Improvement
            </h3>

            <p className="mt-3 sm:mt-4 text-gray-600 leading-relaxed">
              We continuously expand Xeniso with new features
              and tools to better serve our users.
            </p>

          </div>

        </div>

      </section>

      {/* Current Tools */}
      <section className="mt-12 sm:mt-16 lg:mt-20">

        <h2 className="text-2xl sm:text-3xl font-bold">
          Tools Available Today
        </h2>

        <div className="mt-6 sm:mt-8 flex flex-wrap gap-3 sm:gap-4">

          {[
            "PDF Compressor",
            "PDF Splitter",
            "Image Compressor",
            "Image Converter",
            "Image Resizer",
            "Background Remover",
            "QR Code Generator",
            "Seal Maker",
          ].map((tool) => (
            <span
              key={tool}
              className="bg-gray-100 px-4 sm:px-5 py-2 sm:py-3 rounded-full text-sm sm:text-base"
            >
              {tool}
            </span>
          ))}

        </div>

      </section>

      {/* Looking Ahead */}
      <section className="mt-12 sm:mt-16 lg:mt-20 bg-black text-white rounded-2xl lg:rounded-3xl p-6 sm:p-8 lg:p-12 text-center">

        <h2 className="text-2xl sm:text-3xl font-bold">
          Looking Ahead
        </h2>

        <p className="mt-5 sm:mt-6 text-gray-300 max-w-3xl mx-auto leading-relaxed sm:leading-8 text-sm sm:text-base lg:text-lg">
          We're just getting started. Xeniso will continue
          expanding with new PDF, image, and productivity
          tools designed to simplify your digital workflow.
        </p>

      </section>

    </main>
  );
}