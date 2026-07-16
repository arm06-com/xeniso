import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Xeniso",
  description:
    "Learn how Xeniso protects your privacy and handles your data while using our free online PDF and image tools.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  const updatedDate = "June 2026";

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">

      {/* Header */}
      <section>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-black">
          Privacy Policy
        </h1>

        <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">
          Last Updated: {updatedDate}
        </p>

      </section>

      {/* Content */}
      <div className="mt-10 sm:mt-12 space-y-8 sm:space-y-10 text-gray-700 leading-relaxed sm:leading-8">

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Introduction
          </h2>

          <p>
            Xeniso ("we", "our", or "us") respects your
            privacy. This Privacy Policy explains how
            information is collected, used, and protected
            when you use our website and tools.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Browser-Based Processing
          </h2>

          <p>
            Most Xeniso tools process files directly in
            your browser. Your uploaded files generally
            do not leave your device and are not stored
            on our servers.
          </p>

          <p className="mt-4">
            This approach enhances privacy and allows
            you to use our tools securely.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Information We Collect
          </h2>

          <p>
            We may collect limited information such as:
          </p>

          <ul className="list-disc pl-5 sm:pl-6 mt-4 space-y-2">

            <li>Browser type and version.</li>

            <li>Device information.</li>

            <li>Anonymous usage statistics.</li>

            <li>Pages visited on Xeniso.</li>

          </ul>

          <p className="mt-4">
            We do not intentionally collect sensitive
            personal information through our tools.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Cookies and Analytics
          </h2>

          <p>
            Xeniso may use cookies and analytics services
            to improve website functionality, understand
            user behavior, and enhance user experience.
          </p>

          <p className="mt-4">
            These technologies do not identify you
            personally.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Advertising
          </h2>

          <p>
            We may display advertisements through
            third-party advertising partners such as
            Google AdSense.
          </p>

          <p className="mt-4">
            These partners may use cookies to provide
            relevant advertisements and measure
            advertising performance.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Third-Party Services
          </h2>

          <p>
            Xeniso may rely on trusted third-party
            providers for analytics, advertising,
            and functionality enhancements.
          </p>

          <p className="mt-4">
            We encourage users to review the privacy
            policies of those providers separately.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Data Security
          </h2>

          <p>
            We take reasonable measures to protect
            user information and maintain the security
            of our website.
          </p>

          <p className="mt-4">
            However, no method of electronic transmission
            or storage can guarantee absolute security.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Children's Privacy
          </h2>

          <p>
            Xeniso is not directed toward children
            under the age of 14, and we do not knowingly
            collect personal information from children.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Changes to This Policy
          </h2>

          <p>
            We may update this Privacy Policy from
            time to time. Changes will become effective
            immediately after publication on this page.
          </p>

        </section>

        <section>

          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Contact Us
          </h2>

          <p>
            If you have questions regarding this
            Privacy Policy, please contact us through
            our Contact page.
          </p>

        </section>

      </div>

    </main>
  );
}