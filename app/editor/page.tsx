"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const PDFViewer = dynamic(() => import("./pdf-viewer"), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg bg-white p-10 shadow-lg">
      Loading PDF viewer...
    </div>
  ),
});

export default function EditorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const handleFile = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Sirf PDF file select karo.");
      return;
    }

    setFile(selectedFile);
    setError("");
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">
            PDF Editor
          </h1>

          <button
            disabled={!file}
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save PDF
          </button>
        </div>
      </header>

      {!file ? (
        <section className="mx-auto max-w-3xl px-6 py-20">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-sm font-bold text-white">
              PDF
            </div>

            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Edit your PDF
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-gray-600">
              Upload a PDF to start editing text, adding text,
              highlighting, drawing and more.
            </p>

            <label className="mx-auto mt-8 flex max-w-xl cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-12 transition hover:border-gray-500 hover:bg-gray-50">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                ↑
              </div>

              <span className="mt-4 text-lg font-semibold text-gray-800">
                Select your PDF
              </span>

              <span className="mt-2 text-sm text-gray-500">
                Click here to upload a PDF
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

            {error && (
              <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-7xl px-6 py-6">
          <div className="mb-5 flex items-center justify-between rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-gray-200">
            <div>
              <p className="font-semibold text-gray-900">
                {file.name}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                PDF loaded successfully
              </p>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setError("");
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Change PDF
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
            <aside className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
              <p className="mb-3 text-sm font-semibold text-gray-900">
                Editing Tools
              </p>

              <div className="space-y-2">
                <button className="w-full rounded-lg bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-200">
                  ✏️ Edit Text
                </button>

                <button className="w-full rounded-lg bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-200">
                  ＋ Add Text
                </button>

                <button className="w-full rounded-lg bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-200">
                  🖍️ Highlight
                </button>

                <button className="w-full rounded-lg bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-200">
                  ✏️ Draw
                </button>

                <button className="w-full rounded-lg bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-200">
                  🖼️ Add Image
                </button>

                <button className="w-full rounded-lg bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-200">
                  ✍️ Signature
                </button>

                <button className="w-full rounded-lg bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-200">
                  🗑️ Delete
                </button>
              </div>
            </aside>

            <div className="min-h-[650px] rounded-xl bg-gray-300 p-8">
              <PDFViewer file={file} />
            </div>
          </div>
        </section>
      )}
    </main>
  );
}