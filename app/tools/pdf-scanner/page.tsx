"use client";

import { useEffect, useState, useRef, type PointerEvent as ReactPointerEvent } from "react";
import ToolLayout from "@/components/ToolLayout";
import AdBanner from "@/components/AdBanner";
import { PDFDocument } from "pdf-lib";

type ScannerPage = {
  id: string;
  dataUrl: string;
  rotation: number;
  zoom: number;
};

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

type Point = {
  x: number;
  y: number;
};

const createDefaultManualCorners = (): Point[] => [
  { x: 0.08, y: 0.08 },
  { x: 0.92, y: 0.08 },
  { x: 0.92, y: 0.92 },
  { x: 0.08, y: 0.92 },
];

function dataUrlToUint8Array(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function rotateImageDataUrl(dataUrl: string, rotation: number) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Unable to create canvas context"));
        return;
      }

      const width = image.width;
      const height = image.height;
      const isLandscape = rotation % 180 !== 0;

      canvas.width = isLandscape ? height : width;
      canvas.height = isLandscape ? width : height;

      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate((rotation * Math.PI) / 180);
      context.drawImage(image, -width / 2, -height / 2, width, height);

      resolve(canvas.toDataURL("image/png"));
    };

    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = dataUrl;
  });
}

function createScanEffectImageDataUrl(dataUrl: string) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Unable to create canvas context"));
        return;
      }

      const width = image.width;
      const height = image.height;
      canvas.width = width;
      canvas.height = height;

      context.filter = "grayscale(100%) contrast(145%) brightness(110%)";
      context.drawImage(image, 0, 0, width, height);

      const imageData = context.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let index = 0; index < data.length; index += 4) {
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        const brightness = 0.299 * red + 0.587 * green + 0.114 * blue;
        const adjusted = brightness > 210 ? 255 : Math.max(0, Math.min(255, (brightness - 40) * 1.2 + 40));
        const final = adjusted > 235 ? 255 : adjusted;
        data[index] = final;
        data[index + 1] = final;
        data[index + 2] = final;
      }

      context.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };

    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = dataUrl;
  });
}

function autoCropImageDataUrl(dataUrl: string) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Unable to create canvas context"));
        return;
      }

      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const { data, width, height } = imageData;

      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const index = (y * width + x) * 4;
          const red = data[index];
          const green = data[index + 1];
          const blue = data[index + 2];
          const alpha = data[index + 3];
          const brightness = (red + green + blue) / 3;

          if (alpha > 0 && brightness < 245) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      if (minX >= maxX || minY >= maxY) {
        resolve(dataUrl);
        return;
      }

      const padding = 8;
      const cropX = Math.max(0, minX - padding);
      const cropY = Math.max(0, minY - padding);
      const cropWidth = Math.max(1, Math.min(width - cropX, maxX - cropX + 1 + padding * 2));
      const cropHeight = Math.max(1, Math.min(height - cropY, maxY - cropY + 1 + padding * 2));

      const cropCanvas = document.createElement("canvas");
      const cropContext = cropCanvas.getContext("2d");

      if (!cropContext) {
        reject(new Error("Unable to create crop canvas context"));
        return;
      }

      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;
      cropContext.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      resolve(cropCanvas.toDataURL("image/png"));
    };

    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = dataUrl;
  });
}

export default function PdfScannerPage() {
  const [sessionId] = useState(() => (typeof window !== "undefined" ? crypto.randomUUID() : ""));
  const [images, setImages] = useState<ScannerPage[]>([]);
  const [qrCode, setQrCode] = useState("");
  const [isMobileDevice] = useState(() =>
    typeof window !== "undefined"
      ? /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent)
      : false
  );
  const [connected, setConnected] = useState(false);
  const [isCreatingPdf, setIsCreatingPdf] = useState(false);
  const [croppingId, setCroppingId] = useState<string | null>(null);
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const [cropCorners, setCropCorners] = useState<Point[]>([]);
  const [activeCropCornerIndex, setActiveCropCornerIndex] = useState<number | null>(null);
  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !origin) return;

    let isActive = true;

    const initializeScanner = async () => {
      const { createPusherClient } = await import("@/lib/pusher-client");
      const { default: QRCode } = await import("qrcode");

      const url = `${origin}/tools/pdf-scanner/mobile/${sessionId}`;

      QRCode.toDataURL(url)
        .then((data) => {
          if (isActive) {
            setQrCode(data);
          }
        })
        .catch((error) => {
          console.error("QR Error:", error);
        });

      let pusherClient;

      try {
        pusherClient = createPusherClient();
      } catch (error) {
        console.error("Failed to initialize Pusher client:", error);
      }

      if (!pusherClient) {
        return () => {
          isActive = false;
        };
      }

      const channel = pusherClient.subscribe(`pdf-scanner-${sessionId}`);

      channel.bind("mobile-connected", () => {
        if (isActive) {
          setConnected(true);
        }
      });

      channel.bind("image-uploaded", (data: { image?: string }) => {
        if (!data.image || !isActive) {
          return;
        }

        setImages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            dataUrl: data.image!,
            rotation: 0,
            zoom: 1,
          },
        ]);
      });

      return () => {
        isActive = false;
        channel.unbind_all();
        pusherClient.unsubscribe(`pdf-scanner-${sessionId}`);
        pusherClient.disconnect();
      };
    };

    let cleanup: (() => void) | undefined;

    let pollId: number | undefined;

    void initializeScanner().then((dispose) => {
      cleanup = dispose;

      try {
        const pollForUpdates = async () => {
          try {
            const [statusRes, imagesRes] = await Promise.all([
              fetch(`/api/pdf-scanner/status?sessionId=${encodeURIComponent(sessionId)}`),
              fetch(`/api/pdf-scanner/images?sessionId=${encodeURIComponent(sessionId)}`),
            ]);

            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (statusData?.connected) {
                setConnected(true);
              }
            }

            if (imagesRes.ok) {
              const imageData = await imagesRes.json();
              const pendingImages = Array.isArray(imageData?.images) ? imageData.images : [];

              if (pendingImages.length > 0) {
                setImages((prev) => [
                  ...prev,
                  ...pendingImages.map((image: string) => ({
                    id: crypto.randomUUID(),
                    dataUrl: image,
                    rotation: 0,
                    zoom: 1,
                  })),
                ]);
              }
            }
          } catch (err) {
            // ignore transient errors
          }
        };

        pollId = window.setInterval(() => {
          void pollForUpdates();
        }, 1500);

        void pollForUpdates();
      } catch (err) {
        // ignore if window or fetch not available
      }
    });

    return () => {
      isActive = false;
      if (pollId) {
        clearInterval(pollId);
      }
      cleanup?.();
    };
  }, [origin, sessionId]);

  const handleRotate = async (id: string) => {
    setImages((prev) =>
      prev.map((page) => (page.id === id ? { ...page, rotation: (page.rotation + 90) % 360 } : page))
    );
  };

  const handleZoomChange = (id: string, change: number) => {
    setImages((prev) =>
      prev.map((page) => {
        if (page.id !== id) {
          return page;
        }

        const nextZoom = Math.max(0.75, Math.min(2.5, page.zoom + change));
        return { ...page, zoom: nextZoom };
      })
    );
  };

  const handleCrop = async (id: string) => {
    const page = images.find((item) => item.id === id);

    if (!page) {
      return;
    }

    try {
      const cropped = await autoCropImageDataUrl(page.dataUrl);
      setImages((prev) => prev.map((item) => (item.id === id ? { ...item, dataUrl: cropped } : item)));
    } catch (error) {
      console.error("Auto crop failed:", error);
    }
  };

  const handleDelete = (id: string) => {
    setImages((prev) => prev.filter((page) => page.id !== id));
  };

  const handleMobileImageCapture = async (event: { target: HTMLInputElement }) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      const id = crypto.randomUUID();

      setImages((prev) => [...prev, { id, dataUrl, rotation: 0, zoom: 1 }]);
      setCroppingId(id);
      setCropPreviewUrl(dataUrl);
      setCropCorners(createDefaultManualCorners());
      setActiveCropCornerIndex(null);
    };

    reader.onerror = () => {
      console.error("Failed to read selected image");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const startCrop = (id: string) => {
    const page = images.find((p) => p.id === id);
    if (!page) return;
    setCroppingId(id);
    setCropPreviewUrl(page.dataUrl);
    setCropCorners(createDefaultManualCorners());
    setActiveCropCornerIndex(null);
  };

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    setImages((prev) => {
      const fromIndex = prev.findIndex((page) => page.id === draggedId);
      const toIndex = prev.findIndex((page) => page.id === targetId);

      if (fromIndex === -1 || toIndex === -1) {
        return prev;
      }

      const updated = [...prev];
      const [movedPage] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedPage);
      return updated;
    });

    setDraggedId(null);
  };

  const handleDownloadPdf = async (useScanEffect: boolean) => {
    if (images.length === 0) {
      return;
    }

    setIsCreatingPdf(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const page of images) {
        let imageDataUrl = page.dataUrl;

        if (page.rotation !== 0) {
          imageDataUrl = await rotateImageDataUrl(page.dataUrl, page.rotation);
        }

        if (useScanEffect) {
          imageDataUrl = await createScanEffectImageDataUrl(imageDataUrl);
        }

        const bytes = dataUrlToUint8Array(imageDataUrl);
        const isPng = imageDataUrl.startsWith("data:image/png");
        const image = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
        const pdfPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
        const baseScale = Math.min(A4_WIDTH / image.width, A4_HEIGHT / image.height) * page.zoom;
        const drawWidth = image.width * baseScale;
        const drawHeight = image.height * baseScale;

        pdfPage.drawImage(image, {
          x: 0,
          y: A4_HEIGHT - drawHeight,
          width: drawWidth,
          height: drawHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const buffer = pdfBytes instanceof Uint8Array
        ? new Uint8Array(pdfBytes)
        : new Uint8Array(pdfBytes);
      const blob = new Blob([buffer], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "xeniso-scanned-pages.pdf";
      link.click();
      URL.revokeObjectURL(link.href);
    } finally {
      setIsCreatingPdf(false);
    }
  };

  const closeCrop = () => {
    if (cropPreviewUrl) {
      // no revoke here because dataUrl isn't an object URL
    }
    setCroppingId(null);
    setCropPreviewUrl(null);
    setCropCorners([]);
    setActiveCropCornerIndex(null);
  };

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const updateActiveCorner = (clientX: number, clientY: number) => {
    if (activeCropCornerIndex === null || !previewContainerRef.current) {
      return;
    }

    const rect = previewContainerRef.current.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((clientY - rect.top) / rect.height, 0, 1);

    setCropCorners((prev) => prev.map((point, index) => (index === activeCropCornerIndex ? { x, y } : point)));
  };

  const handleCropPointerDown = (event: ReactPointerEvent<HTMLElement>, cornerIndex: number) => {
    event.preventDefault();
    event.stopPropagation();
    previewContainerRef.current?.setPointerCapture(event.pointerId);
    setActiveCropCornerIndex(cornerIndex);
  };

  const handleCropPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (activeCropCornerIndex === null) {
      return;
    }

    event.preventDefault();
    updateActiveCorner(event.clientX, event.clientY);
  };

  const handleCropPointerUp = () => {
    setActiveCropCornerIndex(null);
  };

  const resetCropCorners = () => {
    setCropCorners(createDefaultManualCorners());
  };

  const applyCrop = async () => {
    if (cropCorners.length !== 4 || !cropPreviewUrl || !croppingId || !imgRef.current) {
      closeCrop();
      return;
    }

    const imgEl = imgRef.current;
    const naturalW = imgEl.naturalWidth;
    const naturalH = imgEl.naturalHeight;
    const displayW = imgEl.clientWidth || imgEl.width;
    const displayH = imgEl.clientHeight || imgEl.height;
    const scaleX = naturalW / displayW;
    const scaleY = naturalH / displayH;

    const scaledPoints = cropCorners.map((point) => ({
      x: Math.round(Math.max(0, Math.min(1, point.x)) * displayW * scaleX),
      y: Math.round(Math.max(0, Math.min(1, point.y)) * displayH * scaleY),
    }));

    let minX = naturalW;
    let minY = naturalH;
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
    const cropWidth = Math.max(60, Math.min(naturalW - cropX, maxX - cropX + padding * 2));
    const cropHeight = Math.max(60, Math.min(naturalH - cropY, maxY - cropY + padding * 2));

    const image = new Image();
    image.src = cropPreviewUrl;
    await new Promise((res, rej) => {
      image.onload = res;
      image.onerror = rej;
    });

    const canvas = document.createElement("canvas");
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      closeCrop();
      return;
    }

    ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    const croppedDataUrl = canvas.toDataURL("image/png");

    setImages((prev) => prev.map((item) => (item.id === croppingId ? { ...item, dataUrl: croppedDataUrl } : item)));
    closeCrop();
  };

  return (
    <ToolLayout
      title="PDF Scanner"
      description="Scan pages from your phone and build a PDF in seconds. Manage scans from the desktop workspace."
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mt-8 mb-8 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
          <div className="max-w-2xl rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">PDF Scanner</p>
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Scan pages from your phone and build a PDF in seconds.</h1>
            <p className="mt-4 text-base text-slate-600">
              Open the QR code on your phone, capture each page, and manage everything from desktop workspace.
            </p>

            {isMobileDevice ? (
              <div className="mt-8 rounded-2xl border border-sky-400 bg-white p-4 text-left">
                <p className="text-sm font-semibold text-slate-700">Direct mobile capture</p>
                <p className="mt-2 text-sm text-slate-600">
                  Use your camera or gallery directly on this phone to capture pages and download a PDF without scanning a QR code.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleGalleryClick}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Choose from gallery
                  </button>
                  <button
                    type="button"
                    onClick={handleCameraClick}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                  >
                    Capture photo
                  </button>
                </div>
                <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleMobileImageCapture} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleMobileImageCapture} />
              </div>
            ) : (
              <div className="rounded-2xl border border-orange-400 bg-white p-4 text-center mt-8">
                <p className="text-sm font-medium text-slate-600">Connection status</p>
                <p className={`mt-2 text-lg font-semibold ${connected ? "text-emerald-600" : "text-amber-600"}`}>
                  {connected ? "🟢 Mobile connected" : "🟡 Waiting for mobile"}
                </p>
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            
            {isMobileDevice ? (
              <>
                <h2 className="text-lg font-semibold text-slate-900">Direct mobile capture</h2>
                <p className="mt-2 text-sm text-slate-600">Capture from this phone and download the finished PDF without any QR step.</p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-slate-900">Connect your phone</h2>
                <p className="mt-2 text-sm text-slate-600">Open the QR code scanner on your mobile device to start scanning.</p>
              </>
            )}

            <div className="mt-6 flex justify-center">
              {isMobileDevice ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
                  Use the capture buttons above to add pages and build your PDF directly from this device.
                </div>
              ) : qrCode ? (
                <img src={qrCode} alt="Mobile connection QR code" className="h-64 w-64 rounded-2xl border border-slate-200 bg-white p-2" />
              ) : (
                <div className="h-64 w-64 animate-pulse rounded-2xl bg-slate-200" />
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Captured pages</h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                onClick={() => handleDownloadPdf(false)}
                disabled={images.length === 0 || isCreatingPdf}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isCreatingPdf ? "Creating PDF..." : "Create PDF with original image"}
              </button>
              <button
                onClick={() => handleDownloadPdf(true)}
                disabled={images.length === 0 || isCreatingPdf}
                className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isCreatingPdf ? "Creating PDF..." : "Create PDF with scan effect"}
              </button>
            </div>
          </div>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-medium text-slate-700">Scan effect:</p>
            <p>Create a clean, scanner-style PDF by enhancing contrast, removing color noise, and brightening paper backgrounds.</p>
          </div>

          {images.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No pages scanned yet. Use the QR code above on your phone to begin.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Drag pages to reorder them before export
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {images.map((page, index) => (
                  <div
                    key={page.id}
                    draggable
                    onDragStart={() => handleDragStart(page.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(page.id)}
                    onDragEnd={() => setDraggedId(null)}
                    className={`flex h-full flex-col rounded-2xl border bg-slate-50 p-3 transition ${draggedId === page.id ? "border-sky-500 ring-2 ring-sky-200" : "border-slate-200"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <span className="text-base text-slate-400" aria-hidden>
                          ⋮⋮
                        </span>
                        <span>Page {index + 1}</span>
                      </div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Drag to move</div>
                    </div>

                    <div className="mt-3 flex min-h-56 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                      <img
                        src={page.dataUrl}
                        alt={`Scanned page ${index + 1}`}
                        className="max-h-56 max-w-full rounded-lg object-contain"
                        style={{ transform: `rotate(${page.rotation}deg) scale(${page.zoom})` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700">Page {index + 1}</p>
                      <button onClick={() => handleDelete(page.id)} className="text-sm font-medium text-rose-600 hover:text-rose-700">
                        Delete
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => startCrop(page.id)}
                        className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                      >
                        Adjust edges
                      </button>
                      <button
                        onClick={() => handleRotate(page.id)}
                        className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                      >
                        Rotate 90°
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <AdBanner slot="MIDDLE-BANNER" />

      {croppingId && cropPreviewUrl && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6">
        <div className="w-full max-w-4xl rounded-2xl bg-white p-4 text-slate-900 shadow-2xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold">Adjust page edges</h3>
              <p className="text-sm text-slate-600">Drag each corner handle to match the page outline before applying the crop.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={resetCropCorners} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">Reset corners</button>
              <button onClick={closeCrop} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
              <button onClick={applyCrop} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white">Apply</button>
            </div>
          </div>

          <div
            ref={previewContainerRef}
            className="relative flex items-center justify-center overflow-auto rounded-xl bg-slate-100 p-3"
            onPointerMove={handleCropPointerMove}
            onPointerUp={handleCropPointerUp}
            onPointerLeave={handleCropPointerUp}
            style={{ touchAction: "none" }}
          >
            <img ref={imgRef} src={cropPreviewUrl} alt="Crop preview" className="max-h-[70vh] w-auto rounded-lg" />

            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              <polygon
                points={cropCorners.map((point) => `${point.x * 100}% ${point.y * 100}%`).join(" ")}
                className="fill-sky-500/15"
                style={{ stroke: "rgba(14, 165, 233, 0.95)", strokeWidth: 3, strokeDasharray: "12 8" }}
              />
              {cropCorners.map((point, index) => {
                const nextPoint = cropCorners[(index + 1) % cropCorners.length];
                return (
                  <line
                    key={`edge-${index}`}
                    x1={`${point.x * 100}%`}
                    y1={`${point.y * 100}%`}
                    x2={`${nextPoint.x * 100}%`}
                    y2={`${nextPoint.y * 100}%`}
                    stroke="rgba(14, 165, 233, 0.95)"
                    strokeWidth={2}
                    strokeDasharray="8 6"
                  />
                );
              })}
            </svg>

            {cropCorners.map((point, index) => (
              <button
                key={`crop-handle-${index}`}
                type="button"
                aria-label={`Move ${["top-left", "top-right", "bottom-right", "bottom-left"][index]} corner`}
                className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-500 shadow"
                style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
                onPointerDown={(event) => handleCropPointerDown(event, index)}
              />
            ))}
          </div>
        </div>
      </div>
      )}
    </ToolLayout>
  );
}