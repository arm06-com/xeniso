"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import ToolSearch from "@/components/ToolSearch";
import {
  useEffect,
  useRef,
  useState,
} from "react";

const tools = [
  {
    name: "PDF Compressor",
    href: "/tools/pdf-compressor",
  },
  {
    name: "PDF Splitter",
    href: "/tools/pdf-splitter",
  },
  {
    name: "Image Compressor",
    href: "/tools/image-compressor",
  },
  {
    name: "Image Converter",
    href: "/tools/image-converter",
  },
  {
    name: "Image Resizer",
    href: "/tools/image-resizer",
  },
  {
    name: "QR Generator",
    href: "/tools/qr-generator",
  },
  {
    name: "Background Remover",
    href: "/tools/background-remover",
  },
  {
    name: "Seal Maker",
    href: "/tools/seal-maker",
  },
];

export default function Header() {
  const pathname = usePathname();

  const toolsRef =
    useRef<HTMLDivElement>(null);

  const mobileRef =
    useRef<HTMLDivElement>(null);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [toolsOpen, setToolsOpen] =
    useState(false);

  useEffect(() => {
    setToolsOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (
        event: MouseEvent
    ) => {
        const target =
        event.target as Node;

        if (
        toolsRef.current &&
        !toolsRef.current.contains(target)
        ) {
        setToolsOpen(false);
        }

        if (
        mobileRef.current &&
        !mobileRef.current.contains(target)
        ) {
        setMobileOpen(false);
        }
    };

    document.addEventListener(
        "mousedown",
        handleClickOutside
    );

    return () => {
        document.removeEventListener(
        "mousedown",
        handleClickOutside
        );
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6">

        <div className="h-16 flex items-center justify-between">

          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold"
          >
            Xeniso
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">

            <Link
              href="/"
              className={`hover:text-black ${
                pathname === "/"
                  ? "font-semibold text-black"
                  : "text-gray-600"
              }`}
            >
              Home
            </Link>

            {/* Tools Dropdown */}
            <div ref={toolsRef} className="relative">

              <button
                onClick={() => {
                    setMobileOpen(false);

                    setToolsOpen(!toolsOpen);
                }}
                className="flex items-center gap-1 text-gray-600 hover:text-black"
              >
                Tools

                <ChevronDown size={18} />
              </button>

              {toolsOpen && (
                <div className="absolute top-12 left-0 w-64 bg-white border rounded-xl shadow-lg overflow-hidden">

                  {tools.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      onClick={() =>
                        setToolsOpen(
                          false
                        )
                      }
                      className="block px-4 py-3 hover:bg-gray-50"
                    >
                      {tool.name}
                    </Link>
                  ))}

                </div>
              )}

            </div>

            <Link
              href="/categories"
              className={`hover:text-black ${
                pathname ===
                "/categories"
                  ? "font-semibold text-black"
                  : "text-gray-600"
              }`}
            >
              Categories
            </Link>

            <Link
              href="/about"
              className={`hover:text-black ${
                pathname === "/about"
                  ? "font-semibold text-black"
                  : "text-gray-600"
              }`}
            >
              About
            </Link>
            
            <Link
              href="/contact"
              className={`hover:text-black ${
                pathname === "/contact"
                  ? "font-semibold text-black"
                  : "text-gray-600"
              }`}
            >
              Contact
            </Link>
          </nav>

          <div className="hidden lg:block">
            <ToolSearch />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => {
                setToolsOpen(false);

                setMobileOpen(!mobileOpen);
            }}
            className="lg:hidden"
          >
            {mobileOpen ? (
              <X size={28} />
            ) : (
              <Menu size={28} />
            )}
          </button>

        </div>

      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
            ref={mobileRef}
            className="lg:hidden border-t bg-white"
        >

          <div className="px-6 py-4 space-y-4">

            <Link
              href="/"
              onClick={() =>
                setMobileOpen(false)
              }
              className="block"
            >
              Home
            </Link>

            <div>

              <p className="font-semibold mb-2">
                Tools
              </p>

              <div className="space-y-2 pl-4">

                {tools.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={() =>
                      setMobileOpen(false)
                    }
                    className="block text-gray-600"
                  >
                    {tool.name}
                  </Link>
                ))}

              </div>

            </div>

            <Link
              href="/categories"
              onClick={() =>
                setMobileOpen(false)
              }
              className="block"
            >
              Categories
            </Link>

            <Link
              href="/about"
              onClick={() =>
                setMobileOpen(false)
              }
              className="block"
            >
              About
            </Link>
            <Link
              href="/contact"
              onClick={() =>
                setMobileOpen(false)
              }
              className="block"
            >
              Contact
            </Link>

          </div>

        </div>
      )}

    </header>
  );
}