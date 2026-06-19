import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Xeniso",
  description:
    "Read the Terms of Service governing the use of Xeniso's free online PDF and image tools.",
};

export default function TermsOfServicePage() {
  const updatedDate = "June 2026";

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">

      {/* Header */}
      <section>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-black">
          Terms of Service
        </h1>

        <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">
          Last Updated: {updatedDate}
        </p>

      </section>

      {/* Content */}
      <div className="mt-10 sm:mt-12 space-y-8 sm:space-y-10 text-gray-700 leading-relaxed sm:leading-8">

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Acceptance of Terms
          </h2>

          <p>
            By accessing or using Xeniso, you agree to
            comply with and be bound by these Terms of
            Service. If you do not agree with these terms,
            please discontinue use of our website and tools.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Use of Our Services
          </h2>

          <p>
            Xeniso provides free online tools for working
            with PDFs, images, and other productivity tasks.
            You agree to use these services only for lawful
            purposes and in accordance with these terms.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            User Responsibilities
          </h2>

          <p>
            You are responsible for ensuring that:
          </p>

          <ul className="list-disc pl-5 sm:pl-6 mt-4 space-y-2">

            <li>
              You have the necessary rights to upload and process files.
            </li>

            <li>
              Your use of Xeniso complies with applicable laws.
            </li>

            <li>
              You do not use Xeniso for fraudulent, harmful,
              or illegal activities.
            </li>

            <li>
              You do not attempt to interfere with the
              operation or security of the website.
            </li>

          </ul>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Intellectual Property
          </h2>

          <p>
            All website content, branding, design,
            logos, text, and software components of
            Xeniso are owned by or licensed to Xeniso
            and are protected by applicable intellectual
            property laws.
          </p>

          <p className="mt-4">
            You may not reproduce, distribute, or modify
            any part of the website without prior written
            permission, except as permitted by law.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Uploaded Files
          </h2>

          <p>
            Most Xeniso tools process files directly
            within your browser. You retain ownership
            of all files you upload.
          </p>

          <p className="mt-4">
            You are solely responsible for the content
            of files processed through our services.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Service Availability
          </h2>

          <p>
            We strive to provide reliable access to our
            services. However, Xeniso does not guarantee
            uninterrupted availability and may modify,
            suspend, or discontinue features at any time
            without prior notice.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Disclaimer of Warranties
          </h2>

          <p>
            Xeniso is provided on an "as is" and
            "as available" basis without warranties
            of any kind, whether express or implied.
          </p>

          <p className="mt-4">
            We do not guarantee that the services will
            be error-free, secure, or suitable for every
            intended purpose.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Limitation of Liability
          </h2>

          <p>
            To the maximum extent permitted by law,
            Xeniso and its owners shall not be liable
            for any direct, indirect, incidental,
            consequential, or special damages arising
            from the use of our services.
          </p>

          <p className="mt-4">
            Users should maintain backups of important
            files before processing them.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Third-Party Services
          </h2>

          <p>
            Xeniso may use third-party providers for
            analytics, advertising, or other services.
            Use of those services may be subject to
            separate terms and policies.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Changes to These Terms
          </h2>

          <p>
            We reserve the right to modify these Terms
            of Service at any time. Updated versions
            will be published on this page with a revised
            effective date.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Governing Law
          </h2>

          <p>
            These Terms of Service shall be governed by
            and interpreted in accordance with applicable
            laws. Any disputes arising from the use of
            Xeniso shall be resolved through the appropriate
            legal processes.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Contact Us
          </h2>

          <p>
            If you have questions regarding these Terms
            of Service, please contact us through our
            Contact page.
          </p>

        </section>

      </div>

    </main>
  );
}