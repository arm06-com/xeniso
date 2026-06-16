import { ReactNode } from "react";
import AdBanner from "@/components/AdBanner";
import ToolSidebar from "@/components/ToolSidebar";

type ToolLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export default function ToolLayout({
  title,
  description,
  children,
}: ToolLayoutProps) {
  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold">{title}</h1>

        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
          {description}
        </p>
      </section>

      {/* Top Ad */}
      <AdBanner slot="TOP-BANNER" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-10">
          {children}

          {/* Bottom Ad */}
          <AdBanner slot="BOTTOM-BANNER" />
        </div>

        {/* Sidebar */}
        <ToolSidebar />
      </div>
    </main>
  );
}