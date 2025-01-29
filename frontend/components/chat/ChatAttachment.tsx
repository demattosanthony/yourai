import { Attachment } from "@ai-sdk/ui-utils";
import Link from "next/link";
import { Button } from "../ui/button";
import { File, Maximize2 } from "lucide-react";

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
          className="flex justify-end mb-4"
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
          className="relative w-full h-[400px] flex justify-end mb-4"
        >
          <div className="max-w-[750px] rounded-lg overflow-hidden">
            <iframe
              src={`${attachment.url}#toolbar=0&navpanes=0&scrollbar=0&page=1&view=Fit`}
              className="w-full h-full"
              title={attachment.name}
            />
            <Link
              href={attachment.url || ""}
              target="_blank"
              className="absolute bottom-2 right-2"
            >
              <Button size={"icon"} variant={"outline"}>
                <Maximize2 className="h-4 w-4 text-primary" />
              </Button>
            </Link>
          </div>
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
