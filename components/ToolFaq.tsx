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
    <section>
      <h2 className="text-2xl font-bold">
        {title}
      </h2>

      <div className="mt-6 space-y-6">
        {items.map((item, index) => (
          <div key={index}>
            <h3 className="font-semibold text-black">
              {item.question}
            </h3>

            <p className="text-gray-700 mt-1">
              {item.answer}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}