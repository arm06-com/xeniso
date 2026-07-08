"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import imageCompression from "browser-image-compression";

type DetectionBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function MobilePage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [status, setStatus] = useState("Connecting to desktop...");
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isAutoDetectEnabled, setIsAutoDetectEnabled] = useState(true);
  const [detectionBox, setDetectionBox] = useState<DetectionBox | null>(null);
  const [videoSize, setVideoSize] = useState({ width: 1, height: 1 });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  useEffect(() => {
    let isCancelled = false;

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

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

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
        setStatus("Camera ready. Auto-detect is on, or you can capture the full frame.");
      } catch {
        setStatus("Camera permission was denied. You can still choose a photo from your library.");
      }
    };

    void startCamera();

    return () => {
      isCancelled = true;
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
      if (!videoRef.current || !isAutoDetectEnabled) {
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
  }, [isAutoDetectEnabled, isCameraReady]);

  const uploadImage = async (file: File) => {
    try {
      setIsUploading(true);
      setStatus("Preparing page...");

      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });

      const reader = new FileReader();

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
          } else {
            setStatus("Upload failed. Please retry.");
          }
        } catch {
          setStatus("Upload failed. Please retry.");
        } finally {
          setIsUploading(false);
        }
      };

      reader.readAsDataURL(compressed);
    } catch {
      setStatus("Unable to process the image. Please try again.");
      setIsUploading(false);
    }
  };

  const captureCurrentFrame = async (useEdgeDetection: boolean) => {
    if (!videoRef.current) {
      return;
    }

    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    if (useEdgeDetection && detectionBox && detectionBox.width > 40 && detectionBox.height > 40) {
      context.drawImage(video, detectionBox.x, detectionBox.y, detectionBox.width, detectionBox.height, 0, 0, width, height);
    } else {
      context.drawImage(video, 0, 0, width, height);
    }

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });

    await uploadImage(file);
  };

  const handleImageCapture = async (event: { target: HTMLInputElement }) => {
    const file = event.target.files?.[0];

    if (!file) return;

    await uploadImage(file);
    event.target.value = "";
  };

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

        <div className="relative mt-6 w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
          <video
            ref={videoRef}
            className="h-96 w-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {isCameraReady && (
            <div className="pointer-events-none absolute inset-0">
              {isAutoDetectEnabled && detectionBox ? (
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
                <div className="absolute inset-0 border-[2px] border-dashed border-slate-400/70" />
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsAutoDetectEnabled((current) => !current)}
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white"
          >
            {isAutoDetectEnabled ? "Auto-detect on" : "Auto-detect off"}
          </button>
          <button
            type="button"
            onClick={() => void captureCurrentFrame(true)}
            disabled={isUploading || !isCameraReady}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isUploading ? "Uploading..." : "Capture with edge detection"}
          </button>
          <button
            type="button"
            onClick={() => void captureCurrentFrame(false)}
            disabled={isUploading || !isCameraReady}
            className="rounded-full border border-white/15 bg-slate-900/70 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
          >
            Capture full frame
          </button>
        </div>

        <label className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-full border border-white/15 bg-slate-900/70 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
          Choose from gallery
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageCapture}
          />
        </label>

        <div className="mt-6 text-sm text-slate-400">
          Tip: keep the page flat and centered. The desktop view will update automatically after each capture.
        </div>
      </div>
    </div>
  );
}