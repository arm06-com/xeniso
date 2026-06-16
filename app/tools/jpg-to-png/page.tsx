"use client";

import { useRef, useState } from "react";

import ToolLayout from "@/components/ToolLayout";
import ToolFaq from "@/components/ToolFaq";
import AdBanner from "@/components/AdBanner";

export default function JPGToPNGPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [originalPreview, setOriginalPreview] = useState("");
  const [pngPreview, setPngPreview] = useState("");

  const [isConverting, setIsConverting] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFile = (file: File) => {
    if (
      file.type !== "image/jpeg" &&
      file.type !== "image/jpg"
    ) {
      alert("Please upload a JPG or JPEG image.");
      return;
    }

    setFileName(file.name.replace(/\.[^/.]+$/, ""));

    const reader = new FileReader();

    reader.onload = (event) => {
      const imageSrc = event.target?.result as string;

      setOriginalPreview(imageSrc);

      convertToPNG(imageSrc);
    };

    reader.readAsDataURL(file);
  };

  const convertToPNG = (imageSrc: string) => {
    setIsConverting(true);

    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        alert("Conversion failed.");
        setIsConverting(false);
        return;
      }

      ctx.drawImage(img, 0, 0);

      const pngData = canvas.toDataURL("image/png");

      setPngPreview(pngData);
      setIsConverting(false);
    };

    img.src = imageSrc;
  };

  const downloadPNG = () => {
    if (!pngPreview) return;

    const link = document.createElement("a");

    link.href = pngPreview;
    link.download = `${fileName || "converted"}.png`;

    link.click();
  };

  return (
    <ToolLayout
      title="Free JPG to PNG Converter"
      description="Convert JPG and JPEG images to PNG instantly without uploading them to any server."
    >
      {/* Upload */}
      <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-md">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();

            const file = e.dataTransfer.files?.[0];

            if (file) {
              handleFile(file);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer hover:bg-gray-50 transition"
        >
          <h2 className="text-2xl font-semibold">
            Drag & Drop JPG Image
          </h2>

          <p className="mt-2 text-gray-600">
            or click to select a JPG file
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];

              if (file) {
                handleFile(file);
              }
            }}
          />
        </div>
      </section>

      <AdBanner slot="MIDDLE-BANNER" />

      {/* Result */}
      {originalPreview && (
        <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-md">
          {isConverting ? (
            <p className="text-center text-lg">
              Converting image...
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-4">
                  Original JPG
                </h3>

                <img
                  src={originalPreview}
                  alt="Original JPG"
                  className="rounded-xl border"
                />
              </div>

              <div>
                <h3 className="font-semibold mb-4">
                  Converted PNG
                </h3>

                {pngPreview && (
                  <>
                    <img
                      src={pngPreview}
                      alt="Converted PNG"
                      className="rounded-xl border"
                    />

                    <button
                      onClick={downloadPNG}
                      className="mt-4 px-6 py-3 rounded-lg bg-black text-white cursor-pointer hover:opacity-90 transition"
                    >
                      Download PNG
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* How To Use */}
      <section>
        <h2 className="text-2xl font-bold">
          How to Use
        </h2>

        <ol className="list-decimal pl-6 mt-4 space-y-2 text-gray-700">
          <li>Upload or drag your JPG image.</li>
          <li>Wait a moment while conversion completes.</li>
          <li>Preview the PNG image.</li>
          <li>Download the converted PNG.</li>
        </ol>
      </section>

      <ToolFaq
        items={[
          {
            question: "Is this JPG to PNG Converter free?",
            answer:
              "Yes, Xeniso JPG to PNG Converter is completely free.",
          },
          {
            question: "Are my images uploaded?",
            answer:
              "No. Conversion happens directly in your browser.",
          },
          {
            question: "Will image quality be reduced?",
            answer:
              "No. PNG conversion preserves the image quality.",
          },
        ]}
      />
    </ToolLayout>
  );
}