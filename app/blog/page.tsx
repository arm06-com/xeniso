import Link from "next/link";
import { blogs } from "@/data/blogs";

export default function BlogPage() {
  return (
    <div className="max-w-1200 mx-auto py-12">

      <h1 className="text-4xl font-bold mb-8">
        Blog
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

        {blogs.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="border rounded-xl p-6 hover:shadow-lg"
          >
            <h2 className="font-bold text-xl mb-2">
              {post.title}
            </h2>

            <p className="text-gray-600">
              {post.description}
            </p>
          </Link>
        ))}

      </div>

    </div>
  );
}