"use client";

import { useState } from "react";
import QRCode from "qrcode";

import ToolLayout from "@/components/ToolLayout";
import ToolFaq from "@/components/ToolFaq";
import AdBanner from "@/components/AdBanner";

export default function QRGeneratorPage() {
  const [text, setText] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const generateQRCode = async () => {
    if (!text.trim()) {
      alert("Please enter text or a URL.");
      return;
    }

    try {
      const url = await QRCode.toDataURL(text);
      setQrCodeUrl(url);
    } catch (error) {
      console.error("QR generation failed:", error);
      alert("Failed to generate QR Code.");
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = "xeniso-qr-code.png";
    link.click();
  };

  return (
    <ToolLayout
      title="Free QR Code Generator"
      description="Generate QR codes instantly for URLs, text, phone numbers, and more."
    >
      {/* Generator */}
      <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-md">
        <label className="block text-sm font-medium mb-2">
          Enter text or URL
        </label>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="https://xeniso.com"
          rows={4}
          className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring"
        />

        <button
          onClick={generateQRCode}
          disabled={!text.trim()}
          className={`mt-4 px-6 py-3 rounded-lg text-white cursor-pointer transition ${
            text.trim()
              ? "bg-black hover:opacity-90"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Generate QR Code
        </button>
      </section>

      <AdBanner slot="MIDDLE-BANNER" />

      {/* Result */}
      {qrCodeUrl && (
        <section className="text-center bg-white border border-gray-200 rounded-2xl p-8 shadow-md">
          <p className="mt-2 text-green-600">
            QR Code generated successfully.
          </p>

          <h2 className="text-2xl font-semibold">
            Your QR Code
          </h2>

          <img
            src={qrCodeUrl}
            alt="Generated QR Code"
            className="mx-auto mt-6 w-64 h-64"
          />

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={downloadQRCode}
              className="px-6 py-3 rounded-lg bg-black text-white hover:opacity-90 cursor-pointer transition"
            >
              Download PNG
            </button>

            <button
              onClick={async () => {
                await navigator.clipboard.writeText(text);
                alert("Copied successfully!");
              }}
              className="px-6 py-3 rounded-lg border hover:bg-gray-100 cursor-pointer transition"
            >
              Copy Content
            </button>
          </div>
        </section>
      )}

      {/* How To Use */}
      <section>
        <h2 className="text-2xl font-bold">
          How to Use
        </h2>

        <ol className="list-decimal pl-6 mt-4 space-y-2 text-gray-700">
          <li>Enter your URL or text.</li>
          <li>Click Generate QR Code.</li>
          <li>Preview your QR code instantly.</li>
          <li>Download it as a PNG image.</li>
        </ol>
      </section>

      {/* FAQ */}
      <ToolFaq
        items={[
          {
            question: "Is this QR Code Generator free?",
            answer:
              "Yes, Xeniso QR Generator is completely free to use.",
          },
          {
            question: "Are my QR codes stored?",
            answer:
              "No. Everything happens directly in your browser.",
          },
          {
            question: "Can I generate QR codes for websites?",
            answer:
              "Yes. Simply paste your URL and generate instantly.",
          },
        ]}
      />
    </ToolLayout>
  );
}