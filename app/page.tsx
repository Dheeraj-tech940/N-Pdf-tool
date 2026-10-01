import Link from "next/link";

const tools = [
  {
    title: "Merge PDF",
    description: "Combine multiple PDF files into one PDF.",
    href: "/merge",
    icon: "＋",
  },
  {
    title: "Compress PDF",
    description: "Reduce PDF file size quickly and easily.",
    href: "/compress",
    icon: "↓",
  },
  {
    title: "Split PDF",
    description: "Split a PDF into separate pages.",
    href: "/split",
    icon: "✂",
  },
  {
    title: "JPG to PDF",
    description: "Convert one or more JPG images into a PDF.",
    href: "/jpg-to-pdf",
    icon: "JPG",
  },
  {
    title: "PDF to JPG",
    description: "Convert PDF pages into JPG images.",
    href: "/pdf-to-jpg",
    icon: "PDF",
  },
    {
    title: "PDF Editor",
    description: "Edit text, add text, highlight and sign your PDF.",
    href: "/editor",
    icon: "✎",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">

      <header className="border-b bg-white">
       <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Link
            href="/"
           className="text-2xl font-extrabold tracking-tight text-gray-900"
          >
            PDFTool
          </Link>

          <span className="text-sm text-gray-500">
            Simple PDF Tools
          </span>
        </div>
      </header>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">

          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-sm font-bold text-white">
            PDF
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
  Powerful PDF Tools
</h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-600">
            Merge, compress, split and convert your PDF files quickly
            and easily.
          </p>

        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">

          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group rounded-2xl bg-white p-7 shadow-md ring-1 ring-gray-200 transition duration-200 hover:-translate-y-1 hover:shadow-xl"
            >

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-xl font-bold text-gray-900 shadow-sm transition duration-200 group-hover:bg-black group-hover:text-white group-hover:shadow-md">
  {tool.icon}
</div>

              <h2 className="mt-6 text-xl font-extrabold text-gray-900">
                {tool.title}
              </h2>

              <p className="mt-2 leading-6 text-gray-600">
                {tool.description}
              </p>

              <div className="mt-6 text-sm font-bold text-gray-900 transition group-hover:translate-x-1">
                Open Tool →
              </div>

            </Link>
          ))}

        </div>
      </section>

      <section className="border-t bg-white px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">

          <h2 className="text-2xl font-bold text-gray-900">
            More PDF Tools Coming Soon
          </h2>

          <p className="mt-3 text-gray-600">
            PDF Editor, Rotate PDF and more.
          </p>

        </div>
      </section>

      <footer className="border-t bg-gray-50 px-6 py-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-gray-500">
          © 2026 PDFTool. All rights reserved.
        </div>
      </footer>

    </main>
  );
}