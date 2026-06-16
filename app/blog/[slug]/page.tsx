import { notFound } from "next/navigation";
import { blogPosts } from "@/data/blogPosts";

type Props = {
  params: {
    slug: string;
  };
};

export default function BlogPostPage({
  params,
}: Props) {
  const post = blogPosts.find(
    (p) => p.slug === params.slug
  );

  if (!post) {
    notFound();
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">

      <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm">
        {post.category}
      </span>

      <h1 className="mt-6 text-5xl font-bold">
        {post.title}
      </h1>

      <div className="mt-6 text-gray-500">
        {post.date} • {post.readTime}
      </div>

      <article className="prose prose-lg max-w-none mt-12">

        <p>
          Blog content will go here.
        </p>

        <p>
          Later, we can connect this to Markdown,
          MDX, a CMS, or a database.
        </p>

      </article>

    </main>
  );
}