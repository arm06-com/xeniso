"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useParams } from "next/navigation";
import imageCompression from "browser-image-compression";
import { Camera, Images, RotateCw, Trash2, Upload, X } from "lucide-react";

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

  const createQueuedImageFromFile = async (file: File, points: Point[] = [], rotation = 0) => {
    const preparedFile = await createCroppedFile(file, points, rotation);
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
      previewUrl,
      manualCorners: points.map((point) => ({ ...point })),
      rotation,
    } satisfies QueuedImage;
  };

  const uploadImage = async (file: File, points: Point[] = [], rotation = 0, persistLocally = false): Promise<boolean> => {
    try {
      setIsUploading(true);
      setStatus("Preparing page...");

      const queuedItem = await createQueuedImageFromFile(file, points, rotation);

      if (isStandaloneMode || persistLocally) {
        setQueuedImages((prev) => [...prev, queuedItem]);
        setActiveImageId(queuedItem.id);

        if (isStandaloneMode) {
          setStatus("Page captured locally. Adjust the corners and review it below.");
          setIsUploading(false);
          return true;
        }
      }

      if (isStandaloneMode) {
        return true;
      }

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

        reader.readAsDataURL(queuedItem.file);
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
    if (draftImage) {
      setDraftImage((prev) => (prev ? { ...prev, rotation: (prev.rotation + 90) % 360 } : prev));
      return;
    }

    if (!activeImageId) {
      return;
    }

    setQueuedImages((prev) =>
      prev.map((item) => (item.id === activeImageId ? { ...item, rotation: (item.rotation + 90) % 360 } : item))
    );
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
    if (draftImage) {
      const uploaded = await uploadImage(draftImage.file, draftImage.manualCorners, draftImage.rotation, true);

      if (!uploaded) {
        return;
      }

      if (draftImage.previewUrl) {
        URL.revokeObjectURL(draftImage.previewUrl);
      }

      setDraftImage(null);
      setActiveCornerIndex(null);
      setActiveImageId(null);

      window.setTimeout(() => {
        cameraInputRef.current?.click();
      }, 180);
      return;
    }

    if (queuedImages.length === 0) {
      return;
    }

    if (isStandaloneMode) {
      setStatus("Captured pages are ready locally. You can review them below or remove them when you are done.");
      return;
    }

    for (const item of queuedImages) {
      const uploaded = await uploadImage(item.file, item.manualCorners, item.rotation, true);

      if (!uploaded) {
        return;
      }
    }

    setStatus("All pages are ready locally and uploaded to the desktop workspace.");
  };

  const activeImage = queuedImages.find((item) => item.id === activeImageId) ?? null;
  const previewImage = draftImage ?? activeImage;

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
          <button
            onClick={handleGalleryClick}
            className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-slate-800 text-white"
            aria-label="Choose from gallery"
          >
            <Images className="h-8 w-8" />
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
            onClick={handleCameraClick}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg"
            aria-label="Open camera"
          >
            <Camera className="h-8 w-8" />
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


        <p className="text-sm text-slate-400">
          Capture document or choose from gallery
        </p>

      </div>
    )}

    {/* IMAGE EDITOR MODE */}
    {previewImage && (

      <div className="relative flex max-h-90vh flex-1 flex-col">
        {/* Top floating buttons */}
        <div className="pointer-events-none my-2 z-30 flex justify-center gap-4">
          <button
            type="button"
            onClick={handleGalleryClick}
            className="pointer-events-auto rounded-full bg-orange-500/80 px-5 py-3 text-white"
            aria-label="Choose from gallery"
          >
            <Images className="h-5 w-5" />
          </button>


          <button
            type="button"
            onClick={handleCameraClick}
            className="pointer-events-auto rounded-full bg-sky-600 px-5 py-3 text-white"
            aria-label="Open camera"
          >
            <Camera className="h-5 w-5" />
          </button>
        </div>

        {/* IMAGE AREA */}
        <div className="flex-1 min-h-400 overflow-hidden bg-slate-900 p-2">


          <div
            ref={previewContainerRef}
            className="relative flex min-h-380 w-full items-center justify-center"
            onPointerMove={handlePreviewPointerMove}
            onPointerUp={handlePreviewPointerUp}
            onPointerLeave={handlePreviewPointerUp}
            onPointerCancel={handlePreviewPointerUp}
            style={{touchAction:"none"}}
          >


            <img
              src={previewImage.previewUrl}
              className="min-h-350 max-w-full object-contain rounded-xl"
              style={{
                transform:`rotate(${previewImage.rotation}deg)`
              }}
            />
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <polygon
                points={previewImage.manualCorners.map((p) => `${p.x * 100}% ${p.y * 100}%`).join(" ")}
                fill="rgba(56,189,248,.15)"
                stroke="#38bdf8"
                strokeWidth="3"
                strokeDasharray="10 6"
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
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="8 6"
                  />
                );
              })}
              {previewImage.manualCorners.map((point) => (
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
            {previewImage.manualCorners.map((point,index)=>(
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


        {/* BOTTOM ACTIONS */}

        <div className="z-30 border-t border-white/10 bg-slate-950 p-2">

          <div className="grid grid-cols-4 gap-2">


            <button
              type="button"
              onClick={handleRotatePreview}
              className="rounded-xl bg-slate-700 py-2 text-white"
            >
              <RotateCw className="mx-auto h-5 w-5" />
              <div className="mt-1 text-xs">
                Rotate
              </div>
            </button>



            <button
              type="button"
              onClick={handleRetryCapture}
              className="rounded-xl bg-orange-600 py-2 text-white"
            >
              <Camera className="mx-auto h-5 w-5" />
              <div className="mt-1 text-xs">
                Retake
              </div>
            </button>



            <button
              type="button"
              onClick={handleDeletePreview}
              className="rounded-xl bg-red-600 py-2 text-white"
            >
              <Trash2 className="mx-auto h-5 w-5" />
              <div className="mt-1 text-xs">
                Delete
              </div>
            </button>

            <button
              type="button"
              onClick={handleSubmitAll}
              className="rounded-xl bg-green-600 py-2 text-white"
            >
              <Upload className="mx-auto h-5 w-5" />
              <div className="mt-1 text-xs">
                Submit
              </div>
            </button>


          </div>


        </div>

        {/* THUMBNAILS */}

        {queuedImages.length > 0 && (

          <div className="bg-slate-900 px-3 py-2">

            <div className="flex gap-2">


            {queuedImages.map(item=>(

              <div
                key={item.id}
                className="relative"
              >

                <button
                  type="button"
                  onClick={() => {
                    setDraftImage(null);
                    setActiveImageId(item.id);
                  }}
                  className={`rounded-lg border ${activeImageId === item.id ? "border-sky-400" : "border-slate-700"}`}
                >
                  <img
                    src={item.previewUrl}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                </button>


                <button
                  onClick={()=>
                    handleDelete(item.id)
                  }
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white"
                  aria-label="Delete thumbnail"
                >
                  <X className="h-3.5 w-3.5" />
                </button>


              </div>


            ))}


            </div>

          </div>

        )}


      </div>

    )}


  </div>
);
}