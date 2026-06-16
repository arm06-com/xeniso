import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://xeniso.com";

  const routes = [
    "",

    // Main Pages
    "/tools",
    "/categories",

    // Company Pages
    "/about",
    "/contact",

    // Legal Pages
    "/privacy-policy",
    "/terms-of-service",
    "/disclaimer",

    // Tool Pages
    "/tools/pdf-compressor",
    "/tools/pdf-splitter",
    "/tools/image-compressor",
    "/tools/image-converter",
    "/tools/image-resizer",
    "/tools/background-remover",
    "/tools/qr-code-generator",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,

    lastModified: new Date(),

    changeFrequency: route === ""
      ? "daily"
      : "weekly",

    priority:
      route === ""
        ? 1.0
        : route.startsWith("/tools/")
        ? 0.9
        : 0.8,
  }));
}