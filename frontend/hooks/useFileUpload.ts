import { modelAtom, uploadsAtom } from "@/atoms/chat";
import { useDragAndDrop } from "@/components/DragDropProvider";
import { FileUpload } from "@/types/chat";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { toast } from "sonner";

export function useFileUpload(acceptedTypes: string[]) {
  const [uploads, setUploads] = useAtom(uploadsAtom);
  const [model] = useAtom(modelAtom);
  const { isDragging, setIsDragging } = useDragAndDrop();

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      if (file.type.startsWith("image/")) {
        return true;
      }
      if (model.supportsPdfs && file.type === "application/pdf") {
        const isValidSize = !model.maxPdfSize || file.size <= model.maxPdfSize;
        if (!isValidSize) {
          toast.error(
            `PDF file size must be under ${
              (model.maxPdfSize as number) / (1024 * 1024)
            }MB for the selected model.`
          );
        }
        return isValidSize;
      }
      return false;
    });

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
    e.stopPropagation();
    setIsDragging(false);

    const newUploads: FileUpload[] = Array.from(e.dataTransfer.files)
      .filter((file) => {
        if (model.supportsImages && file.type.startsWith("image/")) {
          return true;
        }
        if (model.supportsPdfs && file.type === "application/pdf") {
          const isValidSize =
            !model.maxPdfSize || file.size <= model.maxPdfSize;
          if (!isValidSize) {
            toast.error(
              `PDF file size must be under ${
                (model.maxPdfSize as number) / (1024 * 1024)
              }MB for the selected model.`
            );
          }
          return isValidSize;
        }
        return false;
      })
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
