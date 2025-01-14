"use client";

import FileViewerHeader from "@/components/FileViewerHeader";
import { Worker } from "@react-pdf-viewer/core";

export default function FilesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen flex flex-col relative max-h-[-webkit-fill-available] overflow-hidden">
      <FileViewerHeader />

      <div className="flex flex-1 w-full mt-[55px] items-center justify-center overflow-y-auto">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
          {children}
        </Worker>
      </div>
    </div>
  );
}
