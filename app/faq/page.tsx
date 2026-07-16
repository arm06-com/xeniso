import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | PDF and Image Tool Help",
  description:
    "Get answers to common questions about Xeniso's online PDF scanner, converter, compressor, and other productivity tools.",
  alternates: {
    canonical: "/faq",
  },
};

const faqs = [
  {
    question: "Are Xeniso tools free to use?",
    answer:
      "Yes. All tools available on Xeniso can be used for free without registration.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No. Most Xeniso tools work instantly in your browser without requiring an account.",
  },
  {
    question: "Are my files uploaded to your servers?",
    answer:
      "No. Most Xeniso tools process files directly in your browser. Your files remain private and are not stored on our servers.",
  },
  {
    question: "What file formats are supported?",
    answer:
      "Supported formats depend on the tool. Common formats include JPG, PNG, WebP, PDF, and SVG.",
  },
  {
    question: "Can I use Xeniso on mobile devices?",
    answer:
      "Yes. Xeniso tools are designed to work on desktop, tablet, and mobile devices.",
  },
  {
    question: "Why is my file not processing?",
    answer:
      "Large files, unsupported formats, or browser limitations may cause issues. Try reducing the file size or using a modern browser.",
  },
  {
    question: "Is there a file size limit?",
    answer:
      "Some tools may have practical limits depending on browser memory and device performance.",
  },
  {
    question: "Can I use Xeniso tools for commercial work?",
    answer:
      "Yes. You may use the generated files and outputs for personal and commercial purposes unless otherwise stated.",
  },
  {
    question: "How can I report a bug?",
    answer:
      "You can contact us through our Contact page and provide details about the issue you experienced.",
  },
  {
    question: "Will more tools be added in the future?",
    answer:
      "Yes. We regularly add new online tools and improve existing ones based on user feedback.",
  },
];

export default function FAQPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-black">
          Frequently Asked Questions
        </h1>

        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
          Find answers to common questions about Xeniso and our
          free online tools.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <details
            key={index}
            className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
          >
            <summary className="cursor-pointer font-semibold text-black">
              {faq.question}
            </summary>

            <p className="mt-3 text-gray-600 leading-relaxed">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>

      <section className="mt-12 bg-gray-50 border rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-black">
          Still Need Help?
        </h2>

        <p className="mt-2 text-gray-600">
          If you cannot find the answer you're looking for,
          please visit our Contact page and send us a message.
        </p>
      </section>
    </main>
  );
}