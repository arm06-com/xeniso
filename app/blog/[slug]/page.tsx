import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { blogs } from "@/data/blogs";

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const blog = blogs.find(
    (post) => post.slug === slug
  );

  if (!blog) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl py-10 px-4">

      <h1 className="text-4xl font-bold mb-4">
        {blog.title}
      </h1>

      <p className="text-gray-500 mb-8">
        {blog.publishedAt}
      </p>

      <article className="prose max-w-none">
        <ReactMarkdown>{blog.content}</ReactMarkdown>
      </article>

    </div>
  );
}