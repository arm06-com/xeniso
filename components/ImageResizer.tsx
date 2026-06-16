"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

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
  // States
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const [maintainAspectRatio, setMaintainAspectRatio] =
    useState(true);

  const [selectedPreset, setSelectedPreset] =
    useState("Custom");

  const [resizedPreview, setResizedPreview] =
  useState<string | null>(null);

  const [downloadUrl, setDownloadUrl] =
  useState<string | null>(null);

  const [resizedSize, setResizedSize] =
  useState<number | null>(null);

  const [isResizing, setIsResizing] =
  useState(false);

  const [progress, setProgress] =
  useState(0);

  const [quality, setQuality] = useState(92);

  const [resizePercentage, setResizePercentage] =
  useState(100);

  const [savingsPercentage, setSavingsPercentage] =
  useState<number | null>(null);

  useEffect(() => {
    return () => {
        if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        }
    };
  }, [downloadUrl]);

  // Handle File Upload
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
      const result = e.target?.result;

      if (typeof result !== "string") {
        return;
      }

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

  // Width Change
  const handleWidthChange = (value: number) => {
    setWidth(value);

    if (maintainAspectRatio && originalWidth) {
      setHeight(
        Math.round(
          value * (originalHeight / originalWidth)
        )
      );
    }
  };

  // Height Change
  const handleHeightChange = (value: number) => {
    setHeight(value);

    if (maintainAspectRatio && originalHeight) {
      setWidth(
        Math.round(
          value * (originalWidth / originalHeight)
        )
      );
    }
  };

  // Preset Selection
  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);

    const preset = presets.find(
      (p) => p.name === presetName
    );

    if (preset && preset.name !== "Custom") {
      setWidth(preset.width);
      setHeight(preset.height);
    }
  };
  // Percentage Change
  const handlePercentageChange = (
    percentage: number
    ) => {
    if (!originalWidth || !originalHeight) {
        return;
    }

    setResizePercentage(percentage);

    const newWidth = Math.round(
        originalWidth * (percentage / 100)
    );

    const newHeight = Math.round(
        originalHeight * (percentage / 100)
    );

    setWidth(newWidth);
    setHeight(newHeight);
  };

  // Resize Image
  const resizeImage = async () => {
    if (!preview || !file || width <= 0 || height <= 0) {
        return;
    }

    setIsResizing(true);
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

    try {
        const img = new Image();

        img.onload = () => {
        const canvas =
            document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const ctx =
            canvas.getContext("2d");

        if (!ctx) {
            clearInterval(interval);
            setIsResizing(false);
            return;
        }

        ctx.drawImage(
            img,
            0,
            0,
            width,
            height
        );

        canvas.toBlob(
            (blob) => {
            if (!blob) {
                clearInterval(interval);
                setIsResizing(false);
                return;
            }

            const objectUrl =
                URL.createObjectURL(blob);

            setDownloadUrl(objectUrl);

            setResizedSize(blob.size);

            const savings =
                ((file.size - blob.size) /
                    file.size) *
                100;

                setSavingsPercentage(
                Number(savings.toFixed(1))
            );

            const reader =
                new FileReader();

            reader.onload = () => {
                setResizedPreview(
                reader.result as string
                );

                clearInterval(interval);

                setProgress(100);

                setTimeout(() => {
                setProgress(0);
                }, 500);

                setIsResizing(false);
            };

            reader.readAsDataURL(blob);
            },
            file.type,
            quality / 100
        );
        };

        img.src = preview;
    } catch (error) {
        console.error(error);

        clearInterval(interval);

        setIsResizing(false);
    }
  };

  // Download Resized Image
  const downloadResizedImage = () => {
    if (!downloadUrl || !file) {
        return;
    }

    const link =
        document.createElement("a");

    const baseName =
        file.name.replace(/\.[^/.]+$/, "");

    const extension =
        file.name.split(".").pop();

    link.href = downloadUrl;

    link.download =
        `${baseName}-resized.${extension}`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">

      {/* Upload Area */}
      <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-md">
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

            const droppedFile =
              e.dataTransfer.files?.[0];

            if (droppedFile) {
              handleFile(droppedFile);
            }
          }}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${
            isDragging
              ? "border-black bg-gray-50"
              : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          <h2 className="text-2xl font-semibold">
            Drag & Drop Image to Resize
          </h2>

          <p className="mt-2 text-gray-600">
            or click to select a file
          </p>

          <p className="mt-4 text-sm text-gray-500">
            Supports JPG, PNG and WebP
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const selectedFile =
                e.target.files?.[0];

              if (selectedFile) {
                handleFile(selectedFile);
              }
            }}
          />
        </div>
      </section>

      {/* Resize Settings */}
      {preview && (
        <section className="bg-white border rounded-2xl p-8 shadow-md">
          <h2 className="text-2xl font-bold mb-6">
            Resize Settings
          </h2>

          <div className="grid md:grid-cols-2 gap-6">

            <div>
                <label className="block font-medium mb-2">
                    Preset
                </label>

                <select
                    value={selectedPreset}
                    onChange={(e) =>
                    handlePresetChange(e.target.value)
                    }
                    className="w-full border rounded-lg px-4 py-3"
                >
                    {presets.map((preset) => (
                    <option
                        key={preset.name}
                        value={preset.name}
                    >
                        {preset.name}
                    </option>
                    ))}
                </select>

                {selectedPreset !== "Custom" && (
                    <div className="mt-3 inline-block bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                    Preset: {selectedPreset}
                    </div>
                )}
            </div>

            <div>
                <label className="block font-medium mb-2">
                    Resize Percentage
                </label>

                <select
                    value={resizePercentage}
                    onChange={(e) =>
                    handlePercentageChange(
                        Number(e.target.value)
                    )
                    }
                    className="w-full border rounded-lg px-4 py-3"
                >
                    <option value={25}>25%</option>
                    <option value={50}>50%</option>
                    <option value={75}>75%</option>
                    <option value={100}>100%</option>
                    <option value={150}>150%</option>
                    <option value={200}>200%</option>
                </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={maintainAspectRatio}
                  onChange={(e) =>
                    setMaintainAspectRatio(
                      e.target.checked
                    )
                  }
                />

                Maintain Aspect Ratio
              </label>
            </div>

            <div>
              <label className="block font-medium mb-2">
                Width (px)
              </label>

              <input
                type="number"
                value={width}
                min={1}
                onChange={(e) =>
                  handleWidthChange(
                    Number(e.target.value)
                  )
                }
                className="w-full border rounded-lg px-4 py-3"
              />
            </div>

            <div>
              <label className="block font-medium mb-2">
                Height (px)
              </label>

              <input
                type="number"
                value={height}
                min={1}
                onChange={(e) =>
                  handleHeightChange(
                    Number(e.target.value)
                  )
                }
                className="w-full border rounded-lg px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
                <label className="block font-medium mb-2">
                    Output Quality: {quality}%
                </label>

                <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={(e) =>
                    setQuality(Number(e.target.value))
                    }
                    className="w-full"
                />

                <p className="text-sm text-gray-500 mt-1">
                    Lower quality = smaller file size.
                </p>
            </div>

            <div className="md:col-span-2">
                <button
                    onClick={resizeImage}
                    disabled={isResizing}
                    className="w-full bg-black text-white py-3 rounded-lg font-medium cursor-pointer disabled:bg-gray-400"
                >
                    {isResizing
                    ? "Resizing..."
                    : "Resize Image"}
                </button>
            </div>
            {isResizing && (
                <div className="md:col-span-2">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mt-4">
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

          </div>
        </section>
      )}

      {/* Original Information */}
      {preview && file && (
        <section className="bg-white border rounded-2xl p-8 shadow-md">
          <h2 className="text-2xl font-bold mb-6">
            Original Image
          </h2>

          <div className="grid lg:grid-cols-2 gap-8">

            <img
              src={preview}
              alt="Original"
              className="rounded-xl border max-h-100 w-full object-contain"
            />

            <div className="space-y-4">

              <p>
                <strong>Dimensions:</strong>{" "}
                {originalWidth} × {originalHeight}px
              </p>

              <p>
                <strong>File Size:</strong>{" "}
                {(file.size / 1024).toFixed(1)} KB
              </p>

              <p>
                <strong>Expected New Size:</strong>{" "}
                {width} × {height}px
              </p>

            </div>

          </div>
        </section>
      )}

      {/* Resized Preview */}
      {resizedPreview && file && (
        <section className="bg-white border rounded-2xl p-8 shadow-md">
            <h2 className="text-2xl font-bold mb-6">
            Resized Image
            </h2>

            <div className="grid lg:grid-cols-2 gap-8">

            <img
                src={resizedPreview}
                alt="Resized"
                className="rounded-xl border max-h-100 w-full object-contain"
            />

            <div className="space-y-4">

                <p>
                <strong>Dimensions:</strong>{" "}
                {width} × {height}px
                </p>

                <p>
                <strong>File Size:</strong>{" "}
                {resizedSize
                    ? `${(
                        resizedSize / 1024
                    ).toFixed(1)} KB`
                    : "-"}
                </p>

                <div className="space-y-2">

                    <p>
                        <strong>Original:</strong>{" "}
                        {(file.size / 1024).toFixed(1)} KB
                    </p>

                    <p>
                        <strong>Resized:</strong>{" "}
                        {resizedSize
                        ? `${(
                            resizedSize / 1024
                            ).toFixed(1)} KB`
                        : "-"}
                    </p>

                    {savingsPercentage !== null && (
                        <p
                        className={`font-semibold ${
                            savingsPercentage > 0
                            ? "text-green-600"
                            : "text-orange-600"
                        }`}
                        >
                        {savingsPercentage > 0
                            ? `Saved ${savingsPercentage}%`
                            : `File size increased by ${Math.abs(
                                savingsPercentage
                            )}%`}
                        </p>
                    )}

                </div>

                <button
                onClick={downloadResizedImage}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium cursor-pointer"
                >
                Download Resized Image
                </button>

            </div>

            </div>
        </section>
       )}

    </div>
  );
}