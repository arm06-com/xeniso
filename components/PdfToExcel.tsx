"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";

type ParsedRow = string[];

export default function PdfToExcel() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadPdfJs = async () => {
    if ((window as any).pdfjsLib) {
      return (window as any).pdfjsLib;
    }

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(
        'script[data-pdfjs="xeniso"]'
      ) as HTMLScriptElement | null;

      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error("Failed to load PDF.js"))
        );
        return;
      }

      const script = document.createElement("script");
      script.setAttribute("data-pdfjs", "xeniso");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.async = true;

      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load PDF.js"));

      document.body.appendChild(script);
    });

    return (window as any).pdfjsLib;
  };

  const normalizePdfRows = (rawRows: string[][]) => {
    const table = rawRows
      .map((row) =>
        row
          .map((cell) => cell.trim())
          .filter((cell) => cell.length > 0)
      )
      .filter((row) => row.length > 0);

    if (!table.length) {
      return [["No table content found"]];
    }

    const maxColumns = Math.max(...table.map((row) => row.length));

    return table.map((row) => {
      const normalized = [...row];
      while (normalized.length < maxColumns) {
        normalized.push("");
      }
      return normalized;
    });
  };

  const inferColumnBoundaries = (
    pageItems: Array<{ x: number; y: number; text: string }>
  ) => {
    const uniqueXs = Array.from(
      new Set(pageItems.map((item) => Math.round(item.x)))
    ).sort((a, b) => a - b);

    if (uniqueXs.length < 2) return [uniqueXs[0] ?? 0];

    const diffs = [] as number[];

    for (let i = 1; i < uniqueXs.length; i += 1) {
      diffs.push(uniqueXs[i] - uniqueXs[i - 1]);
    }

    const sortedDiffs = diffs.sort((a, b) => a - b);

    const medianGap =
      sortedDiffs.length > 0
        ? sortedDiffs[Math.floor(sortedDiffs.length / 2)]
        : 0;

    const gapThreshold = Math.max(36, Math.round(medianGap * 2.1));

    const boundaries = [] as number[];
    const clusters = [] as Array<number[]>;

    let currentCluster = [uniqueXs[0]];

    for (let i = 1; i < uniqueXs.length; i += 1) {
      const distance = uniqueXs[i] - uniqueXs[i - 1];

      if (distance > gapThreshold) {
        clusters.push(currentCluster);
        currentCluster = [uniqueXs[i]];
      } else {
        currentCluster.push(uniqueXs[i]);
      }
    }

    clusters.push(currentCluster);

    for (const cluster of clusters) {
      const start = cluster[0];
      const end = cluster[cluster.length - 1];
      boundaries.push(Math.round((start + end) / 2));
    }

    return boundaries;
  };

  const findNearestColumnIndex = (
    xPosition: number,
    boundaries: number[]
  ) => {
    if (!boundaries.length) return -1;

    if (xPosition <= boundaries[0]) return 0;

    for (let i = 1; i < boundaries.length; i += 1) {
      if (xPosition <= boundaries[i]) {
        return i - 1;
      }
    }

    return boundaries.length - 1;
  };

  const extractRowsFromPdf = async (selectedFile: File) => {
    const buffer = await selectedFile.arrayBuffer();

    const pdfjsLib = await loadPdfJs();
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;

    const extractedRows: string[][] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();

      const pageItems = textContent.items as Array<{
        str: string;
        transform: number[];
      }>;

      const rawTextItems = pageItems
        .map((item) => {
          const text = `${item.str ?? ""}`.trim();
          if (!text) return null;

          const transform = item.transform ?? [1, 0, 0, 1, 0, 0];
          const x = Number(transform[4] ?? 0);
          const y = Number(transform[5] ?? 0);

          return {
            x,
            y,
            text,
          };
        })
        .filter(Boolean) as Array<{ x: number; y: number; text: string }>;

      const yGroups = new Map<number, Array<{ x: number; text: string }>>();

      rawTextItems.forEach((item) => {
        const yBucket = Math.round(item.y / 4) * 4;

        if (!yGroups.has(yBucket)) {
          yGroups.set(yBucket, []);
        }

        yGroups.get(yBucket)?.push({
          x: item.x,
          text: item.text,
        });
      });

      const columnBoundaries = inferColumnBoundaries(rawTextItems);

      const pageRows = Array.from(yGroups.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([yBucket, values]) => {
          const sortedItems = values.sort((a, b) => a.x - b.x);

          if (sortedItems.length === 0) return [];

          const rowCells = Array.from({ length: columnBoundaries.length }, () => "");

          sortedItems.forEach((item) => {
            const columnIndex = findNearestColumnIndex(item.x, columnBoundaries);

            if (columnIndex >= 0) {
              const existing = rowCells[columnIndex] || "";
              const nextValue = `${existing} ${item.text}`.trim();
              rowCells[columnIndex] = nextValue;
            } else {
              rowCells.push(item.text);
            }
          });

          return rowCells
            .map((value) => value.trim())
            .filter((value) => value.length > 0);
        })
        .filter((row) => row.length > 0);

      if (pageRows.length > 0) {
        extractedRows.push(...pageRows);
      }

      setProgress(Math.round((pageNumber / pdf.numPages) * 90));
    }

    const maxColumns = Math.max(
      1,
      ...extractedRows.map((row) => row.length)
    );

    const normalizedRows = extractedRows.map((row) => {
      const normalized = [...row];
      while (normalized.length < maxColumns) {
        normalized.push("");
      }
      return normalized;
    });

    return normalizePdfRows(normalizedRows);
  };

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF document.");
      return;
    }

    setError(null);
    setIsParsing(true);
    setProgress(10);

    try {
      const parsedRows = await extractRowsFromPdf(selectedFile);
      setRows(parsedRows);
      setFile(selectedFile);
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError("Unable to read this PDF. Try a text-based or normal PDF file.");
    } finally {
      setIsParsing(false);
      setTimeout(() => setProgress(0), 900);
    }
  };

  const handleInputFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) handleFile(selectedFile);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const updateCell = (rowIndex: number, columnIndex: number, value: string) => {
    setRows((currentRows) => {
      const clone = [...currentRows];
      clone[rowIndex] = [...clone[rowIndex]];
      clone[rowIndex][columnIndex] = value;
      return clone;
    });
  };

  const addRow = () => {
    const columnCount = Math.max(...rows.map((row) => row.length), 1);
    const newRow = Array.from({ length: columnCount }, () => "");
    setRows((prev) => [...prev, newRow]);
  };

  const addColumn = () => {
    setRows((prev) => prev.map((row) => [...row, ""]));
  };

  const clearRows = () => {
    setRows([]);
    setFile(null);
    setError(null);
  };

  const downloadExcel = () => {
    if (!rows.length) return;

    const maxColumns = Math.max(...rows.map((row) => row.length));

    const htmlRows = rows
      .map((row) => {
        const cells = Array.from({ length: maxColumns }, (_, index) => {
          const value = row[index] ?? "";
          return `<td>${escapeHtml(value)}</td>`;
        }).join("");

        return `<tr>${cells}</tr>`;
      })
      .join("");

    const xls = `
      <html>
        <head>
          <meta charset="utf-8" />
        </head>
        <body>
          <table border="1">${htmlRows}</table>
        </body>
      </html>
    `;

    const blob = new Blob([xls], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });

    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    const baseName = (file?.name || "pdf-to-excel").replace(/\.pdf$/i, "");
    anchor.href = downloadUrl;
    anchor.download = `${baseName}.xls`;

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(downloadUrl);
  };

  const escapeHtml = (value: string) => {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border rounded-2xl p-4 sm:p-8 shadow-md">
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-12 text-center cursor-pointer transition ${
            isDragging
              ? "border-black bg-gray-100"
              : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          <h2 className="text-xl sm:text-2xl font-semibold text-black">
            Upload PDF Document
          </h2>

          <p className="mt-2 text-sm sm:text-base text-orange-500">
            or click to select a PDF file
          </p>

          <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500">
            Supports PDF text extraction and editable conversion to Excel
          </p>

          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="application/pdf,.pdf"
            onChange={handleInputFile}
          />
        </div>

        {file && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-700">
            <span className="font-medium">Selected:</span>
            <span className="bg-gray-100 px-3 py-2 rounded-full">
              {file.name}
            </span>
            <span className="text-gray-500">
              {(file.size / 1024).toFixed(1)} KB
            </span>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </section>

      {isParsing && (
        <section className="bg-white border rounded-2xl p-4 sm:p-8 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-black">
              Extracting PDF content
            </h2>
            <span className="text-sm font-medium text-gray-500">
              {progress}%
            </span>
          </div>

          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>
      )}

      {rows.length > 0 && (
        <section className="bg-white border rounded-2xl p-4 sm:p-8 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-black">
                Editable Excel Sheet
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Review, edit, and export extracted rows
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={addRow}
                className="px-4 py-2 rounded-lg border border-black text-black hover:bg-black hover:text-white transition"
              >
                Add Row
              </button>

              <button
                onClick={addColumn}
                className="px-4 py-2 rounded-lg border border-black text-black hover:bg-black hover:text-white transition"
              >
                Add Column
              </button>

              <button
                onClick={downloadExcel}
                className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-700 transition"
              >
                Download Excel
              </button>

              <button
                onClick={clearRows}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border rounded-xl">
            <table className="min-w-full text-sm">
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`}> 
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`cell-${rowIndex}-${cellIndex}`}
                        className="border border-gray-200 bg-white"
                      >
                        <input
                          value={cell}
                          onChange={(e) =>
                            updateCell(rowIndex, cellIndex, e.target.value)
                          }
                          className="w-full min-w-30 px-3 py-2 outline-none bg-white"
                          aria-label={`Row ${rowIndex + 1}, column ${cellIndex + 1}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
