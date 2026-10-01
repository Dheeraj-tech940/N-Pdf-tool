"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [converting, setConverting] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [error, setError] = useState("");

  const handleFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const imageFiles = Array.from(selectedFiles).filter(
      (file) =>
        file.type === "image/jpeg" ||
        file.type === "image/jpg"
    );

    if (imageFiles.length === 0) {
      setError("Sirf JPG/JPEG images select karo.");
      return;
    }

    setFiles(imageFiles);
    setPdfBlob(null);
    setError("");
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      setError("Pehle JPG images select karo.");
      return;
    }

    setConverting(true);
    setError("");
    setPdfBlob(null);

    try {
      const pdf = new jsPDF();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const imageUrl = URL.createObjectURL(file);

        const image = new Image();

        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("Image load failed"));
          image.src = imageUrl;
        });

        const pageWidth = 210;
        const pageHeight = 297;

        const imageRatio = image.width / image.height;

        let imageWidth = pageWidth - 20;
        let imageHeight = imageWidth / imageRatio;

        if (imageHeight > pageHeight - 20) {
          imageHeight = pageHeight - 20;
          imageWidth = imageHeight * imageRatio;
        }

        const x = (pageWidth - imageWidth) / 2;
        const y = (pageHeight - imageHeight) / 2;

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          image,
          "JPEG",
          x,
          y,
          imageWidth,
          imageHeight
        );

        URL.revokeObjectURL(imageUrl);
      }

      const blob = pdf.output("blob");

      setPdfBlob(blob);
    } catch (error) {
      console.error(error);
      setError("JPG to PDF conversion failed. Dobara try karo.");
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = () => {
    if (!pdfBlob) return;

    const url = URL.createObjectURL(pdfBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "images.pdf";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
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
            JPG
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            JPG to PDF
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            Convert one or more JPG images into a single PDF file.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-10 transition hover:border-gray-500 hover:bg-gray-50">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-xl">
              ↑
            </div>

            <span className="mt-4 text-lg font-semibold text-gray-800">
              Select JPG images
            </span>

            <span className="mt-2 text-sm text-gray-500">
              You can select multiple JPG files
            </span>

            <input
              type="file"
              accept=".jpg,.jpeg,image/jpeg"
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
                    JPG
                  </span>
                </div>
              ))}

              <div className="pt-2 text-center text-sm text-gray-500">
                {files.length} images • {formatSize(totalSize)}
              </div>

            </div>
          )}

          <button
            onClick={handleConvert}
            disabled={files.length === 0 || converting}
            className="mt-6 w-full rounded-xl bg-black px-6 py-3.5 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {converting ? "Creating PDF..." : "Convert to PDF"}
          </button>

          {converting && (
            <p className="mt-5 text-center text-sm text-gray-500">
              Please wait while we create your PDF...
            </p>
          )}

          {error && (
            <div className="mt-5 rounded-xl bg-red-50 p-4 text-center text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {pdfBlob && (
            <div className="mt-6 rounded-2xl bg-gray-50 p-5 ring-1 ring-gray-200">

              <div className="text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  ✓
                </div>

                <h2 className="mt-3 text-xl font-bold text-gray-900">
                  PDF Created Successfully
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {files.length} images were converted into one PDF.
                </p>

              </div>

              <button
                onClick={handleDownload}
                className="mt-5 w-full rounded-xl bg-black px-6 py-3.5 font-semibold text-white transition hover:bg-gray-800"
              >
                Download PDF
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
              Convert images quickly
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-gray-200">
            <p className="font-semibold text-gray-900">
              Multiple Images
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Combine many JPGs
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