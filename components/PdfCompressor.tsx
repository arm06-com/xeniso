"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { PDFDocument } from "pdf-lib";

// Types
type CompressionLevel =
  | "low"
  | "balanced"
  | "maximum";

export default function PdfCompressor() {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [file, setFile] =
    useState<File | null>(null);

  const [isDragging, setIsDragging] =
    useState(false);

  const [compressionLevel, setCompressionLevel] =
    useState<CompressionLevel>("balanced");

  const [isCompressing, setIsCompressing] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [downloadUrl, setDownloadUrl] =
    useState<string | null>(null);

  const [optimizedSize, setOptimizedSize] =
    useState<number | null>(null);

  const [savedPercentage, setSavedPercentage] =
    useState<number | null>(null);

  useEffect(() => {
    return () => {
        if (downloadUrl) {
        URL.revokeObjectURL(
            downloadUrl
        );
        }
    };
  }, [downloadUrl]);

//Handle File Upload
const handleFile = (
  selectedFile: File
) => {
  if (
    selectedFile.type !==
    "application/pdf"
  ) {
    alert(
      "Please upload a PDF file."
    );
    return;
  }

  setFile(selectedFile);
};

//Placeholder Compression
const compressPdf = async () => {
  if (!file) return;

  setIsCompressing(true);
  setProgress(0);

  setDownloadUrl(null);
  setOptimizedSize(null);
  setSavedPercentage(null);

  try {
    const arrayBuffer =
      await file.arrayBuffer();

    setProgress(20);

    const pdfDoc =
      await PDFDocument.load(arrayBuffer);

    setProgress(50);

    const optimizedBytes =
      await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        updateFieldAppearances: false,
      });

    setProgress(80);

    const pdfBuffer = new Uint8Array(
        optimizedBytes
        );

        const blob = new Blob(
        [pdfBuffer],
        {
            type: "application/pdf",
        }
    );

    const url =
      URL.createObjectURL(blob);

    const optimizedFileSize =
      blob.size;

    const saved =
      (
        ((file.size -
          optimizedFileSize) /
          file.size) *
        100
      ).toFixed(1);

    setDownloadUrl(url);

    setOptimizedSize(
      optimizedFileSize
    );

    setSavedPercentage(
      Number(saved)
    );

    setProgress(100);
  } catch (error) {
    console.error(error);

    alert(
      "Failed to optimize PDF."
    );
  }

  setIsCompressing(false);
};

//Download Function
const downloadPdf = () => {
  if (!downloadUrl) return;

  const link =
    document.createElement("a");

  link.href = downloadUrl;

  link.download =
    `xeniso-optimized-${file?.name}`;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
};
return (
  <div className="space-y-8">

    {/* Upload */}
    <section className="bg-white border rounded-2xl p-8 shadow-md">

      <div
        onClick={() =>
          fileInputRef.current?.click()
        }
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() =>
          setIsDragging(false)
        }
        onDrop={(e) => {
          e.preventDefault();

          setIsDragging(false);

          const droppedFile =
            e.dataTransfer.files?.[0];

          if (droppedFile) {
            handleFile(
              droppedFile
            );
          }
        }}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${
          isDragging
            ? "border-black bg-gray-50"
            : "border-gray-300 hover:bg-gray-50"
        }`}
      >
        <h2 className="text-2xl font-semibold">
          Drag & Drop PDF
        </h2>

        <p className="mt-2 text-gray-600">
          or click to select a PDF
        </p>

        <p className="mt-4 text-sm text-gray-500">
          Maximum recommended size: 50 MB
        </p>

        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept=".pdf"
          onChange={(e) => {
            const selectedFile =
              e.target.files?.[0];

            if (selectedFile) {
              handleFile(
                selectedFile
              );
            }
          }}
        />
      </div>

    </section>

    {/* File Details */}
    {file && (
        <section className="bg-white border rounded-2xl p-8 shadow-md">

            <h2 className="text-2xl font-bold mb-6">
            PDF Information
            </h2>

            <div className="space-y-4">

            <div>
                <span className="font-semibold">
                File Name:
                </span>

                <p className="text-gray-600 break-all">
                {file.name}
                </p>
            </div>

            <div>
                <span className="font-semibold">
                File Size:
                </span>

                <p className="text-gray-600">
                {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
            </div>

            </div>

        </section>
    )}

    {/* Compression Settings */}
    {file && (
        <section className="bg-white border rounded-2xl p-8 shadow-md">

            <h2 className="text-2xl font-bold mb-6">
            Compression Settings
            </h2>

            <div>

            <label className="block font-medium mb-2">
                Compression Level
            </label>

            <select
                value={compressionLevel}
                onChange={(e) =>
                setCompressionLevel(
                    e.target.value as CompressionLevel
                )
                }
                className="w-full border rounded-lg px-4 py-3"
            >
                <option value="low">
                Low Compression
                </option>

                <option value="balanced">
                Balanced
                </option>

                <option value="maximum">
                Maximum Compression
                </option>
            </select>

            </div>

        </section>
    )}

    {/* Compress Button */}
    {file && (
        <section className="bg-white border rounded-2xl p-8 shadow-md">

            <button
            onClick={compressPdf}
            disabled={isCompressing}
            className="w-full bg-black text-white py-3 rounded-lg font-medium disabled:bg-gray-400"
            >
            {isCompressing
                ? "Compressing..."
                : "Compress PDF"}
            </button>

            {isCompressing && (
            <>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-6 overflow-hidden">

                <div
                    className="bg-black h-3 transition-all"
                    style={{
                    width: `${progress}%`,
                    }}
                />

                </div>

                <p className="mt-2 text-sm text-gray-600">
                {progress}% completed
                </p>
            </>
            )}

        </section>
    )}
    {/* Show Results */}
    {downloadUrl && (
        <section className="bg-white border rounded-2xl p-8 shadow-md">

            <h2 className="text-2xl font-bold mb-6">
            Optimization Results
            </h2>

            <div className="space-y-4">

            <div>
                <span className="font-semibold">
                Original Size:
                </span>

                <p className="text-gray-600">
                {(file!.size / 1024 / 1024).toFixed(2)} MB
                </p>
            </div>

            <div>
                <span className="font-semibold">
                Optimized Size:
                </span>

                <p className="text-gray-600">
                {optimizedSize
                    ? `${(
                        optimizedSize /
                        1024 /
                        1024
                    ).toFixed(2)} MB`
                    : "-"}
                </p>
            </div>

            <div>
                <span className="font-semibold">
                Saved:
                </span>

                <p className="text-green-600 font-medium">
                {savedPercentage}%
                </p>
            </div>

            </div>

            <button
            onClick={downloadPdf}
            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium cursor-pointer"
            >
            Download Optimized PDF
            </button>

        </section>
    )}

    <section className="bg-gray-50 border rounded-2xl p-6">

        <h3 className="font-semibold">
            Privacy First
        </h3>

        <p className="text-sm text-gray-600 mt-2">
            Your PDF files never leave your browser.
            Compression happens locally on your device.
        </p>

    </section>

    </div>
);
}
