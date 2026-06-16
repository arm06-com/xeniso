import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Xeniso",
  description:
    "Learn more about Xeniso and our mission to provide free, fast, and privacy-focused online productivity tools.",
};

export default function AboutPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-16">

      {/* Hero */}
      <section className="text-center">

        <h1 className="text-5xl font-bold">
          About Xeniso
        </h1>

        <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
          Xeniso was created to make everyday digital tasks
          simple, fast, and accessible to everyone.
        </p>

      </section>

      {/* Our Story */}
      <section className="mt-20">

        <h2 className="text-3xl font-bold">
          Our Story
        </h2>

        <div className="mt-6 space-y-6 text-gray-700 leading-8">

          <p>
            In today's digital world, people often need to
            compress PDFs, resize images, convert files,
            generate QR codes, Generate seals,and perform many other tasks.
            Unfortunately, many online tools are either
            complicated, expensive, or require unnecessary
            registrations.
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
      <section className="mt-20 bg-gray-50 rounded-3xl p-10">

        <h2 className="text-3xl font-bold">
          Our Mission
        </h2>

        <p className="mt-6 text-gray-700 leading-8">
          To provide high-quality online productivity tools
          that are fast, secure, and accessible to everyone,
          regardless of technical expertise.
        </p>

      </section>

      {/* Values */}
      <section className="mt-20">

        <h2 className="text-3xl font-bold">
          What We Believe
        </h2>

        <div className="grid md:grid-cols-2 gap-8 mt-10">

          <div className="border rounded-2xl p-8">

            <h3 className="text-xl font-semibold">
              Privacy First
            </h3>

            <p className="mt-4 text-gray-600">
              Many Xeniso tools process files locally within
              your browser, reducing the need to upload files
              to external servers.
            </p>

          </div>

          <div className="border rounded-2xl p-8">

            <h3 className="text-xl font-semibold">
              Simplicity
            </h3>

            <p className="mt-4 text-gray-600">
              We design tools that anyone can use without
              lengthy tutorials or complicated workflows.
            </p>

          </div>

          <div className="border rounded-2xl p-8">

            <h3 className="text-xl font-semibold">
              Accessibility
            </h3>

            <p className="mt-4 text-gray-600">
              Useful digital tools should be available to
              everyone, regardless of budget or experience.
            </p>

          </div>

          <div className="border rounded-2xl p-8">

            <h3 className="text-xl font-semibold">
              Continuous Improvement
            </h3>

            <p className="mt-4 text-gray-600">
              We continuously expand Xeniso with new features
              and tools to better serve our users.
            </p>

          </div>

        </div>

      </section>

      {/* Current Tools */}
      <section className="mt-20">

        <h2 className="text-3xl font-bold">
          Tools Available Today
        </h2>

        <div className="mt-8 flex flex-wrap gap-4">

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
              className="bg-gray-100 px-5 py-3 rounded-full"
            >
              {tool}
            </span>
          ))}

        </div>

      </section>

      {/* Looking Ahead */}
      <section className="mt-20 bg-black text-white rounded-3xl p-12 text-center">

        <h2 className="text-3xl font-bold">
          Looking Ahead
        </h2>

        <p className="mt-6 text-gray-300 max-w-3xl mx-auto leading-8">
          We're just getting started. Xeniso will continue
          expanding with new PDF, image, and productivity
          tools designed to simplify your digital workflow.
        </p>

      </section>

    </main>
  );
}