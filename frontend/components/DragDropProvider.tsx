"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAtom } from "jotai";
import { modelAtom, uploadsAtom } from "@/atoms/chat";
import { FileUpload } from "@/types/chat";

interface DragAndDropContextType {
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
}

const DragAndDropContext = createContext<DragAndDropContextType | undefined>(
  undefined
);

export function DragAndDropProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [, setUploads] = useAtom(uploadsAtom);
  const [model] = useAtom(modelAtom);

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (!model.supportsImages && !model.supportsPdfs) return;
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      const rect = document.documentElement.getBoundingClientRect();
      const isLeaving =
        e.clientX <= rect.left ||
        e.clientX >= rect.right ||
        e.clientY <= rect.top ||
        e.clientY >= rect.bottom;

      if (isLeaving) {
        setIsDragging(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (!model.supportsImages && !model.supportsPdfs) return;

      const files = Array.from(e.dataTransfer?.files || []);
      const validFiles = files.filter(
        (file) =>
          (model.supportsImages && file.type.startsWith("image/")) ||
          (model.supportsPdfs && file.type === "application/pdf")
      );

      const newUploads: FileUpload[] = validFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith("image/") ? "image" : "pdf",
      }));

      setUploads((prev) => [...prev, ...newUploads]);
    };

    if (typeof window === "undefined") return;

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [model.supportsImages, model.supportsPdfs, setUploads]);

  return (
    <DragAndDropContext.Provider value={{ isDragging, setIsDragging }}>
      {children}
      {isDragging && (model.supportsImages || model.supportsPdfs) && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* Animated backdrop */}
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] transition-all duration-300" />

          <div className="absolute inset-4 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 animate-gradient" />
            <div className="absolute inset-[1px] bg-background/95 rounded-xl flex items-center justify-center">
              <p className="text-xl font-light text-primary/70">
                Release to add files
              </p>
            </div>
          </div>
        </div>
      )}
    </DragAndDropContext.Provider>
  );
}

export const useDragAndDrop = () => {
  const context = useContext(DragAndDropContext);
  if (!context) {
    throw new Error("useDragAndDrop must be used within a DragAndDropProvider");
  }
  return context;
};
