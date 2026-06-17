"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { PDFDocument } from "pdf-lib";

import JSZip from "jszip";
import { saveAs } from "file-saver";

// import * as pdfjsLib from "pdfjs-dist";
// import "pdfjs-dist/build/pdf.worker.entry";

function PdfSplitter() {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [file, setFile] =
    useState<File | null>(null);

    const [isDragging, setIsDragging] =
    useState(false);

    const [isProcessing, setIsProcessing] =
    useState(false);

type PdfPage = {
  pageNumber: number;
  selected: boolean;
  preview: string;
  id: string;
};  

const [pages, setPages] =
  useState<PdfPage[]>([]);

const [splitMode, setSplitMode] =
  useState<"pages" | "all">("pages");

const [downloadUrl, setDownloadUrl] =
  useState<string | null>(null);

const [downloadFileName, setDownloadFileName] =
  useState("");

const [progress, setProgress] =
  useState(0);

useEffect(() => {
  return () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
  };
}, [downloadUrl]);

// Upload Handler
const handleFile = async (selectedFile: File) => {
  if (selectedFile.type !== "application/pdf") {
    alert("Please upload a PDF.");
    return;
  }

  try {
    setFile(selectedFile);

    const arrayBuffer = await selectedFile.arrayBuffer();

    // Load pdf.js from CDN once to avoid bundler/node 'canvas' dependency
    // @ts-ignore
    const loadPdfJsOnce = async () => {
      if ((window as any).pdfjsLib) return (window as any).pdfjsLib;

      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://unpkg.com/pdfjs-dist@2.16.105/legacy/build/pdf.min.js";
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load pdfjs script"));
        document.head.appendChild(s);
      });

      const lib = (window as any).pdfjsLib;
      try {
        lib.GlobalWorkerOptions.workerSrc =
          "https://unpkg.com/pdfjs-dist@2.16.105/legacy/build/pdf.worker.min.js";
      } catch (e) {
        /* ignore */
      }
      return lib;
    };

    const pdfjsLib = await loadPdfJsOnce();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const generatedPages: PdfPage[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.6 });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) continue;

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      await page.render({ canvasContext: context, viewport }).promise;

      generatedPages.push({
        id: crypto.randomUUID(),
        pageNumber: i,
        preview: canvas.toDataURL("image/png"),
        selected: true,
      });
    }

    setPages(generatedPages);
  } catch (error) {
    console.error(error);
    alert("Unable to load PDF pages.");
  }
  };

  const removePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
};

// Split Function
const splitPdf = async () => {
  if (!file) return;

  try {
    setIsProcessing(true);
    setProgress(0);

    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    const bytes =
      await file.arrayBuffer();

    const sourcePdf =
        await PDFDocument.load(bytes, {
            ignoreEncryption: true,
    });

    const newPdf =
      await PDFDocument.create();

    let pageIndexes: number[] = [];

    if (splitMode === "all") {
        const zip = new JSZip();

        const baseName =
            file.name.replace(
            /\.pdf$/i,
            ""
            );

        for (let i = 0; i < pages.length; i++) {
            const p = pages[i];
            const singlePdf = await PDFDocument.create();

            const [copiedPage] = await singlePdf.copyPages(sourcePdf, [p.pageNumber - 1]);

            singlePdf.addPage(copiedPage);

            const singleBytes = await singlePdf.save();

            zip.file(`${baseName}-page-${p.pageNumber}.pdf`, singleBytes);

            setProgress(Math.round(((i + 1) / pages.length) * 100));
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });

        saveAs(zipBlob, `${baseName}-split.zip`);

        setIsProcessing(false);

        return;
    } else {
      // Use remaining pages (those not removed) as selection
      pageIndexes = pages
        .filter((p) => p.selected)
        .map((p) => p.pageNumber - 1);

      if (pageIndexes.length === 0) {
        alert("No pages selected.");
        setIsProcessing(false);
        return;
      }

      const copiedPages = await newPdf.copyPages(sourcePdf, pageIndexes);

      copiedPages.forEach((page) => newPdf.addPage(page));

    const pdfBytes =
      await newPdf.save();

    const blob = new Blob([new Uint8Array(pdfBytes)], {
      type: "application/pdf",
    });

    const url =
      URL.createObjectURL(blob);

    setDownloadUrl(url);

    const baseName =
      file.name.replace(
        /\.pdf$/i,
        ""
      );

    setDownloadFileName(
      `${baseName}-split.pdf`
    );
    }
  } catch (error) {
    console.error(error);

    alert(
      "Failed to split PDF."
    );
  }

  setIsProcessing(false);
};

return (
  <div className="space-y-8">
    <section className="bg-white border rounded-2xl p-8 shadow-md">
        <div
            onClick={() =>
            fileInputRef.current?.click()
            }
            onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
            }}
            onDragLeave={() =>
            setIsDragging(false)
            }
            onDrop={(e) => {
            e.preventDefault();

            setIsDragging(false);

            const droppedFile =
                e.dataTransfer.files?.[0];

            if (droppedFile) {
                handleFile(droppedFile);
            }
            }}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${
            isDragging
                ? "border-black bg-gray-50"
                : "border-gray-300 hover:bg-gray-50"
            }`}
        >
            <h2 className="text-2xl font-semibold text-black">
            Drag & Drop PDF
            </h2>

            <p className="mt-2 text-gray-600">
            or click to select a PDF
            </p>

            <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".pdf"
            onChange={(e) => {
                const selectedFile =
                e.target.files?.[0];

                if (selectedFile) {
                handleFile(selectedFile);
                }
            }}
            />
        </div>
    </section>

    {/* Show Split Information */}
    {file && (
    <section className="bg-white border rounded-2xl p-8 shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-black">
        PDF Information
        </h2>

        <div className="space-y-4">
        <div>
            <span className="font-semibold text-black">
            File Name:
            </span>

            <p className="text-gray-600 break-all">
            {file.name}
            </p>
        </div>

        <div>
            <span className="font-semibold text-black">
            File Size:
            </span>

            <p className="text-gray-600">
            {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
        </div>

        <div>
            <span className="font-semibold text-black">
            Total Pages:
            </span>

            <p className="text-gray-600">
            {pages.length}
            </p>
        </div>
        </div>
    </section>
    )}

    {/* Show Split Setting */}

    {file && (
    <>
        <section className="bg-white border rounded-2xl p-8 shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-black">
          Split Settings
          </h2>

          <div className="space-y-6">

          <div>
            <label className="block font-medium mb-2 text-black">
              Split Mode
            </label>

            <select
              value={splitMode}
              onChange={(e) =>
                setSplitMode(e.target.value as "pages" | "all")
              }
              className="w-full border rounded-lg px-4 py-3"
            >
              <option value="pages">Extract Selected Pages</option>
              <option value="all">Split Every Page (ZIP)</option>
            </select>
          </div>

          {splitMode === "pages" && (
            <div className="mt-4">
              <label className="block font-medium mb-2">
                Page Previews (click × to remove)
              </label>

              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {pages.map((p) => (
                  <div key={p.id} className="relative border rounded overflow-hidden">
                    <img src={p.preview} alt={`Page ${p.pageNumber}`} className="w-full h-28 object-cover" />
                    <button
                      onClick={() => removePage(p.id)}
                      className="absolute top-1 right-1 bg-red-600 text-white font-mediumbg-opacity-80 rounded-full w-6 h-6 text-xs flex items-center justify-center"
                      aria-label={`Remove page ${p.pageNumber}`}
                    >
                      ×
                    </button>
                    <div className="p-1 text-xs text-center">Page {p.pageNumber}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
              onClick={splitPdf}
              disabled={isProcessing}
              className="w-full bg-black text-white py-3 rounded-lg font-medium disabled:bg-gray-400"
              >
              {isProcessing
                  ? "Processing..."
                  : "Split PDF"}
          </button>

          {isProcessing && (
            <>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-6 overflow-hidden">
                <div
                    className="bg-black h-3 transition-all"
                    style={{
                    width: `${progress}%`,
                    }}
                />
                </div>

                <p className="mt-2 text-sm text-gray-600">
                {progress}% completed
                </p>
            </>
            )}

        </div>
      </section>
    
      {/* Add Download Result */}
      {downloadUrl && (
        <section className="bg-white border rounded-2xl p-8 shadow-md">

            <h2 className="text-2xl font-bold mb-6 text-black">
            Split Completed
            </h2>

            <p className="text-gray-600">
            Your new PDF is ready.
            </p>

            <button
            onClick={() => {
                const link =
                document.createElement("a");

                link.href = downloadUrl;

                link.download =
                downloadFileName;

                link.click();
            }}
            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium cursor-pointer"
            >
            Download Split PDF
            </button>

        </section>
       )}

      <section className="bg-gray-50 border rounded-2xl p-6">
          <h3 className="font-semibold">
              Privacy First
          </h3>

          <p className="text-sm text-gray-600 mt-2">
              Your PDF files never leave your browser.
              Splitting happens locally on your device.
          </p>
      </section>
    </>
    )}

</div>
);
}

export default PdfSplitter;
