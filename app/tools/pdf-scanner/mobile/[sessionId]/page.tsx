"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useParams } from "next/navigation";
import imageCompression from "browser-image-compression";

type DetectionBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

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

const cornerOrder = ["top-left", "top-right", "bottom-right", "bottom-left"];

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
  const sessionId = params.sessionId as string;
  const [status, setStatus] = useState("Connecting to desktop...");
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [detectionBox, setDetectionBox] = useState<DetectionBox | null>(null);
  const [videoSize, setVideoSize] = useState({ width: 1, height: 1 });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [queuedImages, setQueuedImages] = useState<QueuedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [pendingReplacementId, setPendingReplacementId] = useState<string | null>(null);
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

  const startCamera = async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("Camera access is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setVideoSize({
          width: videoRef.current.videoWidth || 1280,
          height: videoRef.current.videoHeight || 720,
        });
      }

      setIsCameraReady(true);
      setStatus("Camera ready. Page edge detection is active.");
    } catch {
      setStatus("Camera permission was denied. You can still choose a photo from your library.");
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void startCamera();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsCameraReady(false);
    };
  }, []);

  useEffect(() => {
    if (!isCameraReady || !videoRef.current) {
      return undefined;
    }

    const detectLoop = window.setInterval(() => {
      if (!videoRef.current) {
        setDetectionBox(null);
        return;
      }

      const video = videoRef.current;
      const width = 240;
      const height = 180;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      context.drawImage(video, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      const { data } = imageData;
      let totalLuma = 0;

      for (let index = 0; index < data.length; index += 4) {
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        const luma = 0.299 * red + 0.587 * green + 0.114 * blue;
        totalLuma += luma;
      }

      const averageLuma = totalLuma / (width * height);
      const points: Array<{ x: number; y: number }> = [];

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const index = (y * width + x) * 4;
          const red = data[index];
          const green = data[index + 1];
          const blue = data[index + 2];
          const luma = 0.299 * red + 0.587 * green + 0.114 * blue;

          if (luma > averageLuma + 24) {
            points.push({ x, y });
          }
        }
      }

      if (points.length < 80) {
        setDetectionBox(null);
        return;
      }

      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;

      points.forEach((point) => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });

      const padding = 10;
      const cropX = Math.max(0, minX - padding);
      const cropY = Math.max(0, minY - padding);
      const cropWidth = Math.max(80, Math.min(width - cropX, maxX - minX + padding * 2));
      const cropHeight = Math.max(80, Math.min(height - cropY, maxY - minY + padding * 2));
      const scaleX = video.videoWidth / width;
      const scaleY = video.videoHeight / height;

      setVideoSize({
        width: video.videoWidth || 1280,
        height: video.videoHeight || 720,
      });

      setDetectionBox({
        x: Math.round(cropX * scaleX),
        y: Math.round(cropY * scaleY),
        width: Math.round(cropWidth * scaleX),
        height: Math.round(cropHeight * scaleY),
      });
    }, 220);

    return () => {
      window.clearInterval(detectLoop);
    };
  }, [isCameraReady]);

  const uploadImage = async (file: File, points: Point[] = []): Promise<boolean> => {
    try {
      setIsUploading(true);
      setStatus("Preparing page...");

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

  const handlePreviewPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!activeImageId) {
      return;
    }

    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

    setQueuedImages((prev) =>
      prev.map((item) => {
        if (item.id !== activeImageId) {
          return item;
        }

        const nextCorners = item.manualCorners.length >= 4 ? [{ x, y }] : [...item.manualCorners, { x, y }];
        return { ...item, manualCorners: nextCorners };
      })
    );
  };

  const resetManualCorners = () => {
    if (!activeImageId) {
      return;
    }

    setQueuedImages((prev) =>
      prev.map((item) => (item.id === activeImageId ? { ...item, manualCorners: [] } : item))
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
          item.id === replacementId ? { ...item, file, previewUrl, manualCorners: [] } : item
        );
      }

      return [...prev, { id: nextId, file, previewUrl, manualCorners: [] }];
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

  const handleSubmitAll = async () => {
    if (queuedImages.length === 0) {
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
          Your camera now tries to detect the page edge automatically, but you can still capture the full frame whenever you want.
        </p>

        <div className="mt-6 w-full rounded-2xl border border-white/15 bg-slate-900/70 p-4 text-sm text-slate-200">
          {status}
        </div>

        <div className="relative mt-6 flex min-h-96 w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
          <video
            ref={videoRef}
            className="h-96 w-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {!isCameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 px-4 text-center">
              <div className="rounded-full border border-white/15 bg-slate-900/70 px-4 py-2 text-sm text-slate-200">
                Camera is starting. This space will show the live preview shortly.
              </div>
            </div>
          )}

          {isCameraReady && (
            <div className="pointer-events-none absolute inset-0">
              {detectionBox ? (
                <div
                  className="absolute rounded-2xl border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(2,6,23,0.55)]"
                  style={{
                    left: `${(detectionBox.x / videoSize.width) * 100}%`,
                    top: `${(detectionBox.y / videoSize.height) * 100}%`,
                    width: `${(detectionBox.width / videoSize.width) * 100}%`,
                    height: `${(detectionBox.height / videoSize.height) * 100}%`,
                  }}
                />
              ) : (
                <div className="absolute inset-0 border-2 border-dashed border-slate-400/70" />
              )}
            </div>
          )}
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
              <h3 className="mb-4 text-center text-lg font-semibold">Adjust page edge</h3>
              <p className="mb-3 text-sm text-slate-600">
                {activeImage.manualCorners.length < 4
                  ? `Tap the ${cornerOrder[activeImage.manualCorners.length]} corner of the page to mark it.`
                  : "All four corners are marked. You can clear them and adjust if needed."}
              </p>
              <div
                className="relative mb-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                onPointerDown={handlePreviewPointerDown}
                style={{ touchAction: "none" }}
              >
                <img
                  src={activeImage.previewUrl}
                  alt="Preview"
                  className="max-h-[60vh] w-full object-contain rounded-lg"
                />
                {activeImage.manualCorners.map((point, index) => (
                  <div
                    key={`${index}-${point.x.toFixed(3)}-${point.y.toFixed(3)}`}
                    className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-500 shadow"
                    style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={resetManualCorners}
                  className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
                >
                  Clear points
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
                  onClick={() => setActiveImageId(null)}
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
                  ? "Capture each page one by one and submit them together."
                  : `${queuedImages.length} page${queuedImages.length > 1 ? "s" : ""} ready to submit`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSubmitAll}
              disabled={queuedImages.length === 0 || isUploading}
              className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              {isUploading ? "Uploading..." : "Submit all"}
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
          Tip: the camera automatically detects the page edges and crops to make the page size consistent.
        </div>

        <div className="mt-6 text-sm text-slate-400">
          Tip: keep the page flat and centered. The desktop view will update automatically after each capture.
        </div>
      </div>
    </div>
  );
}