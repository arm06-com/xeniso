"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useParams } from "next/navigation";
import imageCompression from "browser-image-compression";

type Point = {
  x: number;
  y: number;
};

type QueuedImage = {
  id: string;
  file: File;
  previewUrl: string;
  manualCorners: Point[];
  rotation: number;
};

const createDefaultManualCorners = (): Point[] => [
  { x: 0.08, y: 0.08 },
  { x: 0.92, y: 0.08 },
  { x: 0.92, y: 0.92 },
  { x: 0.08, y: 0.92 },
];

const createImageFromFile = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    image.src = objectUrl;
  });

const rotateImageFile = async (file: File, rotation: number) => {
  if (rotation % 360 === 0) {
    return file;
  }

  const image = await createImageFromFile(file);
  const width = image.naturalWidth || image.width || 1;
  const height = image.naturalHeight || image.height || 1;
  const isLandscape = rotation % 180 !== 0;
  const canvas = document.createElement("canvas");
  canvas.width = isLandscape ? height : width;
  canvas.height = isLandscape ? width : height;
  const context = canvas.getContext("2d");

  if (!context) {
    return file;
  }

  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(image, -width / 2, -height / 2, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.95);
  });

  if (!blob) {
    return file;
  }

  return new File([blob], file.name.replace(/\.(jpe?g|png|heic|heif)$/i, ".jpg"), {
    type: "image/jpeg",
  });
};

const createCroppedFile = async (file: File, points: Point[], rotation = 0) => {
  if (points.length !== 4) {
    return file;
  }

  const rotatedFile = await rotateImageFile(file, rotation);
  const image = await createImageFromFile(rotatedFile);
  const width = image.naturalWidth || image.width || 1;
  const height = image.naturalHeight || image.height || 1;

  const scaledPoints = points.map((point) => ({
    x: Math.max(0, Math.min(1, point.x)) * width,
    y: Math.max(0, Math.min(1, point.y)) * height,
  }));

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  scaledPoints.forEach((point) => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });

  const padding = 12;
  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropWidth = Math.max(60, Math.min(width - cropX, maxX - cropX + padding * 2));
  const cropHeight = Math.max(60, Math.min(height - cropY, maxY - cropY + padding * 2));

  const canvas = document.createElement("canvas");
  canvas.width = cropWidth;
  canvas.height = cropHeight;
  const context = canvas.getContext("2d");

  if (!context) {
    return file;
  }

  context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.95);
  });

  if (!blob) {
    return file;
  }

  return new File([blob], file.name.replace(/\.(jpe?g|png|heic|heif)$/i, ".jpg"), {
    type: "image/jpeg",
  });
};

export default function MobilePage() {
  const params = useParams();
  const sessionId = params.sessionId as string | undefined;
  const isStandaloneMode = !sessionId;
  const [status, setStatus] = useState(sessionId ? "Connecting to desktop..." : "Direct capture mode enabled. Capture a page and review it here without a QR session.");
  const [isUploading, setIsUploading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const [queuedImages, setQueuedImages] = useState<QueuedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [activeCornerIndex, setActiveCornerIndex] = useState<number | null>(null);
  const [draftImage, setDraftImage] = useState<QueuedImage | null>(null);
  const queuedImagesRef = useRef<QueuedImage[]>([]);

  useEffect(() => {
    queuedImagesRef.current = queuedImages;
  }, [queuedImages]);

  useEffect(() => {
    return () => {
      queuedImagesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  useEffect(() => {
    const connectToDesktop = async () => {
      try {
        const response = await fetch("/api/pdf-scanner/connect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        });

        if (response.ok) {
          setStatus("Connected. Scan a page to send it to the desktop workspace.");
        } else {
          setStatus("Connection failed. Please reopen the session.");
        }
      } catch {
        setStatus("Connection failed. Please reopen the session.");
      }
    };

    if (sessionId) {
      void connectToDesktop();
    }
  }, [sessionId]);

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const updateActiveCorner = (clientX: number, clientY: number) => {
    if (activeCornerIndex === null || !previewContainerRef.current) {
      return;
    }

    const rect = previewContainerRef.current.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((clientY - rect.top) / rect.height, 0, 1);

    if (draftImage) {
      setDraftImage((prev) =>
        prev
          ? {
              ...prev,
              manualCorners: prev.manualCorners.map((point, index) =>
                index === activeCornerIndex ? { x, y } : point
              ),
            }
          : prev
      );
      return;
    }

    if (!activeImageId) {
      return;
    }

    setQueuedImages((prev) =>
      prev.map((item) => {
        if (item.id !== activeImageId) {
          return item;
        }

        return {
          ...item,
          manualCorners: item.manualCorners.map((point, index) =>
            index === activeCornerIndex ? { x, y } : point
          ),
        };
      })
    );
  };

  const uploadImage = async (file: File, points: Point[] = []): Promise<boolean> => {
    try {
      setIsUploading(true);
      setStatus("Preparing page...");

      if (isStandaloneMode) {
        const preparedFile = await createCroppedFile(file, points, 0);
        const compressed = await imageCompression(preparedFile, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
        });

        const previewUrl = URL.createObjectURL(compressed);
        const nextId = crypto.randomUUID();

        setQueuedImages((prev) => {
          return [...prev, { id: nextId, file: compressed, previewUrl, manualCorners: createDefaultManualCorners(), rotation: 0 }];
        });

        setActiveImageId(nextId);
        setStatus("Page captured locally. Adjust the corners and review it below.");
        setIsUploading(false);
        return true;
      }

      const preparedFile = await createCroppedFile(file, points);
      const compressed = await imageCompression(preparedFile, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });

      const reader = new FileReader();

      return await new Promise<boolean>((resolve) => {
        reader.onloadend = async () => {
          try {
            const response = await fetch("/api/pdf-scanner/upload", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sessionId,
                image: reader.result,
              }),
            });

            if (response.ok) {
              setStatus("Page uploaded. Capture the next page when ready.");
              resolve(true);
            } else {
              setStatus("Upload failed. Please retry.");
              resolve(false);
            }
          } catch {
            setStatus("Upload failed. Please retry.");
            resolve(false);
          } finally {
            setIsUploading(false);
          }
        };

        reader.onerror = () => {
          setStatus("Upload failed. Please retry.");
          setIsUploading(false);
          resolve(false);
        };

        reader.readAsDataURL(compressed);
      });
    } catch {
      setStatus("Unable to process the image. Please try again.");
      setIsUploading(false);
      return false;
    }
  };

  const handlePreviewPointerDown = (
    event: ReactPointerEvent<HTMLElement>,
    cornerIndex: number
  ) => {
    if (!previewImage) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    previewContainerRef.current?.setPointerCapture(event.pointerId);
    setActiveCornerIndex(cornerIndex);
  };

  const handlePreviewPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (activeCornerIndex === null) {
      return;
    }

    event.preventDefault();
    updateActiveCorner(event.clientX, event.clientY);
  };

  const handlePreviewPointerUp = () => {
    setActiveCornerIndex(null);
  };

  const handleRotatePreview = () => {
    if (!draftImage) {
      return;
    }

    setDraftImage((prev) => (prev ? { ...prev, rotation: (prev.rotation + 90) % 360 } : prev));
  };

  const prepareDraftImage = async (file: File) => {
    const previewUrl = URL.createObjectURL(file);

    setDraftImage({
      id: crypto.randomUUID(),
      file,
      previewUrl,
      manualCorners: createDefaultManualCorners(),
      rotation: 0,
    });
  };

  const handleImageCapture = async (event: { target: HTMLInputElement }) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (draftImage?.previewUrl) {
      URL.revokeObjectURL(draftImage.previewUrl);
    }

    await prepareDraftImage(file);
    event.target.value = "";
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  const handleDelete = (imageId: string) => {
    setQueuedImages((prev) => {
      const targetItem = prev.find((item) => item.id === imageId);

      if (targetItem?.previewUrl) {
        URL.revokeObjectURL(targetItem.previewUrl);
      }

      const nextImages = prev.filter((item) => item.id !== imageId);

      if (nextImages.length === 0) {
        setActiveImageId(null);
      } else if (activeImageId === imageId) {
        setActiveImageId(nextImages[0].id);
      }

      return nextImages;
    });
  };

  const handleRetryCapture = () => {
    if (draftImage?.previewUrl) {
      URL.revokeObjectURL(draftImage.previewUrl);
    }

    setDraftImage(null);
    setActiveCornerIndex(null);

    window.setTimeout(() => {
      cameraInputRef.current?.click();
    }, 120);
  };

  const activeImage = queuedImages.find((item) => item.id === activeImageId) ?? null;
  const previewImage = draftImage ?? activeImage;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">

      {/* Header */}
      <div className="border-b border-white/10 bg-slate-900 px-4 py-3">
        <div className="flex items-center justify-between">

          <p className="text-sm text-slate-300 truncate">
            {status}
          </p>

          <div className="flex gap-2">

            {/* Gallery */}
            <button
              type="button"
              onClick={handleGalleryClick}
              className="rounded-full border border-white/20 bg-slate-800 p-2"
            >
              📁
            </button>

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageCapture}
            />

            {/* Camera */}
            <button
              type="button"
              onClick={handleCameraClick}
              className="rounded-full bg-sky-600 p-2 text-white"
            >
              📷
            </button>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageCapture}
            />

          </div>

        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex flex-col">

        {previewImage ? (

          <div className="flex flex-col flex-1">

            {/* Image */}
            <div className="flex-1 bg-slate-800 flex items-center justify-center p-3 overflow-auto">

              <div
                ref={previewContainerRef}
                className="relative w-full"
                onPointerMove={handlePreviewPointerMove}
                onPointerUp={handlePreviewPointerUp}
                onPointerLeave={handlePreviewPointerUp}
                style={{ touchAction: "none" }}
              >

                <img
                  src={previewImage.previewUrl}
                  alt="Preview"
                  className="w-full max-h-[65vh] object-contain rounded-lg"
                  style={{
                    transform: `rotate(${previewImage.rotation}deg)`
                  }}
                />

                <svg className="pointer-events-none absolute inset-0 w-full h-full">

                  <polygon
                    points={previewImage.manualCorners
                      .map(
                        (point) =>
                          `${point.x * 100}% ${point.y * 100}%`
                      )
                      .join(" ")}
                    className="fill-sky-500/15"
                    style={{
                      stroke: "#38bdf8",
                      strokeWidth: 3,
                      strokeDasharray: "10 6",
                    }}
                  />

                  {previewImage.manualCorners.map((point, index) => {

                    const next =
                      previewImage.manualCorners[
                        (index + 1) %
                          previewImage.manualCorners.length
                      ];

                    return (
                      <line
                        key={index}
                        x1={`${point.x * 100}%`}
                        y1={`${point.y * 100}%`}
                        x2={`${next.x * 100}%`}
                        y2={`${next.y * 100}%`}
                        stroke="#38bdf8"
                        strokeWidth={2}
                        strokeDasharray="8 5"
                      />
                    );
                  })}
                </svg>

                {previewImage.manualCorners.map((point, index) => (

                  <button
                    key={index}
                    type="button"
                    onPointerDown={(e) =>
                      handlePreviewPointerDown(e, index)
                    }
                    className="absolute h-5 w-5 rounded-full bg-sky-500 border-2 border-white -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${point.x * 100}%`,
                      top: `${point.y * 100}%`,
                    }}
                  />

                ))}

              </div>

            </div>

            {/* Buttons */}
            <div className="border-t border-white/10 bg-slate-900 p-3">

              <div className="grid grid-cols-4 gap-2">

                <button
                  onClick={handleRotatePreview}
                  className="rounded-lg bg-slate-700 py-2"
                >
                  ↻
                  <div className="text-xs">Rotate</div>
                </button>

                <button
                  onClick={() => {
                    if (draftImage?.previewUrl) {
                      URL.revokeObjectURL(draftImage.previewUrl);
                    }

                    setDraftImage(null);

                    window.setTimeout(() => {
                      cameraInputRef.current?.click();
                    }, 200);
                  }}
                  className="rounded-lg bg-amber-600 py-2"
                >
                  📷
                  <div className="text-xs">Retake</div>
                </button>

                <button
                  onClick={() => {
                    if (draftImage?.previewUrl) {
                      URL.revokeObjectURL(draftImage.previewUrl);
                    }

                    setDraftImage(null);

                    setStatus("Capture cancelled.");

                    window.setTimeout(() => {
                      cameraInputRef.current?.click();
                    }, 200);
                  }}
                  className="rounded-lg bg-red-600 py-2"
                >
                  🗑
                  <div className="text-xs">Delete</div>
                </button>

                <button
                  onClick={async () => {
                    if (!previewImage) return;

                    const cropped = await createCroppedFile(
                      previewImage.file,
                      previewImage.manualCorners,
                      previewImage.rotation
                    );

                    const compressed = await imageCompression(cropped, {
                      maxSizeMB: 0.5,
                      maxWidthOrHeight: 1600,
                      useWebWorker: true,
                    });

                    if (isStandaloneMode) {
                      setQueuedImages([
                        {
                          id: crypto.randomUUID(),
                          file: compressed,
                          previewUrl: URL.createObjectURL(compressed),
                          manualCorners: createDefaultManualCorners(),
                          rotation: 0,
                        },
                      ]);

                      setActiveImageId(null);

                      if (draftImage?.previewUrl) {
                        URL.revokeObjectURL(draftImage.previewUrl);
                      }

                      setDraftImage(null);

                      setStatus("Page saved.");
                    } else {
                      await uploadImage(compressed);
                    }
                  }}
                  className="rounded-lg bg-green-600 py-2"
                >
                  ⬆
                  <div className="text-xs">Submit</div>
                </button>

              </div>

            </div>

            {/* Thumbnails */}
            {queuedImages.length > 0 && (

              <div className="border-t border-white/10 bg-slate-900 px-2 py-2">

                <div className="flex gap-2 overflow-x-auto">

                  {queuedImages.map((item) => (

                    <div
                      key={item.id}
                      className="relative flex-shrink-0"
                    >

                      <img
                        src={item.previewUrl}
                        onClick={() =>
                          setActiveImageId(item.id)
                        }
                        className={`h-16 w-16 rounded-lg object-cover border-2 ${
                          activeImageId === item.id
                            ? "border-sky-500"
                            : "border-gray-700"
                        }`}
                      />

                      <button
                        onClick={() =>
                          handleDelete(item.id)
                        }
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-600 text-xs"
                      >
                        ×
                      </button>

                    </div>

                  ))}

                </div>

              </div>

            )}

          </div>

        ) : (

          <div className="flex-1 flex items-center justify-center">

            <button
              type="button"
              onClick={handleCameraClick}
              className="rounded-full bg-sky-600 px-8 py-6 text-xl font-semibold"
            >
              📷 Open Camera
            </button>

          </div>

        )}

      </div>

    </div>
  );
}