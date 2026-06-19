import { Metadata } from "next";

import Link from "next/link";
import { blogPosts } from "@/data/blogPosts";

export const metadata: Metadata = {
  title: "Blog | Xeniso",
  description:
    "Learn tips, tutorials, and guides for PDFs, images, and productivity tools.",
};

export default function BlogPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-16">

      <section className="text-center">

        <h1 className="text-5xl font-bold text-black">
          Xeniso Blog
        </h1>

        <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
          Tutorials, tips, and guides to help you work
          smarter with PDFs, images, and online tools.
        </p>

      </section>

      <section className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8">

        {blogPosts.map((post) => (
          <article
            key={post.slug}
            className="border rounded-3xl p-8 hover:shadow-lg transition"
          >
            <span className="inline-block px-3 py-1 bg-gray-100 text-black rounded-full text-sm">
              {post.category}
            </span>

            <h2 className="mt-4 text-2xl font-bold text-black">
              {post.title}
            </h2>

            <p className="mt-4 text-gray-600">
              {post.excerpt}
            </p>

            <div className="mt-6 flex justify-between text-sm text-gray-500">
              <span>{post.date}</span>
              <span>{post.readTime}</span>
            </div>

            <Link
              href={`/blog/${post.slug}`}
              className="inline-block mt-6 font-medium hover:underline text-shadow-green-800"
            >
              Read More →
            </Link>

          </article>
        ))}

      </section>

    </main>
  );
}