type FAQItem = {
  question: string;
  answer: string;
};

type ToolFaqProps = {
  title?: string;
  items: FAQItem[];
};

export default function ToolFaq({
  title = "Frequently Asked Questions",
  items,
}: ToolFaqProps) {
  return (
    <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Title */}
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-black text-center sm:text-left">
        {title}
      </h2>

      {/* FAQ List */}
      <div className="mt-6 sm:mt-8 space-y-5 sm:space-y-6">
        {items.map((item, index) => (
          <div
            key={index}
            className="border-b border-gray-200 pb-4 sm:pb-5 last:border-b-0"
          >
            <h3 className="text-base sm:text-lg font-semibold text-black leading-snug">
              {item.question}
            </h3>

            <p className="text-sm sm:text-base text-gray-600 mt-2 leading-relaxed">
              {item.answer}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}