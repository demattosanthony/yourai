import { Attachment } from "@ai-sdk/ui-utils";
import Link from "next/link";
import { File } from "lucide-react";
import { useRef, useEffect } from "react";

import * as pdfjsLib from "pdfjs-dist";

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PdfThumbnail = ({
  url,
  width = 200,
}: {
  url: string;
  width?: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const generateThumbnail = async () => {
      try {
        // Load the PDF
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        // Get first page
        const page = await pdf.getPage(1);

        // Set scale for thumbnail
        const viewport = page.getViewport({ scale: 1 });
        const scale = width / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        // Set canvas dimensions
        const canvas = canvasRef.current;
        if (!canvas) {
          throw new Error("Canvas is null");
        }
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        // Render PDF page to canvas
        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Could not get canvas context");
        }
        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        }).promise;
      } catch (error) {
        console.error("Error generating thumbnail:", error);
      }
    };

    generateThumbnail();
  }, [url, width]);

  return <canvas ref={canvasRef} />;
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
            className="overflow-hidden rounded-lg h-80 max-w-[500px] object-contain"
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
