"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import imageCompression from "browser-image-compression";

export default function MobilePage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [status, setStatus] = useState("Connecting to desktop...");
  const [isUploading, setIsUploading] = useState(false);

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

  const handleImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

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
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border border-white/10 bg-white/10 p-8 text-center shadow-2xl backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">Mobile Scanner</p>
        <h1 className="mt-3 text-3xl font-semibold">Scan documents like a pro</h1>
        <p className="mt-3 text-base text-slate-300">
          Use your camera to capture each page and send it straight to the desktop workspace.
        </p>

        <div className="mt-6 w-full rounded-2xl border border-white/15 bg-slate-900/70 p-4 text-sm text-slate-200">
          {status}
        </div>

        <label className="mt-8 inline-flex cursor-pointer items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-100">
          {isUploading ? "Uploading..." : "Open camera & scan"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageCapture}
          />
        </label>

        <div className="mt-6 text-sm text-slate-400">
          Tip: take one page at a time and the desktop view will update automatically.
        </div>
      </div>
    </div>
  );
}