"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { Rnd } from "react-rnd";
import { useEffect, useRef, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

type ExistingText = {
  id: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  lineHeight: string;
  pageIndex: number;
  spanIndex: number;
};

type TextFormatting = {
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  color: string;
  fontFamily: string;
  textAlign: "left" | "center" | "right";
};

type TextBox = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  color: string;
  backgroundColor: string;
  textAlign: "left" | "center" | "right";
};

type HighlightBox = {
  id: number;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
};

type Props = {
  file: File;
};

const COLORS = [
  "#000000",
  "#1f2937",
  "#dc2626",
  "#2563eb",
  "#16a34a",
  "#9333ea",
];

const FONTS = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Courier New",
];
const getPdfFont = (
  fontFamily: string,
  fontWeight: string,
  fontStyle: string
) => {
  const isBold = fontWeight === "bold";
  const isItalic = fontStyle === "italic";

  const isTimes =
    fontFamily === "Times New Roman" ||
    fontFamily === "Georgia";

  const isCourier =
    fontFamily === "Courier New" ||
    fontFamily === "Courier";

  if (isTimes) {
    if (isBold && isItalic) return StandardFonts.TimesRomanBoldItalic;
    if (isBold) return StandardFonts.TimesRomanBold;
    if (isItalic) return StandardFonts.TimesRomanItalic;
    return StandardFonts.TimesRoman;
  }

  if (isCourier) {
    if (isBold && isItalic) return StandardFonts.CourierBoldOblique;
    if (isBold) return StandardFonts.CourierBold;
    if (isItalic) return StandardFonts.CourierOblique;
    return StandardFonts.Courier;
  }

  if (isBold && isItalic) return StandardFonts.HelveticaBoldOblique;
  if (isBold) return StandardFonts.HelveticaBold;
  if (isItalic) return StandardFonts.HelveticaOblique;

  return StandardFonts.Helvetica;
};

function getDefaultFormat(
  item: ExistingText
): TextFormatting {
  return {
    fontSize: item.fontSize || 16,
    fontWeight: "400",
    fontStyle: "normal",
    color: "#000000",
    fontFamily: "Arial",
    textAlign: "left",
  };
}

