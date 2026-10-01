"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [merging, setMerging] = useState(false);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState("");

  const handleFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const pdfFiles = Array.from(selectedFiles).filter(
      (file) => file.type === "application/pdf"
    );

    setFiles(pdfFiles);
    setMergedBlob(null);
    setError("");
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError("Merge karne ke liye kam se kam 2 PDF select karo.");
      return;
    }

    setMerging(true);
    setError("");
    setMergedBlob(null);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);

        const pages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );

        pages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      const mergedBytes = await mergedPdf.save();

      const blob = new Blob([new Uint8Array(mergedBytes)], {
  type: "application/pdf",
});

      setMergedBlob(blob);
    } catch (error) {
      console.error(error);
      setError("PDF merge nahi ho payi. Dobara try karo.");
    } finally {
      setMerging(false);
    }
  };

  const handleDownload = () => {
    if (!mergedBlob) return;

    const url = window.URL.createObjectURL(mergedBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "merged.pdf";

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const totalSize = files.reduce(
    (total, file) => total + file.size,
    0
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-16">

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-sm font-bold text-white">
            PDF
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Merge PDF
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            Combine multiple PDF files into one single PDF.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-10 transition hover:border-gray-500 hover:bg-gray-50">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-xl">
              +
            </div>

            <span className="mt-4 text-lg font-semibold text-gray-800">
              Select PDF files
            </span>

            <span className="mt-2 text-sm text-gray-500">
              Select two or more PDF files
            </span>

            <input
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

          </label>

          {files.length > 0 && (
            <div className="mt-5 space-y-3">

              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-800">
                      {index + 1}. {file.name}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {formatSize(file.size)}
                    </p>
                  </div>

                  <span className="ml-4 rounded-lg bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                    PDF
                  </span>
                </div>
              ))}

              <div className="pt-2 text-center text-sm text-gray-500">
                {files.length} files • {formatSize(totalSize)}
              </div>

            </div>
          )}

          <button
            onClick={handleMerge}
            disabled={files.length < 2 || merging}
            className="mt-6 w-full rounded-xl bg-black px-6 py-3.5 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {merging ? "Merging PDFs..." : "Merge PDF"}
          </button>

          {merging && (
            <p className="mt-5 text-center text-sm text-gray-500">
              Please wait while we merge your PDF files...
            </p>
          )}

          {error && (
            <div className="mt-5 rounded-xl bg-red-50 p-4 text-center text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {mergedBlob && (
            <div className="mt-6 rounded-2xl bg-gray-50 p-5 ring-1 ring-gray-200">

              <div className="text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  ✓
                </div>

                <h2 className="mt-3 text-xl font-bold text-gray-900">
                  PDFs Merged Successfully
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Your merged PDF is ready.
                </p>

              </div>

              <button
                onClick={handleDownload}
                className="mt-5 w-full rounded-xl bg-black px-6 py-3.5 font-semibold text-white transition hover:bg-gray-800"
              >
                Download Merged PDF
              </button>

            </div>
          )}

        </div>

        <div className="mx-auto mt-10 grid max-w-xl gap-4 sm:grid-cols-3">

          <div className="rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-gray-200">
            <p className="font-semibold text-gray-900">
              Fast
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Merge PDFs quickly
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-gray-200">
            <p className="font-semibold text-gray-900">
              Simple
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Easy to use
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-gray-200">
            <p className="font-semibold text-gray-900">
              Free
            </p>

            <p className="mt-1 text-xs text-gray-500">
              No account required
            </p>
          </div>

        </div>

      </div>
    </main>
  );
}