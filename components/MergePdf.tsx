"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

export default function MergePdf() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  type PdfPage = {
    id: string;
    preview: string;
    sourceFileIndex: number;
    sourcePageIndex: number;
    pageLabel: string;
  };
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    return () => {
      if (mergedPdfUrl) {
        URL.revokeObjectURL(mergedPdfUrl);
      }
    };
  }, [mergedPdfUrl]);
  // Load PDF
  const loadPdfJs = async () => {
    if ((window as any).pdfjsLib) {
      return (window as any).pdfjsLib;
    }

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");

      script.src =
        "https://unpkg.com/pdfjs-dist@2.16.105/legacy/build/pdf.min.js";

      script.onload = () => resolve();

      script.onerror = () =>
        reject(new Error("Failed to load PDF.js"));

      document.head.appendChild(script);
    });

    const pdfjsLib = (window as any).pdfjsLib;

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://unpkg.com/pdfjs-dist@2.16.105/legacy/build/pdf.worker.min.js";

    return pdfjsLib;
  };
  //  Handle Files
  const handleFiles = async (uploadedFiles: File[]) => {
    const pdfFiles = uploadedFiles.filter(
      (file) => file.type === "application/pdf"
    );

    if (!pdfFiles.length) {
      alert("Please upload PDF files only.");
      return;
    }

    setFiles(pdfFiles);

    try {
      const pdfjsLib = await loadPdfJs();

      const allPages: PdfPage[] = [];

      for (
        let fileIndex = 0;
        fileIndex < pdfFiles.length;
        fileIndex++
      ) {
        const file = pdfFiles[fileIndex];

        const buffer = await file.arrayBuffer();

        const pdf = await pdfjsLib.getDocument({
          data: buffer,
        }).promise;

        for (
          let pageIndex = 1;
          pageIndex <= pdf.numPages;
          pageIndex++
        ) {
          const page = await pdf.getPage(pageIndex);

          const viewport = page.getViewport({
            scale: 0.6,
          });

          const canvas =
            document.createElement("canvas");

          const context =
            canvas.getContext("2d");

          if (!context) continue;

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({
            canvasContext: context,
            viewport,
          }).promise;

          allPages.push({
            id: crypto.randomUUID(),
            preview: canvas.toDataURL("image/png"),
            sourceFileIndex: fileIndex,
            sourcePageIndex: pageIndex - 1,
            pageLabel: `${file.name} - Page ${pageIndex}`,
          });
        }
      }

      setPages(allPages);
    } catch (error) {
      console.error(error);
      alert("Failed to load PDF pages.");
    }
  };

  const removePage = (id: string) => {
    setPages((prev) =>
      prev.filter((page) => page.id !== id)
    );
  };

  const mergePdf = async () => {
    if (!pages.length) {
      alert("No pages to merge.");
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);

      if (mergedPdfUrl) {
        URL.revokeObjectURL(mergedPdfUrl);
      }

      const mergedPdf = await PDFDocument.create();

      const loadedPdfs = await Promise.all(
        files.map(async (file) => ({
          pdf: await PDFDocument.load(
            await file.arrayBuffer()
          ),
        }))
      );

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        const sourcePdf =
          loadedPdfs[page.sourceFileIndex].pdf;

        const [copiedPage] =
          await mergedPdf.copyPages(sourcePdf, [
            page.sourcePageIndex,
          ]);

        mergedPdf.addPage(copiedPage);

        setProgress(
          Math.round(
            ((i + 1) / pages.length) * 100
          )
        );
      }

      const pdfBytes = await mergedPdf.save();

      const blob = new Blob(
        [new Uint8Array(pdfBytes)],
        { type: "application/pdf" }
      );

      const url = URL.createObjectURL(blob);

      setMergedPdfUrl(url);
    } catch (error) {
      console.error(error);
      alert("Failed to merge PDF.");
    }

    setIsProcessing(false);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setPages((items) => {
      const oldIndex = items.findIndex(
        (i) => i.id === active.id
      );

      const newIndex = items.findIndex(
        (i) => i.id === over.id
      );

      return arrayMove(items, oldIndex, newIndex);
    });
  };

  function SortablePage({
    page,
    index,
    removePage,
  }: any) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: page.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative border rounded-lg overflow-hidden bg-white"
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <div className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-1 rounded z-10">
            {index + 1}
          </div>

          <button
            onClick={() => removePage(page.id)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600 text-white z-10"
          >
            ×
          </button>

          <img
            src={page.preview}
            alt=""
            className="w-full h-32 object-cover"
          />

          <div className="text-xs text-center p-2 text-gray-700">
            {page.pageLabel}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 px-4 md:px-8 py-6 bg-gray-50 min-h-screen">
      {/* Upload Area */}
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

            const droppedFiles = Array.from(
              e.dataTransfer.files
            );

            handleFiles(droppedFiles);
          }}
          className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition ${
            isDragging
              ? "border-gray-900 bg-gray-100"
              : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
            Drag & Drop PDFs
          </h2>

          <p className="mt-2 text-orange-500">
            or click to select PDF files
          </p>

          <p className="mt-2 text-gray-500">
            Merge multiple PDF files into one
          </p>

          <input
            ref={fileInputRef}
            hidden
            multiple
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              if (e.target.files) {
                handleFiles(
                  Array.from(e.target.files)
                );
              }
            }}
          />
        </div>
      </section>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-4">
            Uploaded Files ({files.length})
          </h2>

          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 text-sm text-gray-700"
              >
                <div className="font-medium">
                  {file.name}
                </div>

                <div className="text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {pages.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-6">
            PDF Pages (Drag to Reorder) ({pages.length})
          </h2>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pages.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {pages.map((page, index) => (
                  <SortablePage
                    key={page.id}
                    page={page}
                    index={index}
                    removePage={removePage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      )}

      {/* Merge UI */}
      {pages.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <button
            onClick={mergePdf}
            disabled={isProcessing}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800"
          >
            {isProcessing ? "Merging..." : "Merge PDF"}
          </button>

          {isProcessing && (
            <div className="mt-6">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-3 bg-black transition-all"
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

      {/* Preview and Download */}
      {mergedPdfUrl && (
      <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-bold mb-4">
          Merged PDF Preview
        </h2>

        <iframe
          src={mergedPdfUrl}
          className="w-full h-[600px] border rounded-lg"
        />

        <a
          href={mergedPdfUrl}
          download="merged.pdf"
          className="mt-4 block text-center bg-green-600 text-white py-3 rounded-lg"
        >
          Download PDF
        </a>
      </section>
    )}
    </div>
  );
}