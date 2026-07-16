import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer | Xeniso",
  description:
    "Read Xeniso's disclaimer regarding the use of our free online tools and services.",
  alternates: {
    canonical: "/disclaimer",
  },
};

export default function DisclaimerPage() {
  const updatedDate = "June 2026";

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">

      {/* Header */}
      <section>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-black">
          Disclaimer
        </h1>

        <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">
          Last Updated: {updatedDate}
        </p>

      </section>

      {/* Content */}
      <div className="mt-10 sm:mt-12 space-y-8 sm:space-y-10 text-gray-700 leading-relaxed sm:leading-8">

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            General Information
          </h2>

          <p>
            The information, tools, and services provided by
            Xeniso are offered for general informational and
            productivity purposes only.
          </p>

          <p className="mt-4">
            While we strive to provide accurate and reliable
            services, we make no guarantees regarding the
            completeness, accuracy, reliability, suitability,
            or availability of any information or functionality
            on this website.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Use at Your Own Risk
          </h2>

          <p>
            Your use of Xeniso and its tools is entirely at
            your own risk.
          </p>

          <p className="mt-4">
            Users are responsible for reviewing and verifying
            all outputs generated through our services before
            relying on them for personal, educational,
            professional, or legal purposes.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            No Professional Advice
          </h2>

          <p>
            Xeniso does not provide legal, financial,
            accounting, medical, or other professional advice.
          </p>

          <p className="mt-4">
            Any information presented on this website should
            not be interpreted as professional guidance.
            Users should consult qualified professionals when
            appropriate.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            File Processing Disclaimer
          </h2>

          <p>
            Although many Xeniso tools process files locally
            within your browser, we recommend maintaining
            backups of important documents and images before
            using our services.
          </p>

          <p className="mt-4">
            Xeniso shall not be responsible for any data loss,
            corruption, or unintended modifications resulting
            from the use of our tools.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Third-Party Content and Links
          </h2>

          <p>
            Xeniso may include advertisements, external links,
            or references to third-party services.
          </p>

          <p className="mt-4">
            We do not control or endorse the content,
            practices, or policies of third-party websites,
            and we are not responsible for their actions.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Advertising Disclaimer
          </h2>

          <p>
            Xeniso may display advertisements through
            third-party advertising networks such as
            Google AdSense.
          </p>

          <p className="mt-4">
            The appearance of advertisements does not imply
            endorsement of the advertised products,
            services, or companies.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Limitation of Liability
          </h2>

          <p>
            To the fullest extent permitted by applicable law,
            Xeniso and its owners shall not be liable for any
            direct, indirect, incidental, consequential, or
            special damages arising from the use of, or inability
            to use, our website or services.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Changes to This Disclaimer
          </h2>

          <p>
            We reserve the right to modify this Disclaimer at
            any time without prior notice.
          </p>

          <p className="mt-4">
            Updated versions will be published on this page
            with a revised effective date.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Contact Us
          </h2>

          <p>
            If you have any questions regarding this
            Disclaimer, please contact us through our
            Contact page.
          </p>

        </section>

      </div>

    </main>
  );
}