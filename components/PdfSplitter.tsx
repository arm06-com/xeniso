"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { saveAs } from "file-saver";

function PdfSplitter() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  type PdfPage = {
    pageNumber: number;
    selected: boolean;
    preview: string;
    id: string;
  };

  const [pages, setPages] = useState<PdfPage[]>([]);
  const [splitMode, setSplitMode] = useState<"pages" | "all">("pages");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      alert("Please upload a PDF.");
      return;
    }

    try {
      setFile(selectedFile);

      const arrayBuffer = await selectedFile.arrayBuffer();

      const loadPdfJsOnce = async () => {
        if ((window as any).pdfjsLib) return (window as any).pdfjsLib;

        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src =
            "https://unpkg.com/pdfjs-dist@2.16.105/legacy/build/pdf.min.js";
          s.async = true;
          s.onload = () => resolve();
          s.onerror = () =>
            reject(new Error("Failed to load pdfjs script"));
          document.head.appendChild(s);
        });

        const lib = (window as any).pdfjsLib;

        try {
          lib.GlobalWorkerOptions.workerSrc =
            "https://unpkg.com/pdfjs-dist@2.16.105/legacy/build/pdf.worker.min.js";
        } catch {}

        return lib;
      };

      const pdfjsLib = await loadPdfJsOnce();
      const pdf = await pdfjsLib
        .getDocument({ data: arrayBuffer })
        .promise;

      const generatedPages: PdfPage[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.6 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        generatedPages.push({
          id: crypto.randomUUID(),
          pageNumber: i,
          preview: canvas.toDataURL("image/png"),
          selected: true,
        });
      }

      setPages(generatedPages);
    } catch (err) {
      console.error(err);
      alert("Unable to load PDF pages.");
    }
  };

  const removePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const splitPdf = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setProgress(0);

      if (downloadUrl) URL.revokeObjectURL(downloadUrl);

      const bytes = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(bytes);

      if (splitMode === "all") {
        const zip = new JSZip();
        const baseName = file.name.replace(/\.pdf$/i, "");

        for (let i = 0; i < pages.length; i++) {
          const p = pages[i];

          const singlePdf = await PDFDocument.create();
          const [page] = await singlePdf.copyPages(sourcePdf, [
            p.pageNumber - 1,
          ]);

          singlePdf.addPage(page);

          const bytes = await singlePdf.save();
          zip.file(`${baseName}-page-${p.pageNumber}.pdf`, bytes);

          setProgress(Math.round(((i + 1) / pages.length) * 100));
        }

        const blob = await zip.generateAsync({ type: "blob" });
        saveAs(blob, `${baseName}-split.zip`);

        setIsProcessing(false);
        return;
      }

      const newPdf = await PDFDocument.create();

      const indexes = pages
        .filter((p) => p.selected)
        .map((p) => p.pageNumber - 1);

      if (!indexes.length) {
        alert("No pages selected.");
        setIsProcessing(false);
        return;
      }

      const copied = await newPdf.copyPages(sourcePdf, indexes);
      copied.forEach((p) => newPdf.addPage(p));

      const pdfBytes = await newPdf.save();

      const blob = new Blob([new Uint8Array(pdfBytes)], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);

      setDownloadFileName(
        file.name.replace(/\.pdf$/i, "") + "-split.pdf"
      );
    } catch (err) {
      console.error(err);
      alert("Failed to split PDF.");
    }

    setIsProcessing(false);
  };

  return (
    <div className="space-y-6 md:space-y-8 px-4 md:px-8 py-6 bg-gray-50 min-h-screen">

      {/* Upload */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);

            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition ${
            isDragging
              ? "border-gray-900 bg-gray-100"
              : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
            Drag & Drop PDF
          </h2>

          <p className="mt-2 text-sm md:text-base text-gray-600">
            or click to select a PDF
          </p>

          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="application/pdf"
            onChange={(e) =>
              e.target.files && handleFile(e.target.files[0])
            }
          />
        </div>
      </section>

      {/* Info */}
      {file && (
        <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-900">
            PDF Information
          </h2>

          <div className="space-y-3 text-sm md:text-base text-gray-700">
            <p>
              <span className="font-semibold text-gray-900">
                File:
              </span>{" "}
              {file.name}
            </p>

            <p>
              <span className="font-semibold text-gray-900">
                Size:
              </span>{" "}
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>

            <p>
              <span className="font-semibold text-gray-900">
                Pages:
              </span>{" "}
              {pages.length}
            </p>
          </div>
        </section>
      )}

      {/* Settings */}
      {file && (
        <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-900">
            Split Settings
          </h2>

          <select
            value={splitMode}
            onChange={(e) =>
              setSplitMode(e.target.value as "pages" | "all")
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
          >
            <option value="pages">Extract Selected Pages</option>
            <option value="all">Split Every Page (ZIP)</option>
          </select>
        </section>
      )}

      {/* Pages */}
      {file && splitMode === "pages" && (
        <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-lg md:text-xl font-semibold mb-4 text-gray-900">
            Pages
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
            {pages.map((p) => (
              <div
                key={p.id}
                className="relative border rounded-lg overflow-hidden bg-white"
              >
                <img
                  src={p.preview}
                  className="w-full h-24 md:h-28 object-cover"
                  alt=""
                />

                <button
                  onClick={() => removePage(p.id)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center"
                >
                  ×
                </button>

                <div className="text-xs text-center py-1 text-gray-700">
                  Page {p.pageNumber}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Action */}
      {file && (
        <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <button
            onClick={splitPdf}
            disabled={isProcessing}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium"
          >
            {isProcessing ? "Processing..." : "Split PDF"}
          </button>

          {isProcessing && (
            <div className="mt-6">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-3 bg-gray-900 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="text-sm mt-2 text-gray-600">
                {progress}%
              </p>
            </div>
          )}
        </section>
      )}

      {/* Download */}
      {downloadUrl && (
        <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Split Complete
          </h2>

          <button
            onClick={() => {
              const a = document.createElement("a");
              a.href = downloadUrl;
              a.download = downloadFileName;
              a.click();
            }}
            className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg"
          >
            Download File
          </button>
        </section>
      )}
    </div>
  );
}

export default PdfSplitter;