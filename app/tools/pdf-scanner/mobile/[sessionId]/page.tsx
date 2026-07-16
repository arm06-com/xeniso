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

const createCroppedFile = async (file: File, points: Point[]) => {
  if (points.length !== 4) {
    return file;
  }

  const image = await createImageFromFile(file);
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
  const [status, setStatus] = useState("Connecting to desktop...");
  const [isUploading, setIsUploading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const [queuedImages, setQueuedImages] = useState<QueuedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [pendingReplacementId, setPendingReplacementId] = useState<string | null>(null);
  const [activeCornerIndex, setActiveCornerIndex] = useState<number | null>(null);
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
    } else {
      setStatus("Direct capture mode enabled. Capture a page and review it here without a QR session.");
    }
  }, [sessionId]);

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const updateActiveCorner = (clientX: number, clientY: number) => {
    if (activeCornerIndex === null || !activeImageId || !previewContainerRef.current) {
      return;
    }

    const rect = previewContainerRef.current.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((clientY - rect.top) / rect.height, 0, 1);

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
        const preparedFile = await createCroppedFile(file, points);
        const compressed = await imageCompression(preparedFile, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
        });

        const previewUrl = URL.createObjectURL(compressed);
        const nextId = crypto.randomUUID();

        setQueuedImages((prev) => {
          const existingPreview = prev.find((item) => item.id === activeImageId);
          if (existingPreview?.previewUrl) {
            URL.revokeObjectURL(existingPreview.previewUrl);
          }

          return [...prev, { id: nextId, file: compressed, previewUrl, manualCorners: createDefaultManualCorners() }];
        });

        setActiveImageId(nextId);
        setPendingReplacementId(null);
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
    if (!activeImageId) {
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

  const resetManualCorners = () => {
    if (!activeImageId) {
      return;
    }

    setQueuedImages((prev) =>
      prev.map((item) => (item.id === activeImageId ? { ...item, manualCorners: createDefaultManualCorners() } : item))
    );
  };

  const addOrReplaceQueuedImage = (file: File, replacementId: string | null = null) => {
    const previewUrl = URL.createObjectURL(file);
    const nextId = replacementId ?? crypto.randomUUID();

    setQueuedImages((prev) => {
      const existingItem = replacementId ? prev.find((item) => item.id === replacementId) : undefined;

      if (existingItem?.previewUrl) {
        URL.revokeObjectURL(existingItem.previewUrl);
      }

      if (replacementId) {
        return prev.map((item) =>
          item.id === replacementId ? { ...item, file, previewUrl, manualCorners: createDefaultManualCorners() } : item
        );
      }

      return [...prev, { id: nextId, file, previewUrl, manualCorners: createDefaultManualCorners() }];
    });

    setActiveImageId(nextId);
    setPendingReplacementId(null);
  };

  const handleImageCapture = async (event: { target: HTMLInputElement }) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (pendingReplacementId) {
      addOrReplaceQueuedImage(file, pendingReplacementId);
    } else {
      addOrReplaceQueuedImage(file);
    }

    event.target.value = "";
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  const handleRetake = () => {
    if (activeImageId) {
      setPendingReplacementId(activeImageId);
    }

    cameraInputRef.current?.click();
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

  const applyActiveCrop = async () => {
    if (!activeImageId) {
      return;
    }

    const currentImage = queuedImages.find((item) => item.id === activeImageId);

    if (!currentImage) {
      return;
    }

    const croppedFile = await createCroppedFile(currentImage.file, currentImage.manualCorners);
    const previewUrl = URL.createObjectURL(croppedFile);

    setQueuedImages((prev) => {
      const previousItem = prev.find((item) => item.id === activeImageId);

      if (previousItem?.previewUrl) {
        URL.revokeObjectURL(previousItem.previewUrl);
      }

      return prev.map((item) =>
        item.id === activeImageId
          ? { ...item, file: croppedFile, previewUrl, manualCorners: createDefaultManualCorners() }
          : item
      );
    });

    setStatus("Page area updated. The cropped version is ready to review.");
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
    setPendingReplacementId(null);
  };

  const activeImage = queuedImages.find((item) => item.id === activeImageId) ?? null;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border border-white/10 bg-white/10 p-8 text-center shadow-2xl backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">Mobile Scanner</p>
        <h1 className="mt-3 text-3xl font-semibold">Scan documents like a pro</h1>
        <p className="mt-3 text-base text-slate-300">
          {isStandaloneMode
            ? "Capture a page directly from this mobile browser, adjust the document edges, and review the image here without a QR session."
            : "Capture a page and then drag the corner handles to match the document edges before you submit it."}
        </p>

        <div className="mt-6 w-full rounded-2xl border border-white/15 bg-slate-900/70 p-4 text-sm text-slate-200">
          {status}
        </div>

        <div className="relative mt-6 flex min-h-96 w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
          <div className="px-6 text-center">
            <p className="text-lg font-semibold text-white">Ready for capture</p>
            <p className="mt-2 text-sm text-slate-400">
              {isStandaloneMode
                ? "Tap the camera button to capture a page directly from this mobile browser. After the photo is added, drag the corner handles to match the page edges."
                : "Tap the camera button to capture a page. After the photo is added, drag the corner handles to match the page edges."}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleGalleryClick}
            className="inline-flex cursor-pointer items-center justify-center rounded-full border border-white/15 bg-slate-900/70 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Choose From Gallary
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
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 p-3 text-white transition hover:bg-white/15"
            aria-label="Open camera"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h4l2-3h6l2 3h4v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11a3 3 0 100 6 3 3 0 000-6z" />
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

        {activeImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 text-slate-900 shadow-2xl">
              <h3 className="mb-4 text-center text-lg font-semibold">Adjust page edges</h3>
              <p className="mb-3 text-sm text-slate-600">
                Drag each corner handle to line up the selection with the document outline before you submit it.
              </p>
              <div
                ref={previewContainerRef}
                className="relative mb-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                onPointerMove={handlePreviewPointerMove}
                onPointerUp={handlePreviewPointerUp}
                onPointerLeave={handlePreviewPointerUp}
                style={{ touchAction: "none" }}
              >
                <img
                  src={activeImage.previewUrl}
                  alt="Preview"
                  className="max-h-[60vh] w-full object-contain rounded-lg"
                />
                <svg className="pointer-events-none absolute inset-0 h-full w-full">
                  <polygon
                    points={activeImage.manualCorners
                      .map((point) => `${point.x * 100}% ${point.y * 100}%`)
                      .join(" ")}
                    className="fill-sky-500/10 stroke-sky-600 stroke-[3]"
                  />
                </svg>
                {activeImage.manualCorners.map((point, index) => (
                  <button
                    key={`${index}-${point.x.toFixed(3)}-${point.y.toFixed(3)}`}
                    type="button"
                    aria-label={`Move ${["top-left", "top-right", "bottom-right", "bottom-left"][index]} corner`}
                    className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-500 shadow"
                    style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
                    onPointerDown={(event) => handlePreviewPointerDown(event, index)}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={resetManualCorners}
                  className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
                >
                  Reset corners
                </button>
                <button
                  onClick={handleRetake}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
                >
                  Retake
                </button>
                <button
                  onClick={() => handleDelete(activeImageId!)}
                  className="rounded-lg border border-rose-300 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                >
                  Delete
                </button>
                <button
                  onClick={async () => {
                    await applyActiveCrop();
                    setActiveImageId(null);
                  }}
                  className="flex-1 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 w-full rounded-2xl border border-white/15 bg-slate-900/70 p-3 text-left">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Captured pages</p>
              <p className="text-xs text-slate-400">
                {queuedImages.length === 0
                  ? isStandaloneMode
                    ? "Capture pages one by one and review them directly here."
                    : "Capture each page one by one and submit them together."
                  : `${queuedImages.length} page${queuedImages.length > 1 ? "s" : ""} ${isStandaloneMode ? "ready to review" : "ready to submit"}`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSubmitAll}
              disabled={queuedImages.length === 0 || isUploading}
              className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              {isUploading ? "Uploading..." : isStandaloneMode ? "Review locally" : "Submit all"}
            </button>
          </div>

          {queuedImages.length === 0 ? (
            <p className="text-sm text-slate-400">No page captured yet. Use the camera button to begin.</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {queuedImages.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveImageId(item.id)}
                  className={`flex min-w-[72px] flex-col items-center rounded-xl border p-2 text-center transition ${activeImageId === item.id ? "border-sky-400 bg-slate-800" : "border-white/10 bg-slate-950/60"}`}
                >
                  <img src={item.previewUrl} alt={`Captured page ${index + 1}`} className="h-14 w-14 rounded-md object-cover" />
                  <span className="mt-1 text-[11px] font-medium text-slate-200">Page {index + 1}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-slate-400">
          {isStandaloneMode
            ? "Tip: drag the corner handles to fit the page outline before you keep the capture."
            : "Tip: drag the corner handles to fit the page outline before submission."}
        </div>

        <div className="mt-6 text-sm text-slate-400">
          {isStandaloneMode
            ? "Tip: keep the page flat and centered for a cleaner preview on this mobile screen."
            : "Tip: keep the page flat and centered. The desktop view will update automatically after each capture."}
        </div>
      </div>
    </div>
  );
}