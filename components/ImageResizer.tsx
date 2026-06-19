"use client";

import { useEffect, useRef, useState } from "react";

type Preset = {
  name: string;
  width: number;
  height: number;
};

const presets: Preset[] = [
  { name: "Custom", width: 0, height: 0 },
  { name: "Instagram Square", width: 1080, height: 1080 },
  { name: "Instagram Story", width: 1080, height: 1920 },
  { name: "Facebook Post", width: 1200, height: 630 },
  { name: "Facebook Cover", width: 820, height: 312 },
  { name: "YouTube Thumbnail", width: 1280, height: 720 },
  { name: "YouTube Banner", width: 2560, height: 1440 },
  { name: "Twitter Post", width: 1600, height: 900 },
  { name: "LinkedIn Post", width: 1200, height: 627 },
  { name: "Passport Photo", width: 600, height: 600 },
];

export default function ImageResizer() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState("Custom");

  const [resizedPreview, setResizedPreview] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [resizedSize, setResizedSize] = useState<number | null>(null);

  const [isResizing, setIsResizing] = useState(false);
  const [progress, setProgress] = useState(0);

  const [quality, setQuality] = useState(92);
  const [resizePercentage, setResizePercentage] = useState(100);
  const [savingsPercentage, setSavingsPercentage] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      alert("Please upload an image.");
      return;
    }

    setFile(selectedFile);
    setResizedPreview(null);
    setDownloadUrl(null);
    setResizedSize(null);
    setIsResizing(false);
    setProgress(0);

    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);

      const img = new Image();
      img.onload = () => {
        setOriginalWidth(img.width);
        setOriginalHeight(img.height);
        setWidth(img.width);
        setHeight(img.height);
      };
      img.src = result;
    };

    reader.readAsDataURL(selectedFile);
  };

  const handleWidthChange = (value: number) => {
    setWidth(value);
    if (maintainAspectRatio && originalWidth) {
      setHeight(Math.round(value * (originalHeight / originalWidth)));
    }
  };

  const handleHeightChange = (value: number) => {
    setHeight(value);
    if (maintainAspectRatio && originalHeight) {
      setWidth(Math.round(value * (originalWidth / originalHeight)));
    }
  };

  const handlePresetChange = (name: string) => {
    setSelectedPreset(name);
    const preset = presets.find((p) => p.name === name);
    if (preset && preset.name !== "Custom") {
      setWidth(preset.width);
      setHeight(preset.height);
    }
  };

  const handlePercentageChange = (percentage: number) => {
    if (!originalWidth || !originalHeight) return;

    setResizePercentage(percentage);

    setWidth(Math.round(originalWidth * (percentage / 100)));
    setHeight(Math.round(originalHeight * (percentage / 100)));
  };

  const resizeImage = async () => {
    if (!preview || !file || width <= 0 || height <= 0) return;

    setIsResizing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((p) => (p >= 90 ? 90 : p + 10));
    }, 100);

    try {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) return;

          const url = URL.createObjectURL(blob);
          setDownloadUrl(url);
          setResizedSize(blob.size);

          const savings = ((file.size - blob.size) / file.size) * 100;
          setSavingsPercentage(Number(savings.toFixed(1)));

          const reader = new FileReader();
          reader.onload = () => {
            setResizedPreview(reader.result as string);
            setProgress(100);

            setTimeout(() => setProgress(0), 500);
            setIsResizing(false);
            clearInterval(interval);
          };

          reader.readAsDataURL(blob);
        }, file.type, quality / 100);
      };

      img.src = preview;
    } catch {
      clearInterval(interval);
      setIsResizing(false);
    }
  };

  const downloadResizedImage = () => {
    if (!downloadUrl || !file) return;

    const link = document.createElement("a");
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const ext = file.name.split(".").pop();

    link.href = downloadUrl;
    link.download = `${baseName}-resized.${ext}`;

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
          <h2 className="text-xl sm:text-2xl font-semibold text-black">
            Drag & Drop Image to Resize
          </h2>

          <p className="mt-2 text-orange-500 text-sm sm:text-base">
            or click to select
          </p>

          <p className="mt-3 text-xs sm:text-sm text-gray-500">
            JPG, PNG, WebP supported
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      </section>

      {/* SETTINGS */}
      {preview && (
        <section className="bg-white border rounded-2xl p-6 sm:p-8 shadow-md">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-black">
            Resize Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <label className="block font-medium mb-2 text-black">
                Preset
              </label>

              <select
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 text-gray-700"
              >
                {presets.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium mb-2 text-black">
                Resize %
              </label>

              <select
                value={resizePercentage}
                onChange={(e) =>
                  handlePercentageChange(Number(e.target.value))
                }
                className="w-full border rounded-lg px-4 py-3 text-gray-600"
              >
                {[25, 50, 75, 100, 150, 200].map((p) => (
                  <option key={p} value={p}>
                    {p}%
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 text-black">
              <input
                type="checkbox"
                checked={maintainAspectRatio}
                onChange={(e) =>
                  setMaintainAspectRatio(e.target.checked)
                }
              />
              Maintain Aspect Ratio
            </label>

            <input
              type="number"
              value={width}
              onChange={(e) => handleWidthChange(Number(e.target.value))}
              className="w-full border rounded-lg px-4 py-3 text-gray-600"
              placeholder="Width"
            />

            <input
              type="number"
              value={height}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
              className="w-full border rounded-lg px-4 py-3 text-gray-600"
              placeholder="Height"
            />

            <div className="md:col-span-2">
              <button
                onClick={resizeImage}
                disabled={isResizing}
                className="w-full bg-black hover-gray-600 text-white py-3 rounded-lg disabled:bg-gray-400"
              >
                {isResizing ? "Resizing..." : "Resize Image"}
              </button>

              {isResizing && (
                <div className="mt-4">
                  <div className="h-2 bg-gray-200 rounded">
                    <div
                      className="h-2 bg-black"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        </section>
      )}

      {/* RESULT */}
      {resizedPreview && (
        <section className="bg-white border rounded-2xl p-6 sm:p-8 shadow-md">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-black">
            Resized Image
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            <img
              src={resizedPreview}
              className="w-full max-h-100 object-contain rounded-xl border"
            />

            <div className="space-y-3 text-sm text-gray-600">

              <p><strong>Size:</strong> {width} × {height}px</p>
              <p><strong>File:</strong> {resizedSize ? `${(resizedSize / 1024).toFixed(1)} KB` : "-"}</p>

              {savingsPercentage !== null && (
                <p className={savingsPercentage > 0 ? "text-green-600" : "text-orange-600"}>
                  {savingsPercentage > 0
                    ? `Saved ${savingsPercentage}%`
                    : `Increased ${Math.abs(savingsPercentage)}%`}
                </p>
              )}

              <button
                onClick={downloadResizedImage}
                className="w-full bg-green-600 hover:bg-gray-800 text-white py-3 rounded-lg"
              >
                Download
              </button>

            </div>

          </div>
        </section>
      )}
    </div>
  );
}