"use client";

import Link from "next/link";
import Image from "next/image";
import {
  FaFacebookF,
  FaGithub,
  FaLinkedinIn,
} from "react-icons/fa";
import { Mail } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-700 text-gray-300 mt-20">

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-16">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="lg:col-span-2">

            <Link
              href="/"
              className="text-3xl font-bold text-white"
            >
              <Image
                  src="/xeniso-white-logo.png"
                  alt="Xeniso Logo"
                  width={130}
                  height={40}
                  priority
                />
            </Link>

            <p className="mt-4 text-gray-400 leading-relaxed max-w-md">
              Free online tools for PDF and images.
              Compress, convert, resize and edit
              files securely in your browser —
              fast, private and easy to use.
            </p>

            {/* Social */}
            <div className="flex gap-4 mt-6">

              <a
                href="#"
                className="hover:text-white transition"
                aria-label="Facebook"
              >
               <FaFacebookF size={18} />
              </a>

              <a
                href="#"
                className="hover:text-white transition"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn size={18} />
              </a>

              <a
                href="#"
                className="hover:text-white transition"
                aria-label="GitHub"
              >
                <FaGithub size={18} />
              </a>

              <a
                href="mailto:hello@xeniso.com"
                className="hover:text-white transition"
                aria-label="Email"
              >
                <Mail size={18} />
              </a>

            </div>

          </div>

          {/* Product */}
          <div>

            <h3 className="text-white font-semibold mb-5">
              Product
            </h3>

            <ul className="space-y-3">

              <li>
                <Link
                  href="/tools"
                  className="hover:text-white"
                >
                  All Tools
                </Link>
              </li>

              <li>
                <Link
                  href="/blog"
                  className="hover:text-white"
                >
                  Blog
                </Link>
              </li>

              <li>
                <Link
                  href="/categories"
                  className="hover:text-white"
                >
                  Categories
                </Link>
              </li>

            </ul>

          </div>

          {/* Categories */}
          <div>

            <h3 className="text-white font-semibold mb-5">
              Categories
            </h3>

            <ul className="space-y-3">

              <li>
                <Link
                  href="/categories#pdf"
                  className="hover:text-white"
                >
                  PDF Tools
                </Link>
              </li>

              <li>
                <Link
                  href="/categories#image"
                  className="hover:text-white"
                >
                  Image Tools
                </Link>
              </li>

              <li>
                <Link
                  href="/categories#utility"
                  className="hover:text-white"
                >
                  Utility Tools
                </Link>
              </li>

            </ul>

          </div>

          {/* Company */}
          <div>

            <h3 className="text-white font-semibold mb-5">
              Company
            </h3>

            <ul className="space-y-3">

              <li>
                <Link
                  href="/about"
                  className="hover:text-white"
                >
                  About Us
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="hover:text-white"
                >
                  Contact
                </Link>
              </li>

              <li>
                <Link
                  href="/disclaimer"
                  className="hover:text-white"
                >
                  Disclaimer
                </Link>
              </li>

              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-white"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="hover:text-white"
                >
                  Terms of Service
                </Link>
              </li>

              <li>
                <Link
                  href="/faq"
                  className="hover:text-white"
                >
                  FAQ
                </Link>
              </li>

            </ul>

          </div>

        </div>

      </div>

      <div className="bg-gray-900 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-8 text-sm text-gray-400">

            <span>✓ 100% Free</span>

            <span>✓ Privacy First</span>

            <span>✓ No Registration</span>

            <span>✓ Browser-Based Processing</span>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">

        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">

          <p>
            © {year} Xeniso. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-6">

            <Link
              href="/privacy-policy"
              className="hover:text-white"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="hover:text-white"
            >
              Terms of Service
            </Link>

            <Link
              href="/disclaimer"
              className="hover:text-white"
            >
              Disclaimer
            </Link>

          </div>

        </div>

      </div>

    </footer>
  );
}