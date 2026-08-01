"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { MoveDiagonal, Hand, RotateCw, Trash2 } from "lucide-react";

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
  type UploadedFile = {
    id: string;
    file: File;
    thumbnail: string;
    pageCount: number;
  };

  type PdfPage = {
    id: string;
    preview: string;
    sourceFileId: string;
    sourcePageIndex: number;
    pageLabel: string;
    rotation: number;
  };

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [expandedFileIds, setExpandedFileIds] = useState<string[]>([]);

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

    try {
      const pdfjsLib = await loadPdfJs();

      const allPages: PdfPage[] = [];
      const uploadedPdfFiles: UploadedFile[] = [];

      for (
        let fileIndex = 0;
        fileIndex < pdfFiles.length;
        fileIndex++
      ) {
        const file = pdfFiles[fileIndex];
        const fileId = crypto.randomUUID();
        const buffer = await file.arrayBuffer();

        const pdf = await pdfjsLib.getDocument({
          data: buffer,
        }).promise;

        let fileThumbnail = "";

        for (
          let pageIndex = 1;
          pageIndex <= pdf.numPages;
          pageIndex++
        ) {
          const page = await pdf.getPage(pageIndex);

          const viewport = page.getViewport({
            scale: 0.6,
          });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (!context) continue;

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({
            canvasContext: context,
            viewport,
          }).promise;

          const preview = canvas.toDataURL("image/png");

          if (pageIndex === 1) {
            fileThumbnail = preview;
          }

          allPages.push({
            id: crypto.randomUUID(),
            preview,
            sourceFileId: fileId,
            sourcePageIndex: pageIndex - 1,
            pageLabel: `Page ${pageIndex}`,
            rotation: 0,
          });
        }

        uploadedPdfFiles.push({
          id: fileId,
          file,
          thumbnail: fileThumbnail,
          pageCount: pdf.numPages,
        });
      }

      setFiles(uploadedPdfFiles);
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

  const handleDeleteFile = (fileId: string) => {
    const fileIndex = files.findIndex((file) => file.id === fileId);
    if (fileIndex === -1) return;

    setFiles((prevFiles) =>
      prevFiles.filter((file) => file.id !== fileId)
    );

    setPages((prevPages) =>
      prevPages.filter(
        (page) => page.sourceFileId !== fileId
      )
    );

    setExpandedFileIds((prev) =>
      prev.filter((id) => id !== fileId)
    );
  };

  const handleFileDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setFiles((prevFiles) => {
      const oldIndex = prevFiles.findIndex(
        (file) => file.id === active.id
      );
      const newIndex = prevFiles.findIndex(
        (file) => file.id === over.id
      );

      if (oldIndex === -1 || newIndex === -1) return prevFiles;

      return arrayMove(prevFiles, oldIndex, newIndex);
    });
  };

  const handlePageDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setPages((items) => {
      const oldIndex = items.findIndex(
        (page) => page.id === active.id
      );
      const newIndex = items.findIndex(
        (page) => page.id === over.id
      );

      if (oldIndex === -1 || newIndex === -1) return items;

      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const rotatePage = (pageId: string) => {
    setPages((prev) =>
      prev.map((page) =>
        page.id === pageId
          ? {
              ...page,
              rotation: (page.rotation + 90) % 360,
            }
          : page
      )
    );
  };

  const moveFilePage = (
    pageId: string,
    direction: "up" | "down"
  ) => {
    const currentIndex = pages.findIndex(
      (page) => page.id === pageId
    );
    if (currentIndex === -1) return;

    const nextIndex =
      direction === "up"
        ? currentIndex - 1
        : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= pages.length) return;

    setPages((prev) => {
      const nextPages = [...prev];
      [nextPages[currentIndex], nextPages[nextIndex]] = [
        nextPages[nextIndex],
        nextPages[currentIndex],
      ];
      return nextPages;
    });
  };

  const toggleFileExpand = (fileId: string) => {
    setExpandedFileIds((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const expandedPages = pages.filter((page) =>
    expandedFileIds.includes(page.sourceFileId)
  );

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
          fileId: file.id,
          pdf: await PDFDocument.load(
            await file.file.arrayBuffer()
          ),
        }))
      );

      const loadedPdfMap = new Map(
        loadedPdfs.map((item) => [item.fileId, item.pdf])
      );

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const sourcePdf = loadedPdfMap.get(page.sourceFileId);
        if (!sourcePdf) continue;

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

  function SortableFileCard({
    file,
    index,
    onDelete,
    onExpand,
  }: any) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: file.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative rounded-2xl overflow-hidden bg-white shadow-sm"
      >
        <div className="group relative">
          <img
            src={file.thumbnail}
            alt="PDF thumbnail"
            className="w-full h-44 object-cover"
          />

          <div className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onExpand(file.id);
              }}
              className="rounded-full bg-white/90 p-2 text-slate-900 shadow"
            >
              <MoveDiagonal className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(file.id);
              }}
              className="rounded-full bg-red-600 p-2 text-white shadow"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 flex h-9 w-9 cursor-grab items-center justify-center rounded-full bg-white/90 text-slate-900 shadow"
          >
            <Hand className="h-4 w-4" />
          </div>

          <div className="absolute top-2 right-2 rounded-full bg-slate-900/80 px-2 py-1 text-xs text-white">
            {file.pageCount} pages
          </div>
        </div>
      </div>
    );
  }

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

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleFileDragEnd}
          >
            <SortableContext
              items={files.map((file) => file.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <SortableFileCard
                    key={file.id}
                    file={file}
                    onDelete={handleDeleteFile}
                    onExpand={toggleFileExpand}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {expandedFileIds.length > 0 && (
            <div className="mt-6 border-t pt-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Expanded pages
                  </h3>
                </div>
              </div>

              <div className="mt-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handlePageDragEnd}
                >
                  <SortableContext
                    items={expandedPages.map((page) => page.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {expandedPages.map((page, index) => (
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
              </div>
            </div>
          )}
        </section>
      )}
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
          className="w-full h-150 border rounded-lg"
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