import { Metadata } from "next";
import {
  Mail,
  MessageSquare,
  Clock,
  HelpCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | Xeniso",
  description:
    "Get in touch with Xeniso for questions, support, feedback, or business inquiries.",
};

export default function ContactPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">

      {/* Hero */}
      <section className="text-center">

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          Contact Us
        </h1>

        <p className="mt-5 sm:mt-6 text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          We'd love to hear from you. Whether you have
          questions, suggestions, feedback, or business
          inquiries, feel free to reach out.
        </p>

      </section>

      {/* Contact Cards */}
      <section className="mt-12 sm:mt-16 lg:mt-20 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">

        <div className="border rounded-2xl lg:rounded-3xl p-5 sm:p-6 lg:p-8 hover:shadow-md transition-shadow">

          <Mail
            size={40}
            className="mb-5 sm:mb-6"
          />

          <h2 className="text-xl sm:text-2xl font-bold">
            Email Support
          </h2>

          <p className="mt-3 sm:mt-4 text-gray-600 leading-relaxed sm:leading-7">
            For general questions, technical issues,
            or feedback regarding Xeniso tools.
          </p>

          <a
            href="mailto:support@xeniso.com"
            className="inline-block mt-5 sm:mt-6 text-blue-600 font-medium hover:underline break-all"
          >
            support@xeniso.com
          </a>

        </div>

        <div className="border rounded-2xl lg:rounded-3xl p-5 sm:p-6 lg:p-8 hover:shadow-md transition-shadow">

          <MessageSquare
            size={40}
            className="mb-5 sm:mb-6"
          />

          <h2 className="text-xl sm:text-2xl font-bold">
            Business Inquiries
          </h2>

          <p className="mt-3 sm:mt-4 text-gray-600 leading-relaxed sm:leading-7">
            For partnerships, collaborations,
            advertising opportunities, and
            other business-related matters.
          </p>

          <a
            href="mailto:business@xeniso.com"
            className="inline-block mt-5 sm:mt-6 text-blue-600 font-medium hover:underline break-all"
          >
            business@xeniso.com
          </a>

        </div>

      </section>

      {/* Response Information */}
      <section className="mt-12 sm:mt-16 lg:mt-20 bg-gray-50 rounded-2xl lg:rounded-3xl p-6 sm:p-8 lg:p-10">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">

          <div className="flex gap-4">

            <Clock
              size={32}
              className="mt-1 flex-shrink-0"
            />

            <div>

              <h3 className="text-lg sm:text-xl font-semibold">
                Response Time
              </h3>

              <p className="mt-3 text-gray-600 leading-relaxed sm:leading-7">
                We aim to respond to all inquiries
                within 1–3 business days.
              </p>

            </div>

          </div>

          <div className="flex gap-4">

            <HelpCircle
              size={32}
              className="mt-1 flex-shrink-0"
            />

            <div>

              <h3 className="text-lg sm:text-xl font-semibold">
                Before Contacting Us
              </h3>

              <p className="mt-3 text-gray-600 leading-relaxed sm:leading-7">
                Please check our FAQ sections on
                tool pages, as many common questions
                are answered there.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* Feedback CTA */}
      <section className="mt-12 sm:mt-16 lg:mt-20 bg-black text-white rounded-2xl lg:rounded-3xl p-6 sm:p-8 lg:p-12 text-center">

        <h2 className="text-2xl sm:text-3xl font-bold">
          Help Us Improve Xeniso
        </h2>

        <p className="mt-5 sm:mt-6 text-gray-300 max-w-2xl mx-auto leading-relaxed sm:leading-8 text-sm sm:text-base lg:text-lg">
          Your feedback helps us build better tools.
          If you have suggestions for new features
          or future tools, we'd be happy to hear them.
        </p>

        <a
          href="mailto:support@xeniso.com"
          className="inline-flex items-center justify-center mt-8 bg-white hover:bg-gray-200 text-black px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-medium hover:bg-gray-100 transition"
        >
          Send Feedback
        </a>

      </section>

    </main>
  );
}