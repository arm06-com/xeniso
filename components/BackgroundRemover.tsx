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

  const [progress, setProgress] =
    useState(0);

  const [backgroundType, setBackgroundType] =
    useState<
      "transparent" | "white" | "black" | "custom"
    >("transparent");

  const [customColor, setCustomColor] =
    useState("#ffffff");

  const [backgroundPreview, setBackgroundPreview] =
    useState<string | null>(null);

  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<any>(null);

  const [aspect, setAspect] =
    useState<number | undefined>(undefined);

  const [activeTab, setActiveTab] =
  useState<"compare" | "crop">(
    "compare"
  );

  const [croppedPreview, setCroppedPreview] =
  useState<string | null>(null);

  useEffect(() => {
    return () => {
        if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        }
    };
  }, [downloadUrl]);

  useEffect(() => {
    applyBackground();
  }, [
    resultPreview,
    backgroundType,
    customColor,
  ]);

  useEffect(() => {
    const updateCrop = async () => {
      if (
        activeTab === "crop" &&
        croppedAreaPixels
      ) {
        const cropped =
          await createCroppedImage();

        setCroppedPreview(cropped);
      }
    };

    updateCrop();
  }, [
    croppedAreaPixels,
    backgroundPreview,
    resultPreview,
  ]);

  const isSupportedImageFile = (selectedFile: File) => {
    if (selectedFile.type.startsWith("image/")) {
      return true;
    }

    return /\.(jpe?g|png|webp)$/i.test(selectedFile.name);
  };

  // Handle File Upload
  const handleFile = (selectedFile: File) => {
    if (!isSupportedImageFile(selectedFile)) {
      alert("Please upload a valid JPG, PNG or WebP image.");
      return;
    }

    if (selectedFile.size === 0) {
      alert("The selected image file is empty or corrupted.");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB

    if (selectedFile.size > maxSize) {
      alert(
        "Please upload an image smaller than 5MB."
      );
      return;
    }
    setResultPreview(null);

    if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
    }

    setDownloadUrl(null);

    setProgress(0);

    setBackgroundPreview(null);
    setBackgroundType("transparent");
    setCustomColor("#ffffff");

    setFile(selectedFile);

    setCroppedPreview(null);

      setCrop({
        x: 0,
        y: 0,
      });

    setZoom(1);

    setActiveTab("compare");

    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;

      if (typeof result === "string") {
        setPreview(result);
      }
    };

    reader.readAsDataURL(selectedFile);
  };
  // Handle Background Removal
  const handleRemoveBackground = async () => {
    if (!file) return;

    try {
      setIsRemoving(true);
      setProgress(10);

      console.log("Starting background removal...");

      const blob = await removeBackground(file);

      console.log("Background removal completed", blob);

      setProgress(90);

      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setResultPreview(url);

      setProgress(100);
    } catch (error: any) {
      console.error("FULL ERROR:", error);
      console.error("MESSAGE:", error?.message);
      console.error("STACK:", error?.stack);

      const message =
        typeof error?.message === "string"
          ? error.message
          : "Failed to remove background.";

      if (message.includes("source image could not be decoded")) {
        alert(
          "Unable to decode this image. Please try another valid JPG, PNG, or WebP file."
        );
      } else {
        alert(message);
      }
    } finally {
      setIsRemoving(false);
      setProgress(0);
    }
  };
 // Apply Background Color
  const applyBackground = () => {
    if (!resultPreview) return;

    const img = new Image();

    img.onload = () => {
      const canvas =
        document.createElement("canvas");

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx =
        canvas.getContext("2d");

      if (!ctx) return;

      if (backgroundType !== "transparent") {
        let color = "#ffffff";

        if (backgroundType === "black") {
          color = "#000000";
        }

        if (backgroundType === "custom") {
          color = customColor;
        }

        ctx.fillStyle = color;

        ctx.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );
      }

      ctx.drawImage(img, 0, 0);

      setBackgroundPreview(
        canvas.toDataURL("image/png")
      );
    };

    img.src = resultPreview;
  };

  // Astect Ratio Calculation
  const cropPresets = [
    {
      label: "Free",
      value: undefined,
    },
    {
      label: "Passport",
      value: 35 / 45,
    },
    {
      label: "Stamp",
      value: 1,
    },
    {
      label: "Instagram",
      value: 1,
    },
    {
      label: "YouTube",
      value: 16 / 9,
    },
  ];
  
  // Create Cropped Image
  const createCroppedImage = async () => {
    if (
      !croppedAreaPixels ||
      !(backgroundPreview || resultPreview)
    ) {
      return null;
    }

    return new Promise<string>((resolve) => {
      const image = new Image();

      image.onload = () => {
        const canvas =
          document.createElement("canvas");

        canvas.width =
          croppedAreaPixels.width;

        canvas.height =
          croppedAreaPixels.height;

        const ctx =
          canvas.getContext("2d");

        if (!ctx) {
          resolve("");
          return;
        }

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

        resolve(
          canvas.toDataURL("image/png")
        );
      };

      image.src =
        backgroundPreview ||
        resultPreview!;
    });
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

            const droppedFile = e.dataTransfer.files?.[0];

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
          <h2 className="text-2xl font-semibold text-black">
            Drag & Drop Your Image
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
            hidden
            accept="image/*"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];

              if (selectedFile) {
                handleFile(selectedFile);
              }
            }}
          />
        </div>
      </section>

      {/* Original Preview */}
      {file && preview && (
        <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-md">

          <div className="grid lg:grid-cols-2 gap-8">

            {/* Preview */}
            <div>
              <h2 className="text-2xl font-bold mb-6 text-black">
                Original Image
              </h2>

              <img
                src={preview}
                alt="Original"
                className="w-full rounded-xl border object-contain max-h-125"
              />
            </div>

            {/* Details */}
            <div className="space-y-6">

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

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gray-100 hover:bg-gray-200 py-3 rounded-lg font-medium cursor-pointer transition"
              >
                Replace Image
              </button>

              <button
                onClick={handleRemoveBackground}
                disabled={isRemoving}
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                {isRemoving
                    ? "Removing Background..."
                    : "Remove Background"}
              </button>

              {isRemoving && (
        <>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                        className="bg-black h-3 transition-all"
                        style={{
                        width: `${progress}%`,
                        }}
                    />
                    </div>

                    <p className="text-sm text-gray-600">
                    Processing...
                    </p>
                </>
                )}

            </div>

          </div>

        </section>
      )}

        {/* Result Preview */}
        {resultPreview && preview && (
            <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-md">

                <h2 className="text-2xl font-bold mb-6 text-black">
                Compare Results
                </h2>

                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() =>
                      setActiveTab("compare")
                    }
                    className={`px-4 py-2 rounded-lg ${
                      activeTab === "compare"
                        ? "bg-black text-white"
                        : "border"
                    }`}
                  >
                    Compare
                  </button>

                  <button
                    onClick={() =>
                      setActiveTab("crop")
                    }
                    className={`px-4 py-2 rounded-lg ${
                      activeTab === "crop"
                        ? "bg-black text-white"
                        : "border"
                    }`}
                  >
                    Crop
                  </button>
                </div>
                <div className="grid lg:grid-cols-3 gap-8">

                  {/* Left Column */}
                  {activeTab === "compare" ? (
                  <div className="max-w-2xl mx-auto border rounded-2xl overflow-hidden bg-gray-50 lg:col-span-2">
                      <p className="text-gray-600 mb-6 text-center p-4 border-black-200 border-b border-dashed">
                          Drag the slider to compare the original image.
                      </p>
                      
                      <ReactCompareSlider
                        className="h-87.5 md:h-112.5 lg:h-137.5"
                        itemOne={
                          <ReactCompareSliderImage
                            src={preview}
                            alt="Original"
                            style={{
                              objectFit: "contain",
                            }}
                          />
                        }
                        itemTwo={
                          <ReactCompareSliderImage
                            src={
                              backgroundPreview ||
                              resultPreview
                            }
                            alt="Removed"
                            style={{
                              objectFit: "contain",
                            }}
                          />
                        }
                      />
                    </div>
                  ) : (
                    <div className="relative h-125 rounded-2xl overflow-hidden border bg-gray-100">
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
                  {/* Right Column */}
                  <div className="mt-6 space-y-6">
                    <label className="block font-medium mb-3 text-black">
                      Background
                    </label>

                    <div className="flex flex-wrap gap-3">

                      <button
                        onClick={() =>
                          setBackgroundType(
                            "transparent"
                          )
                        }
                        className={`px-4 py-2 rounded-lg border ${
                          backgroundType ===
                          "transparent"
                            ? "bg-black text-white"
                            : ""
                        }`}
                      >
                        Transparent
                      </button>

                      <button
                        onClick={() =>
                          setBackgroundType("white")
                        }
                        className={`px-4 py-2 rounded-lg border ${
                          backgroundType ===
                          "white"
                            ? "bg-black text-white"
                            : ""
                        }`}
                      >
                        White
                      </button>

                      <button
                        onClick={() =>
                          setBackgroundType("black")
                        }
                        className={`px-4 py-2 rounded-lg border ${
                          backgroundType ===
                          "black"
                            ? "bg-black text-white"
                            : ""
                        }`}
                      >
                        Black
                      </button>

                      <button
                        onClick={() =>
                          setBackgroundType("custom")
                        }
                        className={`px-4 py-2 rounded-lg border ${
                          backgroundType ===
                          "custom"
                            ? "bg-black text-white"
                            : ""
                        }`}
                      >
                        Custom
                      </button>

                    </div>

                    {backgroundType === "custom" && (
                      <input
                        type="color"
                        value={customColor}
                        onChange={(e) =>
                          setCustomColor(
                            e.target.value
                          )
                        }
                        className="mt-4 h-12 cursor-pointer w-full"
                      />
                    )}

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
                          Passport (35×45)
                        </option>
                        <option value="stamp">
                          Stamp (1:1)
                        </option>
                        <option value="instagram">
                          Instagram (1:1)
                        </option>
                        <option value="youtube">
                          YouTube (16:9)
                        </option>
                      </select>

                      <div className="mt-4">
                        <label className="block font-medium mb-2">
                          Zoom ({zoom.toFixed(1)}×)
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

                <div className="mt-6 grid md:grid-cols-2 gap-4">

                <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">
                    Original
                    </p>

                    <p className="font-semibold">
                    {file?.name}
                    </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">
                    Result
                    </p>

                    <p className="font-semibold ">
                    Transparent PNG
                    </p>
                </div>

                </div>

                <button
                onClick={() => {
                    if (!downloadUrl) return;

                    const link =
                    document.createElement("a");

                    link.href =
                      activeTab === "crop" &&
                      croppedPreview
                        ? croppedPreview
                        : backgroundPreview ||
                          downloadUrl!;

                    const baseName =
                      file?.name.replace(
                        /\.[^/.]+$/,
                        ""
                      ) || "image";

                    const suffix =
                      activeTab === "crop"
                        ? "cropped"
                        : backgroundType;

                    link.download =
                      `${baseName}-${suffix}.png`;

                    link.click();
                }}
                className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium cursor-pointer"
                >
                 Download PNG
                </button>

            </section>
        )}
    </div>
  );
}