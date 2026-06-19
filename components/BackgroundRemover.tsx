"use client";

import { useRef, useState } from "react";
import { useEffect } from "react";
import { removeBackground } from "@imgly/background-removal";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";
import Cropper from "react-easy-crop";

export default function BackgroundRemover() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const [resultPreview, setResultPreview] =
    useState<string | null>(null);

  const [downloadUrl, setDownloadUrl] =
    useState<string | null>(null);

  const [progress, setProgress] = useState(0);

  const [backgroundType, setBackgroundType] =
    useState<"transparent" | "white" | "black" | "custom">("transparent");

  const [customColor, setCustomColor] = useState("#ffffff");

  const [backgroundPreview, setBackgroundPreview] =
    useState<string | null>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [aspect, setAspect] = useState<number | undefined>(undefined);

  const [activeTab, setActiveTab] =
    useState<"compare" | "crop">("compare");

  const [croppedPreview, setCroppedPreview] =
    useState<string | null>(null);

  const [edgeSmoothness, setEdgeSmoothness] =
  useState(0.5);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  useEffect(() => {
    applyBackground();
  }, [
    resultPreview,
    backgroundType,
    customColor,
    edgeSmoothness,
  ]);

  useEffect(() => {
    const updateCrop = async () => {
      if (activeTab === "crop" && croppedAreaPixels) {
        const cropped = await createCroppedImage();
        setCroppedPreview(cropped);
      }
    };

    updateCrop();
  }, [croppedAreaPixels, backgroundPreview, resultPreview]);

  const isSupportedImageFile = (selectedFile: File) => {
    if (selectedFile.type.startsWith("image/")) return true;
    return /\.(jpe?g|png|webp)$/i.test(selectedFile.name);
  };

  const handleFile = (selectedFile: File) => {
    if (!isSupportedImageFile(selectedFile)) {
      alert("Please upload a valid JPG, PNG or WebP image.");
      return;
    }

    if (selectedFile.size === 0) {
      alert("The selected image file is empty or corrupted.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      alert("Please upload an image smaller than 5MB.");
      return;
    }

    setResultPreview(null);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);

    setProgress(0);
    setBackgroundPreview(null);
    setBackgroundType("transparent");
    setCustomColor("#ffffff");

    setFile(selectedFile);
    setCroppedPreview(null);

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setActiveTab("compare");

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") setPreview(result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleRemoveBackground = async () => {
    if (!file) return;

    try {
      setIsRemoving(true);
      setProgress(10);

      const blob = await removeBackground(file);

      setProgress(90);

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setResultPreview(url);

      setProgress(100);
    } catch (error: any) {
      alert(error?.message || "Failed to remove background.");
    } finally {
      setIsRemoving(false);
      setProgress(0);
    }
  };

  const applyBackground = () => {
    if (!resultPreview) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (backgroundType !== "transparent") {
        let color = "#ffffff";
        if (backgroundType === "black") color = "#000000";
        if (backgroundType === "custom") color = customColor;

        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.filter = `blur(${edgeSmoothness}px)`;
      ctx.drawImage(img, 0, 0);
      ctx.filter = "none";

      setBackgroundPreview(canvas.toDataURL("image/png"));
    };

    img.src = resultPreview;
  };

  const cropPresets = [
    { label: "Free", value: undefined },
    { label: "Passport", value: 35 / 45 },
    { label: "Stamp", value: 1 },
    { label: "Instagram", value: 1 },
    { label: "YouTube", value: 16 / 9 },
  ];

  const createCroppedImage = async () => {
    if (!croppedAreaPixels || !(backgroundPreview || resultPreview)) {
      return null;
    }

    return new Promise<string>((resolve) => {
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");

        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve("");

        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );

        resolve(canvas.toDataURL("image/png"));
      };

      image.src = backgroundPreview || resultPreview!;
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* Upload */}
      <section className="bg-white border rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-md">
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
            const droppedFile = e.dataTransfer.files?.[0];
            if (droppedFile) handleFile(droppedFile);
          }}
          className={`border-2 border-dashed rounded-xl sm:rounded-2xl p-6 sm:p-12 text-center cursor-pointer transition ${
            isDragging
              ? "border-black bg-gray-50"
              : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          <h2 className="text-lg sm:text-2xl font-semibold text-black">
            Drag & Drop Your Image
          </h2>

          <p className="mt-2 text-sm sm:text-base text-orange-500">
            or click to select a file
          </p>

          <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500">
            Supports JPG, PNG and WebP
          </p>

          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) handleFile(selectedFile);
            }}
          />
        </div>
      </section>

      {/* Original */}
      {file && preview && (
        <section className="bg-white border rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-md">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">

            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-black">
                Original Image
              </h2>

              <img
                src={preview}
                className="w-full rounded-xl border object-contain max-h-75 sm:max-h-125 lg:max-h-125"
              />
            </div>

            <div className="space-y-4 sm:space-y-6">

              <div>
                <span className="font-semibold text-gray-600">File Name:</span>
                <p className="text-gray-600 break-all text-sm sm:text-base">
                  {file.name}
                </p>
              </div>

              <div>
                <span className="font-semibold text-gray-600">File Size:</span>
                <p className="text-gray-600 text-sm sm:text-base">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gray-100 hover:bg-gray-200 py-3 rounded-lg text-sm text-black transition"
              >
                Replace Image
              </button>

              <button
                onClick={handleRemoveBackground}
                disabled={isRemoving}
                className="w-full bg-black hover:bg-gray-600 text-white py-3 rounded-lg text-sm sm:text-base"
              >
                {isRemoving ? "Removing..." : "Remove Background"}
              </button>

              {isRemoving && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-black h-2"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>
      )}

      {/* Result */}
      {resultPreview && preview && (
        <section className="bg-white border rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-md">

          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-black">
            Compare Results
          </h2>

          <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
            <button
              onClick={() => setActiveTab("compare")}
              className={`px-3 sm:px-4 py-2 text-sm rounded-lg border ${
                activeTab === "compare"
                  ? "bg-black text-white"
                  : "text-gray-600"
              }`}
            >
              Compare
            </button>

            <button
              onClick={() => setActiveTab("crop")}
              className={`px-3 sm:px-4 py-2 text-sm rounded-lg border ${
                activeTab === "crop"
                  ? "bg-black text-white"
                  : "text-gray-600"
              }`}
            >
              Crop
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">

            <div className="lg:col-span-2">
              {activeTab === "compare" ? (
              <div className="rounded-xl overflow-hidden">
                <ReactCompareSlider
                  className="h-90 sm:h-125 lg:h-190"
                  itemOne={<ReactCompareSliderImage src={preview} />}
                  itemTwo={<ReactCompareSliderImage src={backgroundPreview || resultPreview} />}
                />
              </div>
              ) : (
                <div className="relative h-75 sm:h-100 lg:h-125 rounded-xl overflow-hidden border bg-gray-100">
                  <Cropper
                    image={
                      backgroundPreview ||
                      resultPreview
                    }
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(
                      _,
                      croppedAreaPixels
                    ) =>
                      setCroppedAreaPixels(
                        croppedAreaPixels
                      )
                    }
                  />
                </div>
              )}
            </div>

            <div className="space-y-4 sm:space-y-6">

              <div>
                <label className="block font-medium text-black">Background</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["transparent", "white", "black", "custom"].map((type) => (
                    <button
                      key={type}
                      onClick={() =>
                        setBackgroundType(
                          type as
                            | "transparent"
                            | "white"
                            | "black"
                            | "custom"
                        )
                      }
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        backgroundType === type
                          ? "bg-black text-white"
                          : "text-gray-600"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                  {backgroundType === "custom" && (
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) =>
                        setCustomColor(e.target.value)
                      }
                      className="mt-4 h-12 w-full cursor-pointer"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block font-medium mb-2 text-black">
                  Edge Smoothness ({edgeSmoothness.toFixed(1)}px)
                </label>

                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={edgeSmoothness}
                  onChange={(e) =>
                    setEdgeSmoothness(
                      Number(e.target.value)
                    )
                  }
                  className="w-full"
                />

                <p className="text-xs text-gray-500 mt-1">
                  Helps reduce white edges after
                  background removal.
                </p>
              </div>

              {activeTab === "crop" && (
                <>
                  <label className="block font-medium text-black">
                    Crop Ratio
                  </label>

                  <select
                    className="w-full border rounded-lg px-4 py-3"
                    onChange={(e) => {
                      switch (e.target.value) {
                        case "passport":
                          setAspect(35 / 45);
                          break;

                        case "stamp":
                          setAspect(1);
                          break;

                        case "instagram":
                          setAspect(1);
                          break;

                        case "youtube":
                          setAspect(16 / 9);
                          break;

                        default:
                          setAspect(undefined);
                      }
                    }}
                  >
                    <option value="free">Free</option>
                    <option value="passport">
                      Passport
                    </option>
                    <option value="stamp">
                      Stamp
                    </option>
                    <option value="instagram">
                      Instagram
                    </option>
                    <option value="youtube">
                      YouTube
                    </option>
                  </select>

                  <div>
                    <label className="block font-medium mb-2">
                      Zoom ({zoom.toFixed(1)}x)
                    </label>

                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) =>
                        setZoom(
                          Number(e.target.value)
                        )
                      }
                      className="w-full"
                    />
                  </div>
                </>
              )}

            </div>
          </div>

          <button
            onClick={() => {
              const link =
                document.createElement("a");

              link.href =
                activeTab === "crop" &&
                croppedPreview
                  ? croppedPreview
                  : backgroundPreview ||
                    downloadUrl!;

              link.download =
                "background-removed.png";

              link.click();
            }}
            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium"
          >
            Download PNG
          </button>

        </section>
      )}

    </div>
  );
}