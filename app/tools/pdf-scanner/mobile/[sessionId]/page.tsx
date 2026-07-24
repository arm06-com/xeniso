"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useParams } from "next/navigation";
import imageCompression from "browser-image-compression";
import { Camera, Images, RotateCw, Trash2, Upload } from "lucide-react";

type Point = {
  x: number;
  y: number;
};

type QueuedImage = {
  id: string;
  file: File;
  sourceFile: File;
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
  const cameraInputId = "mobile-camera-input";
  const galleryInputId = "mobile-gallery-input";
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const [queuedImages, setQueuedImages] = useState<QueuedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [activeCornerIndex, setActiveCornerIndex] = useState<number | null>(null);
  const [draftImage, setDraftImage] = useState<QueuedImage | null>(null);
  const [selectionCorners, setSelectionCorners] = useState<Point[]>(createDefaultManualCorners());
  const [previewHeightClass, setPreviewHeightClass] = useState("h-[46vh]");
  const queuedImagesRef = useRef<QueuedImage[]>([]);
  const latestPreviewStateRef = useRef<{ corners: Point[]; rotation: number } | null>(null);

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
      const nextCorners = selectionCorners.map((point, index) =>
        index === activeCornerIndex ? { x, y } : point
      );

      latestPreviewStateRef.current = {
        corners: nextCorners,
        rotation: draftImage.rotation,
      };

      setSelectionCorners(nextCorners);
      return;
    }

    if (!activeImageId) {
      return;
    }

    const currentItem = queuedImages.find((item) => item.id === activeImageId);
    const nextCorners = (currentItem?.manualCorners ?? selectionCorners).map((point, index) =>
      index === activeCornerIndex ? { x, y } : point
    );

    latestPreviewStateRef.current = {
      corners: nextCorners,
      rotation: currentItem?.rotation ?? 0,
    };

    setSelectionCorners(nextCorners);
  };

  const createQueuedImageFromFile = async (file: File, points: Point[] = createDefaultManualCorners(), rotation = 0) => {
    const resolvedPoints = points.length === 4 ? points : createDefaultManualCorners();
    const preparedFile = await createCroppedFile(file, resolvedPoints, rotation);
    const compressed = await imageCompression(preparedFile, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
    });

    const previewUrl = URL.createObjectURL(compressed);
    const nextId = crypto.randomUUID();

    return {
      id: nextId,
      file: compressed,
      sourceFile: file,
      previewUrl,
      manualCorners: resolvedPoints.map((point) => ({ ...point })),
      rotation,
    } satisfies QueuedImage;
  };

  const rebuildQueuedImagePreview = async (
    imageId: string,
    sourceFile: File,
    nextCorners: Point[],
    nextRotation: number,
    previousPreviewUrl?: string
  ) => {
    if (previousPreviewUrl) {
      URL.revokeObjectURL(previousPreviewUrl);
    }

    const preparedFile = await createCroppedFile(sourceFile, nextCorners, nextRotation);
    const compressed = await imageCompression(preparedFile, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
    });

    const previewUrl = URL.createObjectURL(compressed);

    setQueuedImages((prev) =>
      prev.map((item) => {
        if (item.id !== imageId) {
          return item;
        }

        return {
          ...item,
          file: compressed,
          previewUrl,
          manualCorners: nextCorners.map((point) => ({ ...point })),
          rotation: nextRotation,
        };
      })
    );
  };

  const addImageToQueue = async (file: File, points: Point[] = createDefaultManualCorners(), rotation = 0) => {
    const queuedItem = await createQueuedImageFromFile(file, points, rotation);
    setQueuedImages((prev) => [...prev, queuedItem]);
    setActiveImageId(queuedItem.id);
    setStatus("Page added to queue. Capture another page or submit all pages.");
  };

  const uploadImage = async (file: File): Promise<boolean> => {
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

          resolve(response.ok);
        } catch {
          resolve(false);
        }
      };

      reader.onerror = () => resolve(false);
      reader.readAsDataURL(file);
    });
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

  useEffect(() => {
    const updatePreviewHeight = () => {
      if (window.innerHeight < 700) {
        setPreviewHeightClass("h-[40vh]");
      } else {
        setPreviewHeightClass("h-[46vh]");
      }
    };

    updatePreviewHeight();
    window.addEventListener("resize", updatePreviewHeight);

    return () => window.removeEventListener("resize", updatePreviewHeight);
  }, []);

  const handlePreviewPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (activeCornerIndex === null) {
      return;
    }

    event.preventDefault();
    updateActiveCorner(event.clientX, event.clientY);
  };

  const handlePreviewPointerUp = () => {
    setActiveCornerIndex(null);

    if (!previewImage || !latestPreviewStateRef.current) {
      return;
    }

    if (draftImage) {
      setDraftImage((prev) =>
        prev
          ? {
              ...prev,
              manualCorners: latestPreviewStateRef.current!.corners.map((point) => ({ ...point })),
            }
          : prev
      );
      return;
    }

    const currentItem = queuedImages.find((item) => item.id === activeImageId);

    if (!currentItem) {
      return;
    }

    void rebuildQueuedImagePreview(
      currentItem.id,
      currentItem.sourceFile,
      latestPreviewStateRef.current.corners.map((point) => ({ ...point })),
      latestPreviewStateRef.current.rotation,
      currentItem.previewUrl
    );
  };

  const handleRotatePreview = () => {
    if (draftImage) {
      setDraftImage((prev) => (prev ? { ...prev, rotation: (prev.rotation + 90) % 360 } : prev));
      return;
    }

    if (!activeImageId) {
      return;
    }

    const currentItem = queuedImages.find((item) => item.id === activeImageId);

    if (!currentItem) {
      return;
    }

    const nextRotation = (currentItem.rotation + 90) % 360;

    setQueuedImages((prev) =>
      prev.map((item) => (item.id === activeImageId ? { ...item, rotation: nextRotation } : item))
    );

    void rebuildQueuedImagePreview(
      currentItem.id,
      currentItem.sourceFile,
      currentItem.manualCorners.map((point) => ({ ...point })),
      nextRotation,
      currentItem.previewUrl
    );
  };

  const prepareDraftImage = async (file: File) => {
    const previewUrl = URL.createObjectURL(file);

    setDraftImage({
      id: crypto.randomUUID(),
      file,
      sourceFile: file,
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

    await addImageToQueue(file);
    setDraftImage(null);
    setActiveCornerIndex(null);
    event.target.value = "";
  };

  const openFileInput = (inputRef: { current: HTMLInputElement | null }) => {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }
    } catch {
      // fall back to click
    }

    window.setTimeout(() => {
      input.click();
    }, 50);
  };

  const handleCameraClick = () => {
    openFileInput(cameraInputRef);
  };

  const handleScanNext = () => {
    openFileInput(cameraInputRef);
  };

  const handleGalleryClick = () => {
    openFileInput(galleryInputRef);
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

  const handleDeletePreview = () => {
    if (draftImage) {
      if (draftImage.previewUrl) {
        URL.revokeObjectURL(draftImage.previewUrl);
      }

      setDraftImage(null);
      setActiveCornerIndex(null);
      setActiveImageId(null);
      return;
    }

    if (!activeImageId) {
      return;
    }

    handleDelete(activeImageId);
  };

  const handleSubmitAll = async () => {
    if (queuedImages.length === 0) {
      return;
    }

    setIsUploading(true);
    setStatus("Uploading all pages to desktop...");

    if (isStandaloneMode) {
      setIsUploading(false);
      setStatus(`Captured ${queuedImages.length} page${queuedImages.length === 1 ? "" : "s"}. Submit is not required in local mode.`);
      return;
    }

    for (const item of queuedImages) {
      const uploaded = await uploadImage(item.file);
      if (!uploaded) {
        setIsUploading(false);
        setStatus("Upload failed. Please retry submitting all pages.");
        return;
      }
    }

    setQueuedImages([]);
    setActiveImageId(null);
    setIsUploading(false);
    setStatus("All pages have been uploaded to the desktop workspace.");
  };

  const activeImage = queuedImages.find((item) => item.id === activeImageId) ?? null;
  const previewImage = draftImage ?? activeImage;
  const visibleCorners = selectionCorners;

  useEffect(() => {
    const nextCorners = previewImage?.manualCorners?.length === 4
      ? previewImage.manualCorners.map((point) => ({ ...point }))
      : createDefaultManualCorners();

    setSelectionCorners(nextCorners);
  }, [previewImage?.id, previewImage?.manualCorners]);

  return (
  <div className="min-h-screen flex flex-col bg-slate-950 text-white overflow-x-hidden">
    {/* STATUS CENTER */}
    {!previewImage && (
      <div className="flex-1 flex flex-col items-center justify-center gap-8">

        <div className="items-center justify-center rounded-full border border-green-400/30 bg-green-500/10 px-6 py-3 text-green-300">
          ● {status}
        </div>
        {/* Capture Buttons */}
        <div className="flex gap-6">

          {/* Gallery */}
          <label
            htmlFor={galleryInputId}
            className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-slate-800 text-white"
            aria-label="Choose from gallery"
          >
            <Images className="h-8 w-8" />
          </label>

          <input
            id={galleryInputId}
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleImageCapture}
          />
          {/* Camera */}
          <label
            htmlFor={cameraInputId}
            className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full bg-sky-600 text-white shadow-lg"
            aria-label="Open camera"
          >
            <Camera className="h-8 w-8" />
          </label>

          <input
            id={cameraInputId}
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={handleImageCapture}
          />

        </div>


        <p className="text-sm text-slate-400">
          Capture document or choose from gallery
        </p>

      </div>
    )}

    {/* IMAGE EDITOR MODE */}
    {previewImage && (

      <div className="flex h-full min-h-0 flex-col">
        {/* IMAGE AREA */}
        <div className="relative flex-shrink-0 overflow-hidden bg-slate-900 p-1.5">
          <div
            ref={previewContainerRef}
            className={`relative flex w-full items-center justify-center ${previewHeightClass}`}
            onPointerMove={handlePreviewPointerMove}
            onPointerUp={handlePreviewPointerUp}
            onPointerLeave={handlePreviewPointerUp}
            onPointerCancel={handlePreviewPointerUp}
            style={{touchAction:"none"}}
          >


            <img
              src={previewImage.previewUrl}
              className="max-h-full max-w-full object-contain rounded-xl"
              style={{
                transform:`rotate(${previewImage.rotation}deg)`
              }}
            />
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <polygon
                points={visibleCorners.map((p) => `${p.x * 100}% ${p.y * 100}%`).join(" ")}
                fill="rgba(56,189,248,.15)"
                stroke="#38bdf8"
                strokeWidth="3"
                strokeDasharray="10 6"
              />
              {visibleCorners.map((point, index) => {
                const nextPoint = visibleCorners[(index + 1) % visibleCorners.length];
                return (
                  <line
                    key={`edge-${index}`}
                    x1={`${point.x * 100}%`}
                    y1={`${point.y * 100}%`}
                    x2={`${nextPoint.x * 100}%`}
                    y2={`${nextPoint.y * 100}%`}
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="8 6"
                  />
                );
              })}
              {visibleCorners.map((point) => (
                <circle
                  key={`${point.x}-${point.y}`}
                  cx={`${point.x * 100}%`}
                  cy={`${point.y * 100}%`}
                  r="7"
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth="2"
                />
              ))}
            </svg>
            {visibleCorners.map((point,index)=>(
              <button
                key={index}
                type="button"
                onPointerDown={(e)=>
                  handlePreviewPointerDown(e,index)
                }
                className="absolute z-40 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-500 shadow"
                style={{
                  left:`${point.x*100}%`,
                  top:`${point.y*100}%`
                }}
              />
            ))}
          </div>
        </div>


        {queuedImages.length > 0 && (
          <div className="shrink-0 border-t border-white/10 bg-slate-950 p-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-400">Pages ready</p>
                <p className="mt-0.5 text-xs text-slate-300">
                  {queuedImages.length} page{queuedImages.length === 1 ? "" : "s"} queued.
                </p>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {queuedImages.map((item, index) => (
                <div
                  key={item.id}
                  className={`min-w-[88px] rounded-2xl border p-2 text-left transition ${activeImageId === item.id ? "border-sky-400 bg-slate-800" : "border-slate-700 bg-slate-900"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold text-slate-100">Page {index + 1}</p>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="rounded-full bg-red-600 p-1.5 text-white"
                      aria-label={`Delete page ${index + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftImage(null);
                      setActiveImageId(item.id);
                    }}
                    className="mt-2 block"
                  >
                    <img
                      src={item.previewUrl}
                      alt={`Queued page ${index + 1}`}
                      className="h-[60px] w-[40px] rounded-xl object-cover"
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOTTOM ACTIONS */}

        <div className="shrink-0 border-t border-white/10 bg-slate-950 p-2">
          <div className="mb-2">
            <label
              htmlFor={cameraInputId}
              className="flex w-full cursor-pointer items-center justify-center rounded-xl bg-sky-600 px-3 py-2 text-center text-sm font-semibold text-white"
            >
              Scan Next
            </label>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={handleRotatePreview}
              className="rounded-xl bg-slate-700 py-2 text-white"
            >
              <RotateCw className="mx-auto h-4 w-4" />
              <div className="mt-1 text-[10px]">Rotate</div>
            </button>
            <button
              type="button"
              onClick={handleRetryCapture}
              className="rounded-xl bg-orange-600 py-2 text-white"
            >
              <Camera className="mx-auto h-4 w-4" />
              <div className="mt-1 text-[10px]">Retake</div>
            </button>
            <button
              type="button"
              onClick={handleDeletePreview}
              className="rounded-xl bg-red-600 py-2 text-white"
            >
              <Trash2 className="mx-auto h-4 w-4" />
              <div className="mt-1 text-[10px]">Delete</div>
            </button>
            <button
              type="button"
              onClick={handleSubmitAll}
              disabled={queuedImages.length === 0 || isUploading}
              className="rounded-xl bg-green-600 py-2 text-white disabled:opacity-50"
            >
              <Upload className="mx-auto h-4 w-4" />
              <div className="mt-1 text-[10px]">Submit</div>
            </button>
          </div>
        </div>

      </div>

    )}
  </div>
);
}