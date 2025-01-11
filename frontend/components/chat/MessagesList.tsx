import MarkdownViewer from "../MarkdownViewer";
import { useEffect } from "react";
import { File } from "lucide-react";
import { useAtom } from "jotai";
import { ChatMessage, MessageRole } from "@/types/chat";
import { messagesAtom } from "@/atoms/chat";

function MessageItem({
  message,
  index,
}: {
  message: ChatMessage;
  index: number;
}) {
  const messageType = message.content?.type;
  const text = message.content?.text;
  const image = message.content?.image;

  return (
    <div
      key={index}
      className={`flex flex-col ${
        message.role === MessageRole.user ? "justify-end" : "justify-start"
      } mb-4`}
    >
      {/* <>
            {message.tool_calls?.map((toolCall, id) => (
            <ToolCallResultComponent toolCall={toolCall} key={id} />
            ))}
        </> */}
      <div
        className={`max-w-full md:max-w-full rounded-lg p-2 ${
          message.role === MessageRole.user
            ? "bg-primary text-white self-end dark:text-black"
            : "self-start"
        }`}
        style={{
          whiteSpace: message.role === MessageRole.user ? "pre-wrap" : "normal",
        }}
      >
        <div className="flex gap-2">
          {message.role === MessageRole.assistant && (
            <div className="bg-primary h-6 w-6 rounded-full min-h-6 min-w-6 mt-1" />
          )}

          {message.role === MessageRole.assistant && (
            <div className="max-w-[750px] overflow-hidden">
              <MarkdownViewer content={message.content?.text || ""} />
            </div>
          )}

          {message.role === MessageRole.user && messageType === "text" && (
            <div className="break-words whitespace-pre-wrap max-w-[750px] overflow-hidden">
              {text}
            </div>
          )}

          {message.role === MessageRole.user && messageType === "image" && (
            <img
              src={image}
              alt="User uploaded image"
              className="h-52 object-cover rounded-lg cursor-pointer hover:opacity-90 max-w-[750px]"
              onClick={() => {
                if (typeof window === "undefined") return;
                const newWindow = window.open();
                if (newWindow) {
                  newWindow.document.write(
                    `<img src="${image}" style="width: 100%; display: block; margin: 0 auto;">`
                  );
                  newWindow.document.title = "Image Preview";
                }
              }}
            />
          )}

          {/** Add a button to view the file */}
          {message.role === MessageRole.user && messageType === "file" && (
            <div
              className="flex items-center gap-1 cursor-pointer hover:opacity-80"
              onClick={() => {
                // Extract MIME type and base64 data
                const [header, base64Data] =
                  message.content?.data?.split(",") || [];
                const mimeType =
                  header?.match(/^data:(.*?);/)?.[1] || "application/pdf";

                if (base64Data) {
                  const byteCharacters = atob(base64Data);
                  const byteNumbers = new Array(byteCharacters.length);
                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                  }
                  const byteArray = new Uint8Array(byteNumbers);
                  const blob = new Blob([byteArray], {
                    type: mimeType,
                  });
                  const blobUrl = URL.createObjectURL(blob);

                  // Open in new window
                  window.open(blobUrl, "_blank");

                  // Clean up the Blob URL when the window closes
                  setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                }
              }}
            >
              <File className="w-4 h-4" />
              <span>Open file</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatMessagesList() {
  const [messages] = useAtom(messagesAtom);

  // Add useEffect to handle scrolling
  useEffect(() => {
    const messageContainer = document.querySelector(".overflow-y-auto");
    if (messageContainer) {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div className="flex-1 w-full h-full relative">
      <div className="absolute inset-0 overflow-y-auto">
        <div className={`max-w-[840px] mx-auto pt-20 p-4 w-full`}>
          {messages.length > 0 && (
            <>
              {messages.map((message, index) => {
                return (
                  <MessageItem key={index} message={message} index={index} />
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
