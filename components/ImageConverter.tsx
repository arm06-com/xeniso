"use client";

import { useEffect, useRef, useState, } from "react";

type SupportedFormat = "jpg" | "jpeg" | "png" | "webp";

type ImageConverterProps = {
  defaultOutput?: SupportedFormat;
};

export default function ImageConverter({
  defaultOutput,
}: ImageConverterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);

  const [originalPreview, setOriginalPreview] =
    useState<string | null>(null);

  const [inputFormat, setInputFormat] =
    useState<SupportedFormat | null>(null);

  const [outputFormat, setOutputFormat] =
    useState<SupportedFormat>(
      defaultOutput || "png"
    );

  const [isDragging, setIsDragging] =
    useState(false);

  const [isConverting, setIsConverting] =
    useState(false);
  const [progress, setProgress] =
  useState(0);

  const [convertedPreview, setConvertedPreview] =
    useState<string | null>(null);

  const [downloadUrl, setDownloadUrl] =
    useState<string | null>(null);

  const [convertedSize, setConvertedSize] =
    useState<number | null>(null);

  const [convertedFileName, setConvertedFileName] =
    useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (downloadUrl) {
            URL.revokeObjectURL(downloadUrl);
            }
        };
    }, [downloadUrl]);

  const detectFormat = (
    mimeType: string
  ): SupportedFormat | null => {
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

  const handleFile = (
    selectedFile: File
  ) => {
    const format = detectFormat(
      selectedFile.type
    );

    if (!format) {
      alert(
        "Only JPG, JPEG, PNG and WebP images are supported."
      );
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

        if (
        defaultOutput &&
        defaultOutput !== format
        ) {
        setOutputFormat(defaultOutput);
        } else {
        const firstAvailable =
            (["jpg", "png", "webp"] as SupportedFormat[])
            .find((f) => f !== format);

        if (firstAvailable) {
            setOutputFormat(firstAvailable);
        }
        }

    const reader = new FileReader();

    reader.onload = (event) => {
      const result =
        event.target?.result;

      if (typeof result === "string") {
        setOriginalPreview(result);
      }
    };

    reader.readAsDataURL(selectedFile);
  };

  const getMimeType = (
    format: SupportedFormat
  ) => {
    switch (format) {
      case "jpg":
        return "image/jpeg";

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
    if (
        !file ||
        !originalPreview ||
        !inputFormat
    ) {
        return;
    }

    setIsConverting(true);
    setProgress(0);
    const interval = setInterval(() => {
    setProgress((prev) => {
        if (prev >= 90) {
        clearInterval(interval);
        return 90;
        }

        return prev + 10;
    });
    }, 100);
    // reset previous converted metadata
    setConvertedSize(null);
    setConvertedFileName(null);
    setConvertedPreview(null);
    setDownloadUrl(null);

    try {
        const img = new Image();

        img.onload = () => {
        const canvas =
            document.createElement("canvas");

        canvas.width = img.width;
        canvas.height = img.height;

        const ctx =
            canvas.getContext("2d");

        if (!ctx) {
            setIsConverting(false);
            return;
        }

        // White background for JPG/JPEG
        if (outputFormat === "jpg" || outputFormat === "jpeg") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
            );
        }

        ctx.drawImage(img, 0, 0);

        const mimeType =
            getMimeType(outputFormat);

        canvas.toBlob(
          (blob) => {
          if (!blob) {
            setIsConverting(false);
            return;
          }

          const objectUrl =
            URL.createObjectURL(blob);

          setDownloadUrl(objectUrl);

          // store converted metadata
          setConvertedSize(blob.size);
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          setConvertedFileName(`${baseName}.${outputFormat}`);

          // Preview image
          const reader =
            new FileReader();

          reader.onload = () => {
            setConvertedPreview(
            reader.result as string
            );

            setProgress(100);

            setTimeout(() => {
            setProgress(0);
            }, 500);

            setIsConverting(false);

            clearInterval(interval);
          };

          reader.readAsDataURL(blob);
          },
          mimeType,
          0.92
        );
        };

        img.src = originalPreview;
    } catch (error) {
        console.error(error);
        setIsConverting(false);
    }
 };
 const downloadConvertedImage = () => {
    if (!downloadUrl || !file) {
        return;
    }

    const link =
        document.createElement("a");

    const fileName =
        file.name.replace(
        /\.[^/.]+$/,
        ""
        );

    link.href = downloadUrl;

    link.download = `${fileName}.${outputFormat}`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };
  return (
    <div className="space-y-8">
      {/* Upload Area */}
      <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-md">
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
          <h2 className="text-2xl font-semibold text-black">
            Drag & Drop Your Image
          </h2>

          <p className="mt-2 text-gray-600">
            or click to select a file
          </p>

          <p className="mt-4 text-sm text-gray-500">
            Supports JPG, JPEG, PNG and WebP
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            hidden
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

        {file && inputFormat && originalPreview && (
        <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-md">
            <div className="grid lg:grid-cols-2 gap-8">

            {/* LEFT COLUMN - ORIGINAL IMAGE */}
            <div>
                <h2 className="text-2xl font-bold mb-6 text-black">
                Original Image
                </h2>

                <img
                src={originalPreview}
                alt="Original"
                className="rounded-xl border max-h-100 w-full object-contain"
                />

                <div className="space-y-4 mt-6">
                <div>
                    <span className="font-semibold text-black">
                    Source Format:
                    </span>

                    <p className="uppercase text-gray-600">
                    {inputFormat}
                    </p>
                </div>

                <div>
                    <span className="font-semibold text-black">
                    File Name:
                    </span>

                    <p className="text-gray-600 break-all">
                    {file.name}
                    </p>
                </div>

                <div>
                    <span className="font-semibold text-black">
                    File Size:
                    </span>

                    <p className="text-gray-600">
                    {(file.size / 1024).toFixed(1)} KB
                    </p>
                </div>

                <div>
                    <label className="block font-semibold mb-2 text-black">
                    Convert To
                    </label>

                    <select
                        value={outputFormat}
                        onChange={(e) =>
                            setOutputFormat(
                            e.target.value as SupportedFormat
                            )
                        }
                        className="w-full border rounded-lg px-4 py-3"
                        >
                        {(["jpg", "png", "webp"] as SupportedFormat[])
                            .filter(
                            (format) => format !== inputFormat
                            )
                            .map((format) => (
                            <option
                                key={format}
                                value={format}
                            >
                                {format.toUpperCase()}
                            </option>
                            ))}
                    </select>
                </div>

                <button
                    onClick={convertImage}
                    disabled={
                    isConverting ||
                    (inputFormat
                        ? getMimeType(inputFormat) ===
                        getMimeType(outputFormat)
                        : false)
                    }
                    className="w-full bg-black text-white py-3 rounded-lg font-medium cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isConverting
                    ? "Converting..."
                    : `Convert to ${outputFormat.toUpperCase()}`}
                </button>
                {isConverting && (
                    <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-black h-3 transition-all duration-300"
                            style={{
                            width: `${progress}%`,
                            }}
                        />
                        </div>

                        <p className="text-sm text-gray-600 mt-2">
                        {progress}% completed
                        </p>
                    </div>
                )}

                {convertedPreview && (
                    <p className="bg-green-600 text-white font-medium px-4 py-2 rounded-lg">
                        ✓ Conversion successful

                        {convertedSize && (
                            <>
                            <br />

                            Saved{" "}
                            {(
                                (
                                (file.size -
                                    convertedSize) /
                                file.size
                                ) *
                                100
                            ).toFixed(1)}
                            %
                            </>
                        )}
                    </p>
                )}
                </div>
            </div>

            {/* RIGHT COLUMN - CONVERTED IMAGE */}
            <div>
                <h2 className="text-2xl font-bold mb-6 text-black">
                Converted Image
                </h2>

                {convertedPreview ? (
                <img
                    src={convertedPreview}
                    alt="Converted"
                    className="rounded-xl border max-h-100 w-full object-contain"
                />
                ) : (
                <div className="border rounded-xl h-100 flex items-center justify-center text-gray-400 bg-gray-50">
                    Converted image preview will appear here
                </div>
                )}

                <div className="space-y-4 mt-6">
                <div>
                    <span className="font-semibold text-black">
                    Output Format:
                    </span>

                    <p className="uppercase text-gray-600">
                    {convertedPreview
                        ? outputFormat
                        : "-"}
                    </p>
                </div>

                <div>
                    <span className="font-semibold text-black">
                    File Name:
                    </span>

                    <p className="text-gray-600 break-all">
                    {convertedFileName || "-"}
                    </p>
                </div>

                <div>
                    <span className="font-semibold text-black">
                    File Size:
                    </span>

                    <p className="text-gray-600">
                    {convertedSize
                        ? `${(
                            convertedSize / 1024
                        ).toFixed(1)} KB`
                        : "-"}
                    </p>
                </div>

                {convertedPreview && (
                    <button
                    onClick={downloadConvertedImage}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium cursor-pointer"
                    >
                    Download Converted Image
                    </button>
                )}
                </div>
            </div>

            </div>
        </section>
        )}
    </div>
  );
}