function ToolButton({
  children,
  active,
  title,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold ${
        active
          ? "bg-black text-white"
          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

export default function PDFViewer({
  file,
}: Props) {
  const [numPages, setNumPages] = useState(0);
  const [pageWidth, setPageWidth] =
    useState(800);

  const [existingTexts, setExistingTexts] =
    useState<ExistingText[]>([]);

  const [editedTexts, setEditedTexts] =
    useState<Record<number, string>>({});

  const [editedFormats, setEditedFormats] =
    useState<Record<number, TextFormatting>>(
      {}
    );

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [editingText, setEditingText] =
    useState("");

  const [editingStyle, setEditingStyle] =
    useState<TextFormatting | null>(null);

  const [textBoxes, setTextBoxes] =
    useState<TextBox[]>([]);

  const [selectedTextId, setSelectedTextId] =
    useState<number | null>(null);

    const [highlightBoxes, setHighlightBoxes] =
  useState<HighlightBox[]>([]);

  const [highlightMode, setHighlightMode] =
  useState(false);

  const [signatureMode, setSignatureMode] = useState(false);

  const [signaturePoints, setSignaturePoints] = useState<
  {
    id: number;
    points: { x: number; y: number }[];
  }[]
>([]);

const [isDrawingSignature, setIsDrawingSignature] =
  useState(false);

  const [selectedHighlightId, setSelectedHighlightId] =
  useState<number | null>(null);

 const [history, setHistory] = useState<
  {
    highlightBoxes: HighlightBox[];
    textBoxes: TextBox[];
    editedTexts: Record<number, string>;
    editedFormats: Record<number, TextFormatting>;
    signaturePoints: {
      id: number;
      points: { x: number; y: number }[];
    }[];
  }[]
>([]);

const [redoHistory, setRedoHistory] = useState<
  {
    highlightBoxes: HighlightBox[];
    textBoxes: TextBox[];
    editedTexts: Record<number, string>;
    editedFormats: Record<number, TextFormatting>;
    signaturePoints: {
  id: number;
  points: { x: number; y: number }[];
}[];
  }[]
>([]);

  const pageRefs = useRef<
    Record<number, HTMLDivElement | null>
  >({});

  const textsRef = useRef<ExistingText[]>([]);

  useEffect(() => {
    textsRef.current = existingTexts;
  }, [existingTexts]);

  /* -----------------------------
     Responsive PDF size
  ----------------------------- */

  useEffect(() => {
    const resize = () => {
      const width = window.innerWidth;

      if (width < 700) {
        setPageWidth(
          Math.max(width - 40, 320)
        );
      } else if (width < 1100) {
        setPageWidth(
          Math.max(width - 280, 500)
        );
      } else {
        setPageWidth(800);
      }
    };

    resize();

    window.addEventListener(
      "resize",
      resize
    );

    return () => {
      window.removeEventListener(
        "resize",
        resize
      );
    };
  }, []);

    /* -----------------------------
     Document loaded
  ----------------------------- */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Delete" &&
        selectedHighlightId !== null
      ) {
        setHighlightBoxes((previous) =>
          previous.filter(
            (highlight) =>
              highlight.id !== selectedHighlightId
          )
        );

        setSelectedHighlightId(null);
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [selectedHighlightId]);


  const handleDocumentLoad = ({
    numPages,
  }: {
    numPages: number;
  }) => {
    setNumPages(numPages);

    /*
     * New PDF: allow every page to be detected again.
     */
    Object.values(pageRefs.current).forEach(
      (page) => {
        if (page) {
          delete page.dataset.textDetected;
        }
      }
    );

    setExistingTexts([]);

    textsRef.current = [];

    setEditedTexts({});

    setEditedFormats({});

    setEditingId(null);

    setEditingText("");

    setEditingStyle(null);

    setTextBoxes([]);

    setSelectedTextId(null);
  };

  /* -----------------------------
     Start edit
  ----------------------------- */

  const startEditing = (
    item: ExistingText
  ) => {
    setHistory((previous) => [
  ...previous,
  {
    highlightBoxes,
    textBoxes,
    editedTexts,
    editedFormats,
    signaturePoints,
  },
].slice(-MAX_HISTORY));

    const format =
      editedFormats[item.id] ||
      getDefaultFormat(item);

    const text =
      editedTexts[item.id] ??
      item.text;

    console.log(
      "EDITING TEXT:",
      text
    );

    setEditingId(item.id);

    setEditingText(text);

    setEditingStyle(format);

    setSelectedTextId(null);
  };

  /* -----------------------------
     Detect text layer
  ----------------------------- */

  const detectText = (
    pageIndex: number
  ) => {
    const page =
      pageRefs.current[pageIndex];

    if (!page) {
      return;
    }

    /*
     * Do not detect the same page repeatedly.
     * The flag is reset when a new PDF is loaded.
     */
    if (
      page.dataset.textDetected ===
      "true"
    ) {
      return;
    }

    const textLayer =
      page.querySelector(
        ".react-pdf__Page__textContent"
      ) as HTMLElement | null;

    if (!textLayer) {
      return;
    }

    textLayer.style.pointerEvents =
      "auto";
    textLayer.style.zIndex = "20";
    textLayer.style.position =
      "absolute";

    const spans = Array.from(
      textLayer.querySelectorAll(
        "span"
      )
    ) as HTMLSpanElement[];

    /*
     * PDF.js may fire the callback before
     * its spans are actually present.
     */
    if (spans.length === 0) {
      return;
    }

    page.dataset.textDetected =
      "true";

    console.log(
      `PAGE ${pageIndex + 1}: ${spans.length} TEXT SPANS`
    );

    const pageItems: ExistingText[] =
      [];

    spans.forEach(
      (span, spanIndex) => {
        const text =
          (span.textContent || "").trim();

        if (!text) {
          return;
        }

        span.style.pointerEvents =
          "auto";
        span.style.cursor = "text";
        span.style.zIndex = "30";
        span.setAttribute(
          "data-pdf-editable",
          "true"
        );

        const rect =
          span.getBoundingClientRect();

        const pageRect =
          page.getBoundingClientRect();

        const computed =
          window.getComputedStyle(
            span
          );

        const fontSize =
          parseFloat(
            computed.fontSize || "16"
          ) || 16;

        const item: ExistingText = {
          id:
            pageIndex * 100000 +
            spanIndex,

          text,

          x:
            rect.left -
            pageRect.left,

          y:
            rect.top -
            pageRect.top,

          width: Math.max(
            rect.width,
            5
          ),

          height: Math.max(
            rect.height,
            fontSize * 1.2
          ),

          fontSize,

          fontFamily:
            computed.fontFamily ||
            "Arial",

          fontWeight:
            computed.fontWeight ||
            "400",

          lineHeight:
            computed.lineHeight ||
            "normal",

          pageIndex,

          spanIndex,
        };

        pageItems.push(item);

        /*
         * Direct DOM mouse handling.
         * mousedown is enough; keeping one handler
         * avoids duplicate editing calls.
         */
        span.onmousedown = (
          event
        ) => {
          event.preventDefault();
          event.stopPropagation();

          console.log(
            "MOUSEDOWN PDF TEXT:",
            text
          );

          startEditing(item);
        };

        if (
          editedTexts[item.id] !==
          undefined
        ) {
          span.style.visibility =
            "hidden";
        } else {
          span.style.visibility =
            "visible";
        }
      }
    );

    setExistingTexts(
      (previous) => {
        const otherPages =
          previous.filter(
            (item) =>
              item.pageIndex !==
              pageIndex
          );

        return [
          ...otherPages,
          ...pageItems,
        ];
      }
    );
  };

  /* -----------------------------
     Text layer ready
  ----------------------------- */

  const handleTextLayerSuccess = (
    pageIndex: number
  ) => {
    let attempts = 0;

    const tryDetect = () => {
      attempts += 1;

      const page =
        pageRefs.current[pageIndex];

      const textLayer =
        page?.querySelector(
          ".react-pdf__Page__textContent"
        ) as HTMLElement | null;

      const spans =
        textLayer?.querySelectorAll(
          "span"
        );

      if (
        spans &&
        spans.length > 0
      ) {
        detectText(pageIndex);
        return;
      }

      /*
       * Give PDF.js up to 10 attempts
       * to finish creating text spans.
       */
      if (attempts < 10) {
        window.setTimeout(
          tryDetect,
          300
        );
      }
    };

    window.setTimeout(
      tryDetect,
      100
    );
  };

  /* -----------------------------
     Finish edit
  ----------------------------- */

  const finishEditing = () => {
    if (
      editingId === null ||
      editingStyle === null
    ) {
      return;
    }

    const id = editingId;

    setEditedTexts(
      (previous) => ({
        ...previous,
        [id]: editingText,
      })
    );

    setEditedFormats(
      (previous) => ({
        ...previous,
        [id]: editingStyle,
      })
    );

    setEditingId(null);

    setEditingText("");

    setEditingStyle(null);

    /*
     * Hide original span.
     */

    setTimeout(() => {
      for (
        let pageIndex = 0;
        pageIndex < numPages;
        pageIndex++
      ) {
        const page =
          pageRefs.current[
            pageIndex
          ];

        if (!page) continue;

        const spans =
          page.querySelectorAll(
            "span"
          );

        spans.forEach(
          (span, spanIndex) => {
            const spanId =
              pageIndex * 100000 +
              spanIndex;

            if (
              spanId === id
            ) {
              (
                span as HTMLElement
              ).style.visibility =
                "hidden";
            }
          }
        );
      }
    }, 50);
  };

  /* -----------------------------
     Cancel edit
  ----------------------------- */

  const cancelEditing = () => {
    setEditingId(null);

    setEditingText("");

    setEditingStyle(null);
  };

  /* -----------------------------
     Formatting
  ----------------------------- */

  const updateFormat = (
    changes: Partial<TextFormatting>
  ) => {
    if (
      editingId === null ||
      editingStyle === null
    ) {
      return;
    }

    const next = {
      ...editingStyle,
      ...changes,
    };

    setEditingStyle(next);

    setEditedFormats(
      (previous) => ({
        ...previous,
        [editingId]: next,
      })
    );
  };

  const increaseSize = () => {
    if (!editingStyle) return;

    updateFormat({
      fontSize: Math.min(
        editingStyle.fontSize + 1,
        72
      ),
    });
  };

  const decreaseSize = () => {
    if (!editingStyle) return;

    updateFormat({
      fontSize: Math.max(
        editingStyle.fontSize - 1,
        8
      ),
    });
  };

  const toggleBold = () => {
    if (!editingStyle) return;

    updateFormat({
      fontWeight:
        editingStyle.fontWeight ===
        "700"
          ? "400"
          : "700",
    });
  };

  const toggleItalic = () => {
    if (!editingStyle) return;

    updateFormat({
      fontStyle:
        editingStyle.fontStyle ===
        "italic"
          ? "normal"
          : "italic",
    });
  };

  const resetFormat = () => {
    if (editingId === null) {
      return;
    }

    const item =
      existingTexts.find(
        (x) =>
          x.id === editingId
      );

    if (!item) return;

    const format =
      getDefaultFormat(item);

    setEditingStyle(format);

    setEditedFormats(
      (previous) => ({
        ...previous,
        [editingId]: format,
      })
    );
  };

  /* -----------------------------
     Keyboard
  ----------------------------- */

  const handleEditKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      event.key === "Enter"
    ) {
      event.preventDefault();

      finishEditing();
    }

    if (
      event.key === "Escape"
    ) {
      event.preventDefault();

      cancelEditing();
    }
  };

  /* -----------------------------
     Add new text
  ----------------------------- */

  const startSignature = (
  event: React.PointerEvent
) => {
  if (!signatureMode) return;

  event.preventDefault();
  event.stopPropagation();

  const page =
    event.currentTarget as HTMLDivElement;

console.log("SIGNATURE START");

  const rect =
    page.getBoundingClientRect();

    setHistory((previous) => [
  ...previous,
  {
    highlightBoxes,
    textBoxes,
    editedTexts,
    editedFormats,
    signaturePoints,
  },
].slice(-MAX_HISTORY));

  setIsDrawingSignature(true);

  const startPoint = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };

  setSignaturePoints((previous) => [
  ...previous,
  {
    id: Date.now(),
    points: [startPoint],
  },
]);
  
  const handlePointerMove = (
  moveEvent: PointerEvent
) => {
  const newPoint = {
    x: moveEvent.clientX - rect.left,
    y: moveEvent.clientY - rect.top,
  };

  setSignaturePoints((previous) => {
  if (previous.length === 0) {
    return previous;
  }

  const lastSignature =
    previous[previous.length - 1];

  return [
  ...previous.slice(0, -1),
  {
    ...lastSignature,
    points: [
      ...lastSignature.points,
      newPoint,
    ],
  },
];
});
};

  const handlePointerUp = () => {
    setIsDrawingSignature(false);

    document.removeEventListener(
      "pointermove",
      handlePointerMove
    );

    document.removeEventListener(
      "pointerup",
      handlePointerUp
    );
  };

  document.addEventListener(
    "pointermove",
    handlePointerMove
  );

  document.addEventListener(
    "pointerup",
    handlePointerUp
  );
};

  const startHighlight = (
  event: React.PointerEvent,
  pageIndex: number
) => {
  if (!highlightMode) return;

  event.preventDefault();
  event.stopPropagation();

  const page = pageRefs.current[pageIndex];

  if (!page) return;

  const pageRect = page.getBoundingClientRect();

  const startX = event.clientX - pageRect.left;
  const startY = event.clientY - pageRect.top;
setHistory((previous) => [
  ...previous,
  {
    highlightBoxes,
    textBoxes,
    editedTexts,
    editedFormats,
    signaturePoints,
  },
].slice(-MAX_HISTORY));
  const highlightId = Date.now();

  const handlePointerMove = (
    moveEvent: PointerEvent
  ) => {
    const currentX =
      moveEvent.clientX - pageRect.left;

    const currentY =
      moveEvent.clientY - pageRect.top;

    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);

    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    setHighlightBoxes((previous) => {
      const existing = previous.find(
        (item) => item.id === highlightId
      );

      if (existing) {
        return previous.map((item) =>
          item.id === highlightId
            ? {
                ...item,
                x,
                y,
                width,
                height,
              }
            : item
        );
      }

      return [
        ...previous,
        {
          id: highlightId,
          pageIndex,
          x,
          y,
          width,
          height,
          color: "#ffeb3b",
          opacity: 0.35,
        },
      ];
    });
  };

  const handlePointerUp = () => {
    document.removeEventListener(
      "pointermove",
      handlePointerMove
    );

    document.removeEventListener(
      "pointerup",
      handlePointerUp
    );
  };

  document.addEventListener(
    "pointermove",
    handlePointerMove
  );

  document.addEventListener(
    "pointerup",
    handlePointerUp
  );
};

const MAX_HISTORY = 25;
  
const undo = () => {
  if (history.length === 0) return;

  const previousState =
    history[history.length - 1];

    setRedoHistory((previous) => [
  ...previous,
  {
    highlightBoxes,
    textBoxes,
    editedTexts,
    editedFormats,
    signaturePoints,
  },
].slice(-MAX_HISTORY));

  setHighlightBoxes(
    previousState.highlightBoxes
  );

  setTextBoxes(
    previousState.textBoxes
  );

  setEditedTexts(
  previousState.editedTexts
);

setEditedFormats(
  previousState.editedFormats
);

setSignaturePoints(
  previousState.signaturePoints
);

  setHistory((previous) =>
    previous.slice(0, -1)
  );

  setSelectedHighlightId(null);
  setSelectedTextId(null);
};
const redo = () => {
  if (redoHistory.length === 0) return;

  const nextState =
    redoHistory[redoHistory.length - 1];

  setHistory((previous) => [
  ...previous,
  {
    highlightBoxes,
    textBoxes,
    editedTexts,
    editedFormats,
    signaturePoints,
  },
]);

  setHighlightBoxes(
    nextState.highlightBoxes
  );

  setTextBoxes(
    nextState.textBoxes
  );

  setEditedTexts(
    nextState.editedTexts
  );

  setEditedFormats(
    nextState.editedFormats
  );

  setSignaturePoints(
  nextState.signaturePoints
);

  setRedoHistory((previous) =>
    previous.slice(0, -1)
  );

  setSelectedHighlightId(null);
  setSelectedTextId(null);
};
  const addText = () => {
    setHistory((previous) => [
  ...previous,
  {
    highlightBoxes,
    textBoxes,
    editedTexts,
    editedFormats,
    signaturePoints,
  },
].slice(-MAX_HISTORY));
  const newText: TextBox = {
    id: Date.now(),
    x: 100,
    y: 100,
    width: 240,
    height: 60,
    text: "Type your text",
    fontSize: 24,
    fontFamily: "Arial",
    fontWeight: "400",
    fontStyle: "normal",
    color: "#000000",
    backgroundColor: "#ffffff",
    textAlign: "left",
  };

  setTextBoxes((previous) => [
    ...previous,
    newText,
  ]);

  setSelectedTextId(newText.id);
};

  const updateTextBox = (
    id: number,
    changes: Partial<TextBox>
  ) => {
    setTextBoxes(
      (previous) =>
        previous.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  ...changes,
                }
              : item
        )
    );
  };
const startTextBoxPointerDrag = (
  event: React.PointerEvent,
  box: TextBox,
  pageIndex: number
) => {
  event.preventDefault();
  event.stopPropagation();

  setSelectedTextId(box.id);

  const page =
    pageRefs.current[pageIndex];

  if (!page) return;

  const startX = event.clientX;
  const startY = event.clientY;

  const startBoxX = box.x;
  const startBoxY = box.y;

  const pageRect =
    page.getBoundingClientRect();

  const handlePointerMove = (
    moveEvent: PointerEvent
  ) => {
    const dx =
      moveEvent.clientX - startX;

    const dy =
      moveEvent.clientY - startY;

    const maxX =
      pageRect.width - box.width;

    const maxY =
      pageRect.height - box.height;

    const newX = Math.max(
      0,
      Math.min(
        startBoxX + dx,
        maxX
      )
    );

    const newY = Math.max(
      0,
      Math.min(
        startBoxY + dy,
        maxY
      )
    );

    updateTextBox(box.id, {
      x: newX,
      y: newY,
    });
  };

  const handlePointerUp = () => {
    document.removeEventListener(
      "pointermove",
      handlePointerMove
    );

    document.removeEventListener(
      "pointerup",
      handlePointerUp
    );
  };

  document.addEventListener(
    "pointermove",
    handlePointerMove
  );

  document.addEventListener(
    "pointerup",
    handlePointerUp
  );
};
const savePdf = async () => {
  
  try {
    
    
const pdfBytes = await file.arrayBuffer();

const pdfDoc = await PDFDocument.load(pdfBytes);

const pages = pdfDoc.getPages();

    for (const item of existingTexts) {
      const editedText = editedTexts[item.id];

      if (editedText === undefined) continue;

      const page = pages[item.pageIndex];
      const pageElement = pageRefs.current[item.pageIndex];

      if (!page || !pageElement) continue;

      const pageRect = pageElement.getBoundingClientRect();

      const scaleX = page.getWidth() / pageRect.width;
      const scaleY = page.getHeight() / pageRect.height;

      const format =
        editedFormats[item.id] ??
        getDefaultFormat(item);

      const fontName = getPdfFont(
  format.fontFamily,
  format.fontWeight,
  format.fontStyle
);

      const font = await pdfDoc.embedFont(fontName);

      const colorValue = format.color.replace("#", "");

      const color = rgb(
        parseInt(colorValue.slice(0, 2), 16) / 255,
        parseInt(colorValue.slice(2, 4), 16) / 255,
        parseInt(colorValue.slice(4, 6), 16) / 255
      );

      const x = item.x * scaleX;

      const y =
        page.getHeight() -
        (item.y + item.height) * scaleY;

      const width = item.width * scaleX;
      const height = item.height * scaleY;

      page.drawRectangle({
        x,
        y,
        width,
        height,
        color: rgb(1, 1, 1),
      });

      page.drawText(editedText, {
        x,
        y,
        size: format.fontSize * scaleX,
        font,
        color,
        maxWidth: width,
      });
    }
    for (const highlight of highlightBoxes) {
  const page = pages[highlight.pageIndex];
  const pageElement =
    pageRefs.current[highlight.pageIndex];

  if (!page || !pageElement) continue;

  const pageRect =
    pageElement.getBoundingClientRect();

  const scaleX =
    page.getWidth() / pageRect.width;

  const scaleY =
    page.getHeight() / pageRect.height;

  const x =
    highlight.x * scaleX;

  const y =
    page.getHeight() -
    (highlight.y + highlight.height) * scaleY;

  const width =
    highlight.width * scaleX;

  const height =
    highlight.height * scaleY;

  const colorValue =
    highlight.color.replace("#", "");

  const color = rgb(
    parseInt(colorValue.slice(0, 2), 16) / 255,
    parseInt(colorValue.slice(2, 4), 16) / 255,
    parseInt(colorValue.slice(4, 6), 16) / 255
  );

  page.drawRectangle({
    x,
    y,
    width,
    height,
    color,
    opacity: highlight.opacity,
  });
}
for (const box of textBoxes) {
  const page = pages[0];
  const pageElement = pageRefs.current[0];

  if (!page || !pageElement) continue;

  const pageRect = pageElement.getBoundingClientRect();

  const scaleX = page.getWidth() / pageRect.width;
  const scaleY = page.getHeight() / pageRect.height;

  const fontName = getPdfFont(
    box.fontFamily,
    box.fontWeight,
    box.fontStyle
  );

  const font = await pdfDoc.embedFont(fontName);

  const colorValue = box.color.replace("#", "");

  const color = rgb(
    parseInt(colorValue.slice(0, 2), 16) / 255,
    parseInt(colorValue.slice(2, 4), 16) / 255,
    parseInt(colorValue.slice(4, 6), 16) / 255
  );

  const x = box.x * scaleX + 8;

  const y =
  page.getHeight() -
  box.y * scaleY -
  box.fontSize * scaleY * 1.30;

  const width = box.width * scaleX;
  const height = box.height * scaleY;

  if (box.backgroundColor !== "transparent") {
    const bgValue =
      box.backgroundColor.replace("#", "");

    const backgroundColor = rgb(
      parseInt(bgValue.slice(0, 2), 16) / 255,
      parseInt(bgValue.slice(2, 4), 16) / 255,
      parseInt(bgValue.slice(4, 6), 16) / 255
    );

    page.drawRectangle({
      x,
      y,
      width,
      height,
      color: backgroundColor,
    });
  }

  page.drawText(box.text, {
    x,
    y,
    size: box.fontSize * scaleX,
    font,
    color,
    maxWidth: width,
  });
}

// Save signatures into PDF
for (const signature of signaturePoints) {
  if (signature.points.length < 2) continue;

  const page = pages[0];
  const pageElement = pageRefs.current[0];

  if (!page || !pageElement) continue;

  const pageRect =
    pageElement.getBoundingClientRect();

  const scaleX =
    page.getWidth() / pageRect.width;

  const scaleY =
    page.getHeight() / pageRect.height;

  for (
    let i = 1;
    i < signature.points.length;
    i++
  ) {
    const previousPoint =
      signature.points[i - 1];

    const currentPoint =
      signature.points[i];

    const x1 =
      previousPoint.x * scaleX;

    const y1 =
      page.getHeight() -
      previousPoint.y * scaleY;

    const x2 =
      currentPoint.x * scaleX;

    const y2 =
      page.getHeight() -
      currentPoint.y * scaleY;

    page.drawLine({
      start: {
        x: x1,
        y: y1,
      },
      end: {
        x: x2,
        y: y2,
      },
      thickness: 2,
      color: rgb(0, 0, 0),
    });
  }
}
const outputBytes = await pdfDoc.save();

    const blob = new Blob(
      [new Uint8Array(outputBytes)],
      { type: "application/pdf" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "edited.pdf";
    link.click();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Save PDF error:", error);
    alert("PDF save nahi ho paya.");
  }
};
  const deleteTextBox = (
    id: number
  ) => {
    setTextBoxes(
      (previous) =>
        previous.filter(
          (item) =>
            item.id !== id
        )
    );

    setSelectedTextId(null);
  };

  /* -----------------------------
     Re-detect on resize
  ----------------------------- */

  useEffect(() => {
    if (!numPages) return;

    const timer =
      setTimeout(() => {
        for (
          let i = 0;
          i < numPages;
          i++
        ) {
          const page =
            pageRefs.current[i];

          if (page) {
            delete page.dataset.textDetected;
          }

          detectText(i);
        }
      }, 400);

    return () =>
  clearTimeout(timer);
}, [
  numPages,
  pageWidth,
]);

return (
  <div className="w-full">
    {/* Important CSS for clickable PDF text */}
    <style jsx global>{`

        .react-pdf__Page__textContent {
          pointer-events: auto !important;
          z-index: 20 !important;
        }

        .react-pdf__Page__textContent span {
          pointer-events: auto !important;
          cursor: text !important;
        }

        .react-pdf__Page__annotations,
        .react-pdf__Page__annotationLayer,
        .annotationLayer {
          z-index: 10 !important;
          pointer-events: none !important;
        }

        .pdf-existing-editor {
  z-index: 100 !important;
}

.react-pdf__Page__textContent {
  pointer-events: auto !important;
  z-index: 100 !important;
  position: absolute !important;
  inset: 0 !important;
}

.react-pdf__Page__textContent span {
  pointer-events: auto !important;
  cursor: text !important;
  position: absolute !important;
  z-index: 101 !important;
}

.react-pdf__Page canvas {
  position: relative !important;
  z-index: 1 !important;
}

.react-pdf__Page__annotations,
.react-pdf__Page__annotationLayer,
.annotationLayer {
  pointer-events: none !important;
  z-index: 10 !important;
}
      `}</style>
{/* ADD TEXT TOOLBAR */}

{numPages > 0 && (
  <div className="mb-4 flex items-center justify-center gap-3">
<button
  type="button"
  onClick={undo}
  disabled={history.length === 0}
  className="rounded-xl bg-gray-700 px-6 py-3 text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
>
  ↶ Undo
</button>

<button
  type="button"
  onClick={redo}
  disabled={redoHistory.length === 0}
  className="rounded-xl bg-gray-700 px-6 py-3 text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
>
  ↷ Redo
</button>

<button
  type="button"
  onClick={() =>
    setHighlightMode((previous) => !previous)
  }
  className={`rounded-xl px-6 py-3 text-sm font-bold shadow-lg ${
    highlightMode
      ? "bg-yellow-400 text-black"
      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
  }`}
>
  🖍 Highlight
</button>

<button
  type="button"
  onClick={() => {
    if (selectedTextId === null) return;

    setTextBoxes((previous) =>
      previous.filter(
        (box) => box.id !== selectedTextId
      )
    );

    setSelectedTextId(null);
  }}
  disabled={selectedTextId === null}
  className="rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
>
  🗑 Delete Text
</button>
<button
  type="button"
  onClick={() => {
    if (selectedHighlightId === null) return;

    setHighlightBoxes((previous) =>
      previous.filter(
        (highlight) =>
          highlight.id !== selectedHighlightId
      )
    );

    setSelectedHighlightId(null);
  }}
  disabled={selectedHighlightId === null}
    className="rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
>
  🗑 Delete Highlight
</button>

<button
  type="button"
  onClick={() =>
    setSignatureMode((previous) => !previous)
  }
  className={`rounded-xl px-6 py-3 text-sm font-bold shadow-lg ${
    signatureMode
      ? "bg-blue-600 text-white"
      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
  }`}
>
  ✍️ Signature
</button>

<button
  type="button"
  onClick={addText}
>
  ＋ Add Text
</button>


      <button
  type="button"
  onClick={savePdf}
  className="rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-green-700"
>
  ↓ Save PDF
</button>

  </div>
)}
<Document
      
        file={file}
        onLoadSuccess={
          handleDocumentLoad
        }
        loading={
          <div className="rounded-xl bg-white p-8 text-center shadow">
            PDF Loading...
          </div>
        }
        error={
          <div className="rounded-xl bg-red-50 p-8 text-center text-red-700">
            PDF load nahi ho paaya.
          </div>
        }
      >
        <div className="space-y-8">
          {Array.from(
            {
              length: numPages,
            },
            (_, pageIndex) => {
              const pageItems =
                existingTexts.filter(
                  (item) =>
                    item.pageIndex ===
                    pageIndex
                );

              return (
                <div
  key={pageIndex}
  ref={(element) => {
    pageRefs.current[pageIndex] = element;
  }}
  onPointerDown={(event) => {
  if (highlightMode) {
    startHighlight(event, pageIndex);
  }

  if (signatureMode) {
    startSignature(event);
  }
}}
  
  className="relative mx-auto w-fit overflow-visible rounded-lg bg-white shadow-xl touch-none"
  onMouseDown={(event) => {
    if (selectedHighlightId !== null) {
  return;
}
    const page = event.currentTarget;

    const pageRect =
      page.getBoundingClientRect();

    const clickX =
      event.clientX - pageRect.left;

    const clickY =
      event.clientY - pageRect.top;

    const padding = 1;

const clickedItem = pageItems.find((item) => {
  return (
    clickX >= item.x + padding &&
    clickX <= item.x + item.width - padding &&
    clickY >= item.y + padding &&
    clickY <= item.y + item.height - padding
  );
});

   if (!clickedItem) {
  setSelectedTextId(null);
  setEditingId(null);
  return;
}

    event.preventDefault();
    event.stopPropagation();

    console.log(
      "CLICKED PDF TEXT:",
      clickedItem.text
    );

        startEditing(clickedItem);
  }}
>
  <Page
                    pageNumber={
                      pageIndex + 1
                    }
                    width={
                      pageWidth
                    }
                    renderTextLayer
                    renderAnnotationLayer={false}
                    onRenderTextLayerSuccess={() =>
                      handleTextLayerSuccess(
                        pageIndex
                      )
                    }
                  />
                  {/* =========================
    HIGHLIGHTS
========================= */}

{highlightBoxes
  .filter(
    (highlight) =>
      highlight.pageIndex === pageIndex
  )
  .map((highlight) => (
    <div
  key={highlight.id}
  onPointerDown={(event) => {
  event.preventDefault();
  event.stopPropagation();

  setSelectedHighlightId(highlight.id);
}}
  className={`absolute z-[120] ${
    selectedHighlightId === highlight.id
      ? "ring-2 ring-blue-500"
      : ""
  }`}
  style={{
    left: highlight.x,
    top: highlight.y,
    width: highlight.width,
    height: highlight.height,
    backgroundColor: highlight.color,
    opacity: highlight.opacity,
    cursor: "pointer",
  }}
/>
  ))}

                  {/* =========================
                      EDITED EXISTING TEXT
                  ========================= */}

                  {pageItems.map(
                    (item) => {
                      const edited =
                        editedTexts[
                          item.id
                        ];

                      if (
                        edited ===
                        undefined
                      ) {
                        return null;
                      }

                      if (
                        editingId ===
                        item.id
                      ) {
                        return null;
                      }

                      const format =
                        editedFormats[
                          item.id
                        ] ||
                        getDefaultFormat(
                          item
                        );

                      return (
                        <div
                          key={
                            item.id
                          }
                          className="absolute cursor-text bg-white"
                          style={{
                            left:
                              item.x,

                            top:
                              item.y,

                            minWidth:
                              Math.max(
                                item.width,
                                40
                              ),

                            minHeight:
                              Math.max(
                                item.height,
                                20
                              ),

                            padding:
                              "0 2px",

                            zIndex: 80,

                            fontSize:
                              format.fontSize,

                            fontFamily:
                              format.fontFamily,

                            fontWeight:
                              format.fontWeight,

                            fontStyle:
                              format.fontStyle,

                            color:
                              format.color,

                            textAlign:
                              format.textAlign,

                            lineHeight:
                              item.lineHeight,

                            whiteSpace:
                              "pre-wrap",
                          }}
                          onMouseDown={(
                            event
                          ) => {
                            event.preventDefault();

                            event.stopPropagation();

                            startEditing(
                              item
                            );
                          }}
                        >
                          {edited}
                        </div>
                      );
                    }
                  )}

                  {/* =========================
                      ACTIVE TEXT EDITOR
                  ========================= */}

                  {editingId !==
                    null &&
                    editingStyle &&
                    pageItems
                      .filter(
                        (item) =>
                          item.id ===
                          editingId
                      )
                      .map(
                        (item) => (
                          <div
                            key={
                              `edit-${item.id}`
                            }
                            className="pdf-existing-editor absolute"
                            style={{
                              left:
                                item.x,

                              top:
                                Math.max(
                                  item.y -
                                    48,
                                  5
                                ),

                              zIndex: 200,
                            }}
                            onMouseDown={(
                              event
                            ) => {
                              event.preventDefault();

                              event.stopPropagation();
                            }}
                          >
                            {/* Toolbar */}

                            <div className="mb-1 flex flex-wrap items-center gap-1 rounded-xl border border-gray-200 bg-white p-2 shadow-2xl">
                              <ToolButton
                                title="Font size kam"
                                onClick={
                                  decreaseSize
                                }
                              >
                                A−
                              </ToolButton>

                              <div className="flex h-8 min-w-12 items-center justify-center rounded-md bg-gray-50 px-2 text-xs font-bold">
                                {
                                  editingStyle.fontSize
                                }
                                px
                              </div>

                              <ToolButton
                                title="Font size badhao"
                                onClick={
                                  increaseSize
                                }
                              >
                                A+
                              </ToolButton>

                              <div className="mx-1 h-6 w-px bg-gray-200" />

                              <ToolButton
                                title="Bold / Unbold"
                                active={
                                  editingStyle.fontWeight ===
                                  "700"
                                }
                                onClick={
                                  toggleBold
                                }
                              >
                                <b>B</b>
                              </ToolButton>

                              <ToolButton
                                title="Italic"
                                active={
                                  editingStyle.fontStyle ===
                                  "italic"
                                }
                                onClick={
                                  toggleItalic
                                }
                              >
                                <i>I</i>
                              </ToolButton>

                              <div className="mx-1 h-6 w-px bg-gray-200" />

                              <select
                                value={
                                  editingStyle.fontFamily
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateFormat(
                                    {
                                      fontFamily:
                                        event
                                          .target
                                          .value,
                                    }
                                  )
                                }
                                className="h-8 max-w-36 rounded-md border border-gray-200 px-2 text-xs"
                              >
                                {FONTS.map(
                                  (
                                    font
                                  ) => (
                                    <option
                                      key={
                                        font
                                      }
                                      value={
                                        font
                                      }
                                    >
                                      {
                                        font
                                      }
                                    </option>
                                  )
                                )}
                              </select>

                              <div className="mx-1 h-6 w-px bg-gray-200" />

                              {COLORS.map(
                                (
                                  color
                                ) => (
                                  <button
                                    key={
                                      color
                                    }
                                    type="button"
                                    title="Text color"
                                    onClick={() =>
                                      updateFormat(
                                        {
                                          color,
                                        }
                                      )
                                    }
                                    className={`h-5 w-5 rounded-full border-2 ${
                                      editingStyle.color ===
                                      color
                                        ? "border-blue-500"
                                        : "border-gray-200"
                                    }`}
                                    style={{
                                      backgroundColor:
                                        color,
                                    }}
                                  />
                                )
                              )}

                              <div className="mx-1 h-6 w-px bg-gray-200" />

                              <ToolButton
                                title="Left"
                                active={
                                  editingStyle.textAlign ===
                                  "left"
                                }
                                onClick={() =>
                                  updateFormat(
                                    {
                                      textAlign:
                                        "left",
                                    }
                                  )
                                }
                              >
                                ←
                              </ToolButton>

                              <ToolButton
                                title="Center"
                                active={
                                  editingStyle.textAlign ===
                                  "center"
                                }
                                onClick={() =>
                                  updateFormat(
                                    {
                                      textAlign:
                                        "center",
                                    }
                                  )
                                }
                              >
                                ↔
                              </ToolButton>

                              <ToolButton
                                title="Right"
                                active={
                                  editingStyle.textAlign ===
                                  "right"
                                }
                                onClick={() =>
                                  updateFormat(
                                    {
                                      textAlign:
                                        "right",
                                    }
                                  )
                                }
                              >
                                →
                              </ToolButton>

                              <ToolButton
                                title="Reset"
                                onClick={
                                  resetFormat
                                }
                              >
                                ↺
                              </ToolButton>

                              <button
                                type="button"
                                onClick={
                                  finishEditing
                                }
                                className="ml-1 h-8 rounded-md bg-black px-3 text-xs font-bold text-white"
                              >
                                ✓ Done
                              </button>
                            </div>

                            {/* Input */}

                            <input
                              autoFocus
                              value={
                                editingText
                              }
                              onChange={(
                                event
                              ) =>
                                setEditingText(
                                  event
                                    .target
                                    .value
                                )
                              }
                              onKeyDown={
                                handleEditKeyDown
                              }
                              className="rounded-md border-2 border-blue-500 bg-white px-2 shadow-xl outline-none"
                              style={{
                                width:
                                  Math.max(
                                    item.width +
                                      100,
                                    220
                                  ),

                                minHeight:
                                  Math.max(
                                    item.height +
                                      8,
                                    38
                                  ),

                                fontSize:
                                  editingStyle.fontSize,

                                fontFamily:
                                  editingStyle.fontFamily,

                                fontWeight:
                                  editingStyle.fontWeight,

                                fontStyle:
                                  editingStyle.fontStyle,

                                color:
                                  editingStyle.color,

                                textAlign:
                                  editingStyle.textAlign,

                                lineHeight:
                                  item.lineHeight,
                              }}
                            />
                          </div>
                        )
                      )}
  {signaturePoints.length > 0 && (
  <svg
    className="pointer-events-none absolute inset-0 z-[200]"
    width="100%"
    height="100%"
  >
    {signaturePoints.map((signature) => (
      <polyline
        key={signature.id}
        points={signature.points
          .map(
            (point) =>
              `${point.x},${point.y}`
          )
          .join(" ")}
        fill="none"
        stroke="black"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ))}
  </svg>
)}
                  {/* =========================
    ADD TEXT BOXES
========================= */}

{ textBoxes
  .filter(() => pageIndex === 0)
  .map((box) => {
    const selected =
      selectedTextId === box.id;

    const updateBox = (
      changes: Partial<TextBox>
    ) => {
      updateTextBox(
        box.id,
        changes
      );
    };

    return (
      <Rnd
  key={box.id}
  enableUserSelectHack={false}
  disableDragging={true}
  bounds="parent"
  position={{
    x: box.x,
    y: box.y,
  }}
  size={{
    width: box.width,
    height: box.height,
  }}
  minWidth={80}
  minHeight={35}
  enableResizing={selected}
  resizeHandleStyles={{
    topLeft: {
      width: "12px",
      height: "12px",
      left: "-6px",
      top: "-6px",
      cursor: "nwse-resize",
    },
    topRight: {
      width: "12px",
      height: "12px",
      right: "-6px",
      top: "-6px",
      cursor: "nesw-resize",
    },
    bottomLeft: {
      width: "12px",
      height: "12px",
      left: "-6px",
      bottom: "-6px",
      cursor: "nesw-resize",
    },
    bottomRight: {
      width: "12px",
      height: "12px",
      right: "-6px",
      bottom: "-6px",
      cursor: "nwse-resize",
    },
  }}
  className={
    selected
      ? "border-2 border-blue-500"
      : "border border-dashed border-blue-400"
  }
  style={{
    zIndex: selected ? 150 : 50,
    backgroundColor: box.backgroundColor,
  }}
  onMouseDown={(event) => {
    event.stopPropagation();
    setSelectedTextId(box.id);
  }}
        onDragStop={(
          _event,
          data
        ) => {
          updateBox({
            x: data.x,
            y: data.y,
          });
        }}
        onResizeStop={(
          _event,
          _direction,
          ref,
          _delta,
          position
        ) => {
          updateBox({
            width: ref.offsetWidth,
            height: ref.offsetHeight,
            x: position.x,
            y: position.y,
          });
        }}
      >
        {/* MOVE HANDLE */}

<div
  className="pdf-text-drag-handle absolute left-0 top-0 z-[250] h-5 w-full cursor-move"
  onPointerDown={(event) =>
  startTextBoxPointerDrag(
    event,
    box,
    pageIndex
  )
}
>
  <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-blue-400" />
</div>
        {/* TOP TOOLBAR */}

        {selected && (
          <div
            className="absolute left-0 -top-12 z-[300] flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1.5 shadow-2xl"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            {/* Font Size - */}

            <button
              type="button"
              title="Font size kam"
              onClick={() =>
                updateBox({
                  fontSize: Math.max(
                    8,
                    box.fontSize - 1
                  ),
                })
              }
              className="flex h-8 min-w-8 items-center justify-center rounded-md bg-gray-100 px-2 text-xs font-bold hover:bg-gray-200"
            >
              A−
            </button>

            {/* Font Size */}

            <div className="flex h-8 min-w-12 items-center justify-center rounded-md bg-gray-50 px-2 text-xs font-bold">
              {box.fontSize}px
            </div>

            {/* Font Size + */}

            <button
              type="button"
              title="Font size badhao"
              onClick={() =>
                updateBox({
                  fontSize: Math.min(
                    120,
                    box.fontSize + 1
                  ),
                })
              }
              className="flex h-8 min-w-8 items-center justify-center rounded-md bg-gray-100 px-2 text-xs font-bold hover:bg-gray-200"
            >
              A+
            </button>

            <div className="mx-1 h-6 w-px bg-gray-200" />

            {/* Font */}

            <select
              value={box.fontFamily}
              onChange={(event) =>
  updateBox({
    text: event.target.value,
  })
}
              className="h-8 max-w-32 rounded-md border border-gray-200 px-2 text-xs"
              title="Font"
            >
              {FONTS.map(
                (font) => (
                  <option
                    key={font}
                    value={font}
                  >
                    {font}
                  </option>
                )
              )}
            </select>

            <div className="mx-1 h-6 w-px bg-gray-200" />

            {/* Bold */}

            <button
              type="button"
              title="Bold / Unbold"
              onClick={() =>
                updateBox({
                  fontWeight:
                    box.fontWeight ===
                    "700"
                      ? "400"
                      : "700",
                })
              }
              className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs ${
                box.fontWeight ===
                "700"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <b>B</b>
            </button>

            {/* Italic */}

            <button
              type="button"
              title="Italic"
              onClick={() =>
                updateBox({
                  fontStyle:
                    box.fontStyle ===
                    "italic"
                      ? "normal"
                      : "italic",
                })
              }
              className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs ${
                box.fontStyle ===
                "italic"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <i>I</i>
            </button>

            <div className="mx-1 h-6 w-px bg-gray-200" />

            {/* TEXT COLORS */}

            {COLORS.map(
              (color) => (
                <button
                  key={color}
                  type="button"
                  title="Text color"
                  onClick={() =>
                    updateBox({
                      color,
                    })
                  }
                  className={`h-5 w-5 rounded-full border-2 ${
                    box.color === color
                      ? "border-blue-500"
                      : "border-gray-300"
                  }`}
                  style={{
                    backgroundColor:
                      color,
                  }}
                />
              )
            )}

            <div className="mx-1 h-6 w-px bg-gray-200" />

            {/* BACKGROUND */}

            <label
              title="Background color"
              className="flex h-8 cursor-pointer items-center gap-1 rounded-md bg-gray-100 px-2 text-xs font-bold"
            >
              BG
              <input
                type="color"
                value={
                  box.backgroundColor
                }
                onChange={(event) =>
                  updateBox({
                    backgroundColor:
                      event.target.value,
                  })
                }
                className="h-5 w-5 cursor-pointer border-0 p-0"
              />
            </label>

            {/* TRANSPARENT BG */}

            <button
              type="button"
              title="Transparent background"
              onClick={() =>
                updateBox({
                  backgroundColor:
                    "transparent",
                })
              }
              className={`flex h-8 items-center justify-center rounded-md px-2 text-xs ${
                box.backgroundColor ===
                "transparent"
                  ? "bg-black text-white"
                  : "bg-gray-100"
              }`}
            >
              No BG
            </button>

            <div className="mx-1 h-6 w-px bg-gray-200" />

            {/* ALIGN LEFT */}

            <button
              type="button"
              title="Left"
              onClick={() =>
                updateBox({
                  textAlign: "left",
                })
              }
              className={`flex h-8 min-w-8 items-center justify-center rounded-md ${
                box.textAlign ===
                "left"
                  ? "bg-black text-white"
                  : "bg-gray-100"
              }`}
            >
              ←
            </button>

            {/* ALIGN CENTER */}

            <button
              type="button"
              title="Center"
              onClick={() =>
                updateBox({
                  textAlign: "center",
                })
              }
              className={`flex h-8 min-w-8 items-center justify-center rounded-md ${
                box.textAlign ===
                "center"
                  ? "bg-black text-white"
                  : "bg-gray-100"
              }`}
            >
              ↔
            </button>

            {/* ALIGN RIGHT */}

            <button
              type="button"
              title="Right"
              onClick={() =>
                updateBox({
                  textAlign: "right",
                })
              }
              className={`flex h-8 min-w-8 items-center justify-center rounded-md ${
                box.textAlign ===
                "right"
                  ? "bg-black text-white"
                  : "bg-gray-100"
              }`}
            >
              →
            </button>

            {/* DELETE */}

            <button
              type="button"
              title="Delete text"
              onClick={() =>
                deleteTextBox(
                  box.id
                )
              }
              className="flex h-8 min-w-8 items-center justify-center rounded-md bg-red-100 px-2 text-xs font-bold text-red-600 hover:bg-red-200"
            >
              🗑
            </button>
          </div>
        )}

        {/* CROSS BUTTON */}

        {selected && (
          <button
            type="button"
            title="Delete"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();
              deleteTextBox(
                box.id
              );
            }}
            className="absolute -right-3 -top-3 z-[400] flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white shadow-lg hover:bg-red-700"
          >
            ×
          </button>
        )}

        {/* TEXT */}

        <textarea
  value={box.text}
  onChange={(event) =>
    updateBox({
      text: event.target.value,
    })
  }

            className="h-full w-full resize-none border-0 p-2 outline-none"
          style={{
            backgroundColor:
              box.backgroundColor,

            color: box.color,

            fontSize:
              box.fontSize,

            fontFamily:
              box.fontFamily,

            fontWeight:
              box.fontWeight,

            fontStyle:
              box.fontStyle,

            textAlign:
              box.textAlign,

            lineHeight: 1.2,
          }}
        />
      </Rnd>
    );
        })}
                </div>
              );
            }
          )}
        </div>
      </Document>
    </div>
  );
}