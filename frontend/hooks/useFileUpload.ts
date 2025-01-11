import { modelAtom, uploadsAtom } from "@/atoms/chat";
import { useDragAndDrop } from "@/components/DragDropProvider";
import { FileUpload } from "@/types/chat";
import { useAtom } from "jotai";
import { useEffect } from "react";

export function useFileUpload(acceptedTypes: string[]) {
  const [uploads, setUploads] = useAtom(uploadsAtom);
  const [model] = useAtom(modelAtom);
  const { isDragging, setIsDragging } = useDragAndDrop();

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(
      (file) =>
        file.type.startsWith("image/") ||
        (model.supportsPdfs && file.type === "application/pdf")
    );

    const newUploads: FileUpload[] = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith("image/") ? "image" : "pdf",
    }));

    setUploads((prev) => [...prev, ...newUploads]);
  };

  const removeUpload = (index: number) => {
    setUploads((prev) => {
      const updatedUploads = [...prev];
      URL.revokeObjectURL(updatedUploads[index].preview);
      updatedUploads.splice(index, 1);
      return updatedUploads;
    });
  };

  const clearUploads = () => {
    uploads.forEach((upload) => URL.revokeObjectURL(upload.preview));
    setUploads([]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const newUploads: FileUpload[] = Array.from(e.dataTransfer.files)
      .filter(
        (file) =>
          (model.supportsImages && file.type.startsWith("image/")) ||
          (model.supportsPdfs && file.type === "application/pdf")
      )
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith("image/") ? "image" : "pdf",
      }));

    setUploads((prev) => [...prev, ...newUploads]);
  };

  useEffect(() => {
    return () => {
      uploads.forEach((upload) => URL.revokeObjectURL(upload.preview));
    };
  }, []);

  return {
    uploads,
    handleFiles,
    removeUpload,
    clearUploads,
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
