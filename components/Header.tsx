"use client";

import Link from "next/link";
import Image from "next/image";
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
    name: "Image to PDF",
    href: "/tools/pdf-converter",
  },
  {
    name: "PDF Splitter",
    href: "/tools/pdf-splitter",
  },
  {
    name: "Merge PDF",
    href: "/tools/merge-pdf",
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

  const [mobileToolsOpen, setMobileToolsOpen] =
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="h-16 md:h-18 flex items-center justify-between">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center shrink-0"
          >
            <Image
              src="/xeniso-logo.png"
              alt="Xeniso Logo"
              width={130}
              height={40}
              priority
              className="w-32.5 sm:w-27.5 lg:w-32.5 h-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">

            <Link
              href="/"
              className={`transition-colors hover:text-sky-900 ${
                pathname === "/"
                  ? "font-semibold text-black"
                  : "text-gray-900"
              }`}
            >
              Home
            </Link>

            {/* Tools Dropdown */}
            <div
              ref={toolsRef}
              className="relative"
            >
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setToolsOpen(!toolsOpen);
                }}
                className="flex items-center gap-1 text-gray-900 hover:text-sky-900 transition-colors"
              >
                Tools

                <ChevronDown
                  size={18}
                  className={`transition-transform ${
                    toolsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {toolsOpen && (
                <div className="absolute top-12 left-0 w-64 bg-white border rounded-xl shadow-xl overflow-hidden z-50">

                  {tools.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      onClick={() =>
                        setToolsOpen(false)
                      }
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      {tool.name}
                    </Link>
                  ))}

                </div>
              )}
            </div>

            <Link
              href="/categories"
              className={`transition-colors hover:text-sky-900 ${
                pathname ===
                "/categories"
                  ? "font-semibold text-black"
                  : "text-gray-900"
              }`}
            >
              Categories
            </Link>

            <Link
              href="/about"
              className={`transition-colors hover:text-sky-900 ${
                pathname === "/about"
                  ? "font-semibold text-black"
                  : "text-gray-900"
              }`}
            >
              About
            </Link>

            <Link
              href="/contact"
              className={`transition-colors hover:text-sky-900 ${
                pathname === "/contact"
                  ? "font-semibold text-black"
                  : "text-gray-900"
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* Search */}
          <div className="hidden xl:block ml-6 shrink-0">
            <ToolSearch />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => {
              setToolsOpen(false);
              setMobileOpen(!mobileOpen);
            }}
            className="lg:hidden flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors text-black"
            aria-label="Toggle Menu"
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
          className="lg:hidden border-t bg-white shadow-md"
        >
          <div className="px-4 sm:px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">

            <Link
              href="/"
              onClick={() =>
                setMobileOpen(false)
              }
              className="block text-black font-medium"
            >
              Home
            </Link>

            <div>
              <button
                onClick={() =>
                  setMobileToolsOpen(!mobileToolsOpen)
                }
                className="w-full flex items-center justify-between text-black font-semibold"
              >
                <span>Tools</span>

                <ChevronDown
                  size={18}
                  className={`transition-transform duration-200 ${
                    mobileToolsOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              {mobileToolsOpen && (
                <div className="mt-3 space-y-3 pl-4 border-l border-gray-200">

                  {tools.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      onClick={() => {
                        setMobileOpen(false);
                        setMobileToolsOpen(false);
                      }}
                      className="block text-gray-600 hover:text-black transition-colors"
                    >
                      {tool.name}
                    </Link>
                  ))}

                </div>
              )}
            </div>

            <Link
              href="/categories"
              onClick={() =>
                setMobileOpen(false)
              }
              className="block text-black font-medium"
            >
              Categories
            </Link>

            <Link
              href="/about"
              onClick={() =>
                setMobileOpen(false)
              }
              className="block text-black font-medium"
            >
              About
            </Link>

            <Link
              href="/contact"
              onClick={() =>
                setMobileOpen(false)
              }
              className="block text-black font-medium"
            >
              Contact
            </Link>

            {/* Mobile Search */}
            <div className="pt-2 border-t">
              <ToolSearch />
            </div>

          </div>
        </div>
      )}
    </header>
  );
}