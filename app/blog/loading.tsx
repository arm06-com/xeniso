export default function Loading() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-16">

      <div className="animate-pulse">

        <div className="h-12 bg-gray-200 rounded w-64 mx-auto" />

        <div className="h-6 bg-gray-200 rounded w-96 mx-auto mt-6" />

        <div className="grid md:grid-cols-3 gap-8 mt-16">

          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="border rounded-3xl p-8"
            >
              <div className="h-6 bg-gray-200 rounded w-24" />

              <div className="h-8 bg-gray-200 rounded mt-6" />

              <div className="h-4 bg-gray-200 rounded mt-4" />

              <div className="h-4 bg-gray-200 rounded mt-2" />
            </div>
          ))}

        </div>

      </div>

    </main>
  );
}