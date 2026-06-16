"use client";

import { useRef, useState } from "react";
import jsPDF from "jspdf";
import SortablePreviewCard from "@/components/SortablePreviewCard";

import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

// States
export default function PdfConverter() {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  type PreviewItem = {
    id: string;
    preview: string;
    file: File;
  };

  const [files, setFiles] =
    useState<File[]>([]);

  const [previews, setPreviews] =
    useState<PreviewItem[]>([]);

  const [isDragging, setIsDragging] =
    useState(false);

  const [isConverting, setIsConverting] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [pageFormat, setPageFormat] =
   useState<"a4" | "letter">("a4");

  const [orientation, setOrientation] =
   useState<"portrait" | "landscape">(
    "portrait"
  );

  const [margin, setMargin] =
   useState(10);

  const [quality, setQuality] =
   useState(90);

// Handle Files
const handleFiles = (
  selectedFiles: FileList | File[]
) => {
  const validFiles = Array.from(
    selectedFiles
  ).filter((file) =>
    file.type.startsWith("image/")
  );

  if (!validFiles.length) {
    alert("Please upload images.");
    return;
  }

  setFiles((prev) => [
    ...prev,
    ...validFiles,
  ]);

  validFiles.forEach((file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      if (
        typeof e.target?.result ===
        "string"
      ) {
        setPreviews((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            preview: e.target!.result as string,
            file,
          },
        ]);
      }
    };

    reader.readAsDataURL(file);
  });
};

// Remove Image
const removeImage = (
  index: number
) => {
  setFiles((prev) =>
    prev.filter((_, i) => i !== index)
  );

  setPreviews((prev) =>
    prev.filter((_, i) => i !== index)
  );
};

//convert to PDF
const convertToPdf = async () => {
  if (!previews.length) return;

  setIsConverting(true);
  setProgress(0);

  const pdf = new jsPDF({
    orientation,
    format: pageFormat,
  });

  for (
    let i = 0;
    i < previews.length;
    i++
  ) {
    const image =
      previews[i].preview;

    const img = new Image();

    await new Promise<void>((resolve) => {
      img.onload = () => {
        const pageWidth =
          pdf.internal.pageSize.getWidth();

        const pageHeight =
          pdf.internal.pageSize.getHeight();

        const availableWidth =
          pageWidth - margin * 2;

        const availableHeight =
          pageHeight - margin * 2;

        let imageWidth =
          availableWidth;

        let imageHeight =
          (img.height * imageWidth) /
          img.width;

        if (
          imageHeight >
          availableHeight
        ) {
          imageHeight =
            availableHeight;

          imageWidth =
            (img.width * imageHeight) /
            img.height;
        }
        
        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          image,
          "JPEG",
          margin,
          margin,
          imageWidth,
          imageHeight,
          undefined,
          quality >= 90
            ? "FAST"
            : "MEDIUM"
        );
        setProgress(
          Math.round(
            ((i + 1) /
              previews.length) *
              100
          )
        );

        resolve();
      };

      img.src = image;
    });
  }

  pdf.save("xeniso-images.pdf");

  setIsConverting(false);
};

const handleDragEnd = (
  event: DragEndEvent
) => {
  const { active, over } = event;

  if (
    !over ||
    active.id === over.id
  ) {
    return;
  }

  setPreviews((items) => {
    const oldIndex =
      items.findIndex(
        (item) =>
          item.id === active.id
      );

    const newIndex =
      items.findIndex(
        (item) =>
          item.id === over.id
      );

    return arrayMove(
      items,
      oldIndex,
      newIndex
    );
  });
};

return (
  <div className="space-y-8">
    {/* Upload Area */}
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

          handleFiles(
            e.dataTransfer.files
          );
        }}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${
          isDragging
            ? "border-black bg-gray-50"
            : "border-gray-300 hover:bg-gray-50"
        }`}
      >
        <h2 className="text-2xl font-semibold">
          Drag & Drop Images
        </h2>

        <p className="mt-2 text-gray-600">
          or click to select images
        </p>

        <p className="mt-4 text-sm text-gray-500">
          JPG, PNG and WebP supported
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept="image/*"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(
                e.target.files
              );
            }
          }}
        />
      </div>

    </section>

    {/* Preview Section*/}
    {previews.length > 0 && (
      <section className="bg-white border rounded-2xl p-8 shadow-md">

        <h2 className="text-2xl font-bold mb-6">
          Selected Images
        </h2>

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={previews.map(
              (item) => item.id
            )}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

              {previews.map(
                (item, index) => (
                  <SortablePreviewCard
                    key={item.id}
                    id={item.id}
                    preview={item.preview}
                    pageNumber={index + 1}
                    onRemove={() =>
                      removeImage(index)
                    }
                  />
                )
              )}

            </div>
          </SortableContext>
        </DndContext>

      </section>
    )}

    {/* Settings Section */}
    <section className="bg-white border rounded-2xl p-8 shadow-md">
        <h2 className="text-2xl font-bold mb-6">
            PDF Settings
        </h2>

        <div className="grid md:grid-cols-2 gap-6">

            <div>
            <label className="block font-medium mb-2">
                Page Size
            </label>

            <select
                value={pageFormat}
                onChange={(e) =>
                setPageFormat(
                    e.target.value as "a4" | "letter"
                )
                }
                className="w-full border rounded-lg px-4 py-3"
            >
                <option value="a4">A4</option>
                <option value="letter">
                Letter
                </option>
            </select>
            </div>

            <div>
            <label className="block font-medium mb-2">
                Orientation
            </label>

            <select
                value={orientation}
                onChange={(e) =>
                setOrientation(
                    e.target.value as
                    | "portrait"
                    | "landscape"
                )
                }
                className="w-full border rounded-lg px-4 py-3"
            >
                <option value="portrait">
                Portrait
                </option>

                <option value="landscape">
                Landscape
                </option>
            </select>
            </div>

            <div>
            <label className="block font-medium mb-2">
                Margin ({margin}px)
            </label>

            <input
                type="range"
                min="0"
                max="40"
                value={margin}
                onChange={(e) =>
                setMargin(
                    Number(e.target.value)
                )
                }
                className="w-full"
            />
            </div>

            <div>
            <label className="block font-medium mb-2">
                Image Quality ({quality}%)
            </label>

            <input
                type="range"
                min="40"
                max="100"
                value={quality}
                onChange={(e) =>
                setQuality(
                    Number(e.target.value)
                )
                }
                className="w-full"
            />
            </div>

        </div>
    </section>

    {/* Convert Section */}
    {files.length > 0 && (
        <section className="bg-white border rounded-2xl p-8 shadow-md">

            <button
            onClick={convertToPdf}
            disabled={isConverting}
            className="w-full bg-black text-white py-3 rounded-lg font-medium"
            >
            {isConverting
                ? "Creating PDF..."
                : "Convert to PDF"}
            </button>

            {isConverting && (
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

        </section>
        )}
  </div>
);
}