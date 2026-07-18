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

  const handleConfirmCapture = async () => {
    if (!draftImage) {
      return;
    }

    const croppedFile = await createCroppedFile(draftImage.file, draftImage.manualCorners, draftImage.rotation);
    const compressed = await imageCompression(croppedFile, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
    });

    const previewUrl = URL.createObjectURL(compressed);
    const nextId = crypto.randomUUID();

    setQueuedImages((prev) => [
      ...prev,
      {
        id: nextId,
        file: compressed,
        previewUrl,
        manualCorners: createDefaultManualCorners(),
        rotation: draftImage.rotation,
      },
    ]);

    if (draftImage.previewUrl) {
      URL.revokeObjectURL(draftImage.previewUrl);
    }

    setActiveImageId(nextId);
    setDraftImage(null);
    setStatus("Page captured. The thumbnail is ready in your gallery.");
  };

  const handleSubmitAll = async () => {
    if (queuedImages.length === 0) {
      return;
    }

    if (isStandaloneMode) {
      setStatus("Captured pages are ready locally. You can review them below or remove them when you are done.");
      return;
    }

    const imagesToUpload = [...queuedImages];

    for (const item of imagesToUpload) {
      const uploaded = await uploadImage(item.file, item.manualCorners);

      if (!uploaded) {
        return;
      }
    }

    setQueuedImages([]);
    setActiveImageId(null);
  };

  const activeImage = queuedImages.find((item) => item.id === activeImageId) ?? null;
  const previewImage = draftImage ?? activeImage;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      {/* Top bar with status and capture button */}
      <div className="border-b border-white/10 bg-slate-900/50 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-300">{status}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGalleryClick}
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-slate-800 p-2 text-white transition hover:bg-slate-700"
              aria-label="Choose from gallery"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageCapture}
            />
            <button
              type="button"
              onClick={handleCameraClick}
              className="inline-flex items-center justify-center rounded-full bg-sky-500 p-2.5 text-white transition hover:bg-sky-600"
              aria-label="Open camera"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
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

      {/* Main preview and adjustment area */}
      {previewImage ? (
        <div className="flex-1 flex min-h-0 flex-col overflow-hidden">
          {/* Image display with corners */}
          <div className="flex-1 min-h-0 flex items-center justify-center bg-slate-800 p-4 overflow-auto">
            <div
              ref={previewContainerRef}
              className="relative w-full max-w-full"
              onPointerMove={handlePreviewPointerMove}
              onPointerUp={handlePreviewPointerUp}
              onPointerLeave={handlePreviewPointerUp}
              style={{ touchAction: "none" }}
            >
              <img
                src={previewImage.previewUrl}
                alt="Preview"
                className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
                style={{ transform: `rotate(${previewImage.rotation}deg)` }}
              />
              <svg className="pointer-events-none absolute inset-0 w-full h-full">
                <polygon
                  points={previewImage.manualCorners
                    .map((point) => `${point.x * 100}% ${point.y * 100}%`)
                    .join(" ")}
                  className="fill-sky-500/15"
                  style={{ stroke: "rgba(56, 189, 248, 0.9)", strokeWidth: 3, strokeDasharray: "12 8" }}
                />
                {previewImage.manualCorners.map((point, index) => {
                  const nextPoint = previewImage.manualCorners[(index + 1) % previewImage.manualCorners.length];
                  return (
                    <line
                      key={`edge-${index}`}
                      x1={`${point.x * 100}%`}
                      y1={`${point.y * 100}%`}
                      x2={`${nextPoint.x * 100}%`}
                      y2={`${nextPoint.y * 100}%`}
                      stroke="rgba(56, 189, 248, 0.9)"
                      strokeWidth={2}
                      strokeDasharray="8 6"
                    />
                  );
                })}
              </svg>
              {previewImage.manualCorners.map((point, index) => (
                <button
                  key={`${index}-${point.x.toFixed(3)}-${point.y.toFixed(3)}`}
                  type="button"
                  aria-label={`Move ${["top-left", "top-right", "bottom-right", "bottom-left"][index]} corner`}
                  className="absolute z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-500 shadow pointer-events-auto"
                  style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
                  onPointerDown={(event) => handlePreviewPointerDown(event, index)}
                />
              ))}
            </div>
          </div>

          {/* Control buttons */}
          <div className="relative z-10 border-t border-white/10 bg-slate-900/70 px-4 py-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleRotatePreview}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-400 bg-slate-700 text-lg text-white transition hover:bg-slate-600"
              aria-label="Rotate image"
            >
              ↻
            </button>
            <button
              onClick={handleRetryCapture}
              className="flex-1 rounded-lg border border-rose-400 px-4 py-2.5 text-sm font-medium text-rose-300 transition hover:bg-rose-950"
            >
              Retry
            </button>
            <button
              onClick={handleConfirmCapture}
              className="flex-1 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600"
            >
              Ok
            </button>
          </div>

          {/* Thumbnails gallery */}
          {queuedImages.length > 0 && (
            <div className="border-t border-white/10 bg-slate-900 px-3 py-3">
              <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory">
                {queuedImages.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex min-w-[70px] snap-start flex-col gap-1.5"
                  >
                    <div className="relative">
                      <img
                        src={item.previewUrl}
                        alt={`Page ${index + 1}`}
                        onClick={() => setActiveImageId(item.id)}
                        className={`h-16 w-16 rounded-lg object-cover cursor-pointer border-2 transition ${
                          activeImageId === item.id ? "border-sky-400" : "border-white/20"
                        }`}
                      />
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs font-medium text-rose-400 hover:text-rose-300"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
          <div className="text-center">
            <p className="text-lg font-semibold text-white mb-2">Ready to capture</p>
            <p className="text-sm text-slate-400 mb-6">Tap the camera button to capture a page and adjust the corners</p>
            <button
              type="button"
              onClick={handleCameraClick}
              className="inline-flex items-center justify-center rounded-full bg-sky-500 p-3 text-white transition hover:bg-sky-600"
              aria-label="Open camera"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Footer with submit button */}
      {queuedImages.length > 0 && (
        <div className="border-t border-white/10 bg-slate-900/70 px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {queuedImages.length} page{queuedImages.length > 1 ? "s" : ""} captured
          </div>
          <button
            type="button"
            onClick={handleSubmitAll}
            disabled={isUploading}
            className="rounded-lg bg-sky-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            {isUploading ? "Submitting..." : "Submit"}
          </button>
        </div>
      )}
    </div>
  );
}