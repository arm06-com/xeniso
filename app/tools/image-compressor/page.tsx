"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";

import ToolLayout from "@/components/ToolLayout";
import ToolFaq from "@/components/ToolFaq";
import AdBanner from "@/components/AdBanner";

export default function ImageCompressorPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);

  const [originalPreview, setOriginalPreview] = useState("");
  const [compressedPreview, setCompressedPreview] = useState("");

  const [isCompressing, setIsCompressing] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image.");
      return;
    }

    setSelectedFile(file);
    setCompressedFile(null);

    setOriginalPreview(URL.createObjectURL(file));

    try {
      setIsCompressing(true);

      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      const compressed = await imageCompression(file, options);

      setCompressedFile(compressed);
      setCompressedPreview(URL.createObjectURL(compressed));
    } catch (error) {
      console.error(error);
      alert("Compression failed.");
    } finally {
      setIsCompressing(false);
    }
  };

  const downloadCompressed = () => {
    if (!compressedFile || !compressedPreview) return;

    const link = document.createElement("a");
    link.href = compressedPreview;
    link.download = `compressed-${compressedFile.name}`;
    link.click();
  };

  const formatSize = (bytes: number) => {
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <ToolLayout
      title="Free Image Compressor"
      description="Compress JPG, PNG, and WebP images online for free without uploading them to a server."
    >
      {/* Upload Area */}
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
          className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer hover:bg-gray-50 transition"
          onClick={() => fileInputRef.current?.click()}
        >
          <h2 className="text-2xl font-semibold text-black">
            Drag & Drop Your Image
          </h2>

          <p className="mt-2 text-orange-500">
            or click to select a file
          </p>

          <p className="mt-2 text-orange-500">
            Compress expected image in a second.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
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

      {/* Results */}
      {selectedFile && (
        <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-md">
          {isCompressing ? (
            <p className="text-center text-lg text-black">
              Compressing image...
            </p>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold mb-4 text-black">
                    Original
                  </h3>

                  <img
                    src={originalPreview}
                    alt="Original"
                    className="rounded-xl border"
                  />

                  <p className="mt-3 text-sm text-gray-600">
                    Size: {formatSize(selectedFile.size)}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-4 text-black">
                    Compressed
                  </h3>

                  {compressedPreview && (
                    <>
                      <img
                        src={compressedPreview}
                        alt="Compressed"
                        className="rounded-xl border"
                      />

                      <p className="mt-3 text-sm text-gray-600">
                        Size:{" "}
                        {compressedFile &&
                          formatSize(compressedFile.size)}
                      </p>

                      <button
                        onClick={downloadCompressed}
                        className="mt-4 px-6 py-3 rounded-lg bg-black text-white cursor-pointer hover:opacity-90 transition"
                      >
                        Download Image
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* How To Use */}
      <section>
        <h2 className="text-2xl font-bold text-black">
          How to Use
        </h2>

        <ol className="list-decimal pl-6 mt-4 space-y-2 text-gray-500">
          <li>Drag and drop your image.</li>
          <li>Wait a few seconds.</li>
          <li>Review the compressed result.</li>
          <li>Download the optimized image.</li>
        </ol>
      </section>

      <ToolFaq
        items={[
          {
            question: "Is this Image Compressor free?",
            answer:
              "Yes, Xeniso Image Compressor is completely free.",
          },
          {
            question: "Are my images uploaded?",
            answer:
              "No. Compression happens entirely in your browser.",
          },
          {
            question: "Which formats are supported?",
            answer:
              "JPG, PNG, and WebP images are supported.",
          },
        ]}
      />
    </ToolLayout>
  );
}