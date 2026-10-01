"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [splitting, setSplitting] = useState(false);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState("");

  const handleFile = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Sirf PDF file select karo.");
      return;
    }

    setFile(selectedFile);
    setZipBlob(null);
    setPageCount(0);
    setError("");
  };

  const handleSplit = async () => {
    if (!file) {
      setError("Pehle PDF select karo.");
      return;
    }

    setSplitting(true);
    setError("");
    setZipBlob(null);

    try {
      const arrayBuffer = await file.arrayBuffer();

      const pdf = await PDFDocument.load(arrayBuffer);
      const totalPages = pdf.getPageCount();

      setPageCount(totalPages);

      const zip = new JSZip();

      for (let i = 0; i < totalPages; i++) {
        const singlePagePdf = await PDFDocument.create();

        const [page] = await singlePagePdf.copyPages(pdf, [i]);

        singlePagePdf.addPage(page);

        const pdfBytes = await singlePagePdf.save();

        zip.file(`page-${i + 1}.pdf`, pdfBytes);
      }

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
      });

      setZipBlob(zipBlob);
    } catch (error) {
      console.error(error);
      setError("PDF split nahi ho payi. Dobara try karo.");
    } finally {
      setSplitting(false);
    }
  };

  const handleDownload = () => {
    if (!zipBlob) return;

    const url = window.URL.createObjectURL(zipBlob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "split-pdf-pages.zip";

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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-16">

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-sm font-bold text-white">
            PDF
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Split PDF
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            Split your PDF into separate pages and download them as a ZIP file.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-10 transition hover:border-gray-500 hover:bg-gray-50">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-xl">
              ↑
            </div>

            <span className="mt-4 text-lg font-semibold text-gray-800">
              Select your PDF
            </span>

            <span className="mt-2 text-sm text-gray-500">
              Choose a PDF to split
            </span>

            <input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                handleFile(e.target.files?.[0] || null);
              }}
            />

          </label>

          {file && (
            <div className="mt-5 flex items-center justify-between rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200">

              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-800">
                  {file.name}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {formatSize(file.size)}
                </p>
              </div>

              <span className="ml-4 rounded-lg bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                PDF
              </span>

            </div>
          )}

          <button
            onClick={handleSplit}
            disabled={!file || splitting}
            className="mt-6 w-full rounded-xl bg-black px-6 py-3.5 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {splitting ? "Splitting PDF..." : "Split PDF"}
          </button>

          {splitting && (
            <p className="mt-5 text-center text-sm text-gray-500">
              Please wait while we split your PDF...
            </p>
          )}

          {error && (
            <div className="mt-5 rounded-xl bg-red-50 p-4 text-center text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {zipBlob && (
            <div className="mt-6 rounded-2xl bg-gray-50 p-5 ring-1 ring-gray-200">

              <div className="text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  ✓
                </div>

                <h2 className="mt-3 text-xl font-bold text-gray-900">
                  PDF Split Successfully
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {pageCount} pages were separated successfully.
                </p>

              </div>

              <button
                onClick={handleDownload}
                className="mt-5 w-full rounded-xl bg-black px-6 py-3.5 font-semibold text-white transition hover:bg-gray-800"
              >
                Download ZIP
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
              Split PDFs quickly
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