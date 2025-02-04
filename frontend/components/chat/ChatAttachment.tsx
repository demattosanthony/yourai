import { Attachment } from "@ai-sdk/ui-utils";
import Link from "next/link";
import { File } from "lucide-react";
import { useRef, useEffect, useState } from "react";

import * as pdfjsLib from "pdfjs-dist";
import { Skeleton } from "../ui/skeleton";

const PdfThumbnail = ({
  url,
  width = 200,
}: {
  url: string;
  width?: number;
}) => {
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      // Initialize worker first
      const pdfjs = await import("pdfjs-dist");

      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      try {
        // Load the PDF
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        // Get first page
        const page = await pdf.getPage(1);

        // Set scale for thumbnail with higher DPI for sharper rendering
        const viewport = page.getViewport({ scale: 1 });
        const scale = (width / viewport.width) * window.devicePixelRatio;
        const scaledViewport = page.getViewport({ scale });

        // Set canvas dimensions accounting for device pixel ratio
        const canvas = canvasRef.current;
        if (!canvas) {
          return;
        }
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        // Set display size to desired width while maintaining aspect ratio
        canvas.style.width = `${width}px`;
        canvas.style.height = `${
          (width * scaledViewport.height) / scaledViewport.width
        }px`;

        // Render PDF page to canvas with high quality settings
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) {
          throw new Error("Could not get canvas context");
        }
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        }).promise;

        if (isMounted) setLoading(false);
      } catch (error) {
        console.error("Error generating thumbnail:", error);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [url, width]);

  return (
    <div
      className="thumbnail-container cursor-pointer transition-all rounded overflow-hidden"
      onClick={() => window.open(url, "_blank")}
    >
      {loading && <Skeleton className="h-80 w-56" />}
      <canvas ref={canvasRef} style={{ display: loading ? "none" : "block" }} />
    </div>
  );
};

export default function ChatAttachment({
  attachment,
}: {
  attachment: Attachment;
}) {
  const contentType = attachment.contentType || "";
  const index = Math.random();

  switch (true) {
    case contentType.startsWith("image"):
      return (
        <div
          key={`img-${attachment.name}-${index}`}
          className="flex justify-end mb-4 cursor-pointer"
          onClick={() => window.open(attachment.url || "", "_blank")}
        >
          <img
            key={index}
            src={attachment.url}
            alt="user attachment"
            className="overflow-hidden rounded-lg h-52 max-w-[400px] object-contain"
          />
        </div>
      );

    case contentType === "application/pdf":
      return (
        <div
          key={`pdf-${attachment.name}-${index}`}
          className="flex justify-end mb-4"
        >
          <PdfThumbnail url={attachment.url || ""} />
        </div>
      );
    default:
      return (
        <div
          key={`file-${attachment.name}-${index}`}
          className="flex justify-end"
        >
          <Link key={index} href={attachment.url || ""} target="_blank">
            <div className="flex items-center gap-1 cursor-pointer hover:opacity-80">
              <File className="w-4 h-4" />
              <span>{attachment.name}</span>
            </div>
          </Link>
        </div>
      );
  }
}
