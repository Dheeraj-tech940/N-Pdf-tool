"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [error, setError] = useState("");

  const handleCompress = async () => {
    if (!file) {
      setError("Pehle PDF select karo.");
      return;
    }

    setCompressing(true);
    setError("");
    setCompressedBlob(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://127.0.0.1:8000/compress", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Compression failed");
      }

      const blob = await response.blob();

      setOriginalSize(file.size);
      setCompressedSize(blob.size);
      setCompressedBlob(blob);
    } catch (error) {
      console.error(error);
      setError("Compression failed. Backend check karo.");
    } finally {
      setCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!compressedBlob) return;

    const url = window.URL.createObjectURL(compressedBlob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "compressed.pdf";
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

  const savedBytes = originalSize - compressedSize;

  const savedPercentage =
    originalSize > 0
      ? Math.max(0, (savedBytes / originalSize) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-16">

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-2xl text-white">
            PDF
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Compress PDF
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            Reduce your PDF file size while keeping the document easy to use
            and share.
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
              Click here to choose a PDF file
            </span>

            <input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0] || null;

                setFile(selectedFile);
                setCompressedBlob(null);
                setError("");
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
            onClick={handleCompress}
            disabled={!file || compressing}
            className="mt-6 w-full rounded-xl bg-black px-6 py-3.5 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {compressing ? "Compressing PDF..." : "Compress PDF"}
          </button>

          {compressing && (
            <div className="mt-5 text-center">
              <p className="text-sm text-gray-500">
                Please wait while we compress your PDF...
              </p>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-xl bg-red-50 p-4 text-center text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {compressedBlob && (
            <div className="mt-6 rounded-2xl bg-gray-50 p-5 ring-1 ring-gray-200">

              <div className="text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  ✓
                </div>

                <h2 className="mt-3 text-xl font-bold text-gray-900">
                  Compression Complete
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Your compressed PDF is ready.
                </p>

              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">

                <div className="rounded-xl bg-white p-3 text-center ring-1 ring-gray-200">
                  <p className="text-xs text-gray-500">
                    Original
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {formatSize(originalSize)}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-3 text-center ring-1 ring-gray-200">
                  <p className="text-xs text-gray-500">
                    Compressed
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {formatSize(compressedSize)}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-3 text-center ring-1 ring-gray-200">
                  <p className="text-xs text-gray-500">
                    Saved
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {savedPercentage.toFixed(1)}%
                  </p>
                </div>

              </div>

              <button
                onClick={handleDownload}
                className="mt-5 w-full rounded-xl bg-black px-6 py-3.5 font-semibold text-white transition hover:bg-gray-800"
              >
                Download Compressed PDF
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
              Quick PDF compression
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