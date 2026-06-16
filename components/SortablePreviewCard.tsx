"use client";

import {
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

type Props = {
  id: string;
  preview: string;
  pageNumber: number;
  onRemove: () => void;
};

export default function SortablePreviewCard({
  id,
  preview,
  pageNumber,
  onRemove,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform:
      CSS.Transform.toString(
        transform
      ),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative border rounded-xl overflow-hidden bg-white shadow-sm"
    >
      <img
        src={preview}
        alt={`Page ${pageNumber}`}
        className="w-full h-48 object-cover"
      />

      {/* Page Number */}
      <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 rounded text-sm">
        Page {pageNumber}
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-sm"
      >
        Remove
      </button>

      {/* Drag Indicator */}
      <div className="absolute bottom-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs shadow">
        Drag to reorder
      </div>
    </div>
  );
}