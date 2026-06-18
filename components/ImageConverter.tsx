"use client";

import { useEffect, useRef, useState } from "react";

type SupportedFormat = "jpg" | "jpeg" | "png" | "webp";

type ImageConverterProps = {
  defaultOutput?: SupportedFormat;
};

export default function ImageConverter({
  defaultOutput,
}: ImageConverterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);

  const [inputFormat, setInputFormat] =
    useState<SupportedFormat | null>(null);

  const [outputFormat, setOutputFormat] =
    useState<SupportedFormat>(defaultOutput || "png");

  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);

  const [convertedPreview, setConvertedPreview] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [convertedSize, setConvertedSize] = useState<number | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const detectFormat = (mimeType: string): SupportedFormat | null => {
    switch (mimeType) {
      case "image/jpeg":
        return "jpg";
      case "image/png":
        return "png";
      case "image/webp":
        return "webp";
      default:
        return null;
    }
  };

  const handleFile = (selectedFile: File) => {
    const format = detectFormat(selectedFile.type);

    if (!format) {
      alert("Only JPG, JPEG, PNG and WebP images are supported.");
      return;
    }

    setConvertedPreview(null);
    setDownloadUrl(null);
    setConvertedSize(null);
    setConvertedFileName(null);
    setIsConverting(false);
    setProgress(0);

    setFile(selectedFile);
    setInputFormat(format);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") setOriginalPreview(result);
    };

    reader.readAsDataURL(selectedFile);
  };

  const getMimeType = (format: SupportedFormat) => {
    switch (format) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "webp":
        return "image/webp";
      default:
        return "image/png";
    }
  };

  const convertImage = async () => {
    if (!file || !originalPreview || !inputFormat) return;

    setIsConverting(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
    }, 100);

    setConvertedSize(null);
    setConvertedFileName(null);
    setConvertedPreview(null);
    setDownloadUrl(null);

    try {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (outputFormat === "jpg" || outputFormat === "jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) return;

          const objectUrl = URL.createObjectURL(blob);
          setDownloadUrl(objectUrl);

          setConvertedSize(blob.size);

          const baseName = file.name.replace(/\.[^/.]+$/, "");
          setConvertedFileName(`${baseName}.${outputFormat}`);

          const reader = new FileReader();
          reader.onload = () => {
            setConvertedPreview(reader.result as string);
            setProgress(100);

            setTimeout(() => setProgress(0), 500);

            setIsConverting(false);
            clearInterval(interval);
          };

          reader.readAsDataURL(blob);
        }, getMimeType(outputFormat), 0.92);
      };

      img.src = originalPreview;
    } catch (error) {
      console.error(error);
      setIsConverting(false);
    }
  };

  const downloadConvertedImage = () => {
    if (!downloadUrl || !file) return;

    const link = document.createElement("a");
    const fileName = file.name.replace(/\.[^/.]+$/, "");

    link.href = downloadUrl;
    link.download = `${fileName}.${outputFormat}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-0">

      {/* Upload */}
      <section className="bg-white border rounded-2xl p-6 sm:p-8 shadow-md">
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition ${
            isDragging ? "border-black bg-gray-50" : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          <h2 className="text-xl sm:text-2xl font-semibold sm:text-black">
            Drag & Drop Your Image
          </h2>

          <p className="mt-2 text-gray-600 text-sm sm:text-base">
            or click to select a file
          </p>

          <p className="mt-3 text-xs sm:text-sm text-gray-500">
            JPG, JPEG, PNG, WebP supported
          </p>

          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".jpg,.jpeg,.png,.webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      </section>

      {/* Main Content */}
      {file && inputFormat && originalPreview && (
        <section className="bg-white border rounded-2xl p-6 sm:p-8 shadow-md">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* LEFT */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:text-black">
                Original Image
              </h2>

              <img
                src={originalPreview}
                className="w-full max-h-100 object-contain rounded-xl border"
                alt="original"
              />

              <div className="mt-6 space-y-3 text-sm sm:text-base">
                <p><span className="font-semibold sm:text-gray-700">Format:</span> {inputFormat}</p>
                <p className="break-all"><span className="font-semibold sm:text-gray-700">Name:</span> {file.name}</p>
                <p><span className="font-semibold sm:text-gray-700">Size:</span> {(file.size / 1024).toFixed(1)} KB</p>

                <select
                  className="w-full border rounded-lg px-4 py-3 mt-2 sm:text-gray-700"
                  value={outputFormat}
                  onChange={(e) =>
                    setOutputFormat(e.target.value as SupportedFormat)
                  }
                >
                  {(["jpg", "png", "webp"] as SupportedFormat[])
                    .filter((f) => f !== inputFormat)
                    .map((f) => (
                      <option key={f} value={f}>
                        {f.toUpperCase()}
                      </option>
                    ))}
                </select>

                <button
                  onClick={convertImage}
                  disabled={isConverting}
                  className="w-full bg-black text-white py-3 rounded-lg mt-3 disabled:bg-gray-400"
                >
                  {isConverting
                    ? "Converting..."
                    : `Convert to ${outputFormat.toUpperCase()}`}
                </button>

                {isConverting && (
                  <div className="mt-4">
                    <div className="h-2 bg-gray-200 rounded">
                      <div
                        className="h-2 bg-black transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-sm mt-2">{progress}%</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:text-black">
                Converted Image
              </h2>

              {convertedPreview ? (
                <img
                  src={convertedPreview}
                  className="w-full max-h-100 object-contain rounded-xl border"
                  alt="converted"
                />
              ) : (
                <div className="h-75 flex items-center justify-center border rounded-xl bg-gray-50 text-gray-400 text-sm">
                  Converted preview will appear here
                </div>
              )}

              {convertedPreview && (
                <button
                  onClick={downloadConvertedImage}
                  className="w-full bg-green-600 text-white py-3 rounded-lg mt-6"
                >
                  Download Converted Image
                </button>
              )}
            </div>

          </div>
        </section>
      )}
    </div>
  );
}