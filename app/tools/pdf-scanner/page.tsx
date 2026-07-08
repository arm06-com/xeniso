"use client";

import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";

type ScannerPage = {
  id: string;
  dataUrl: string;
  rotation: number;
  zoom: number;
};

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

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
  const [connected, setConnected] = useState(false);
  const [isCreatingPdf, setIsCreatingPdf] = useState(false);
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

  const handleDragStart = (id: string) => {
    setDraggedId(id);
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

  const handleDownloadPdf = async () => {
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

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
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

            <div className="rounded-2xl border border-orange-400 bg-white p-4 text-center mt-8">
              <p className="text-sm font-medium text-slate-600">Connection status</p>
              <p className={`mt-2 text-lg font-semibold ${connected ? "text-emerald-600" : "text-amber-600"}`}>
                {connected ? "🟢 Mobile connected" : "🟡 Waiting for mobile"}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Connect your phone</h2>
            <p className="mt-2 text-sm text-slate-600">Open the QR code scanner on your mobile device to start scanning.</p>

            <div className="mt-6 flex justify-center">
              {qrCode ? <img src={qrCode} alt="Mobile connection QR code" className="h-64 w-64 rounded-2xl border border-slate-200 bg-white p-2" /> : <div className="h-64 w-64 animate-pulse rounded-2xl bg-slate-200" />}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Captured pages</h2>
              <p className="mt-1 text-sm text-slate-600">Each scan appears here as a page you can refine before exporting.</p>
            </div>
            <button
              onClick={handleDownloadPdf}
              disabled={images.length === 0 || isCreatingPdf}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isCreatingPdf ? "Creating PDF..." : "Create PDF"}
            </button>
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

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleZoomChange(page.id, -0.1)}
                        className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                      >
                        Zoom out
                      </button>
                      <span className="text-sm font-medium text-slate-600">{page.zoom.toFixed(1)}x</span>
                      <button
                        onClick={() => handleZoomChange(page.id, 0.1)}
                        className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                      >
                        Zoom in
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleCrop(page.id)}
                        className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                      >
                        Auto crop
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
    </div>
  );
}