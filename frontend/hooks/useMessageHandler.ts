import { useAtom } from "jotai";
import api from "@/lib/api";
import {
  abortControllerAtom,
  inputAtom,
  instructionsAtom,
  isGeneratingAtom,
  messagesAtom,
  modelAtom,
  temperatureAtom,
  uploadsAtom,
} from "@/atoms/chat";
import { MessageContent, MessageRole } from "@/types/chat";
import { useQueryClient } from "@tanstack/react-query";

export function useMessageHandler() {
  const queryClient = useQueryClient();
  const [, setMessages] = useAtom(messagesAtom);
  const [isGenerating, setIsGenerating] = useAtom(isGeneratingAtom);
  const [model] = useAtom(modelAtom);
  const [temperature] = useAtom(temperatureAtom);
  const [instructions] = useAtom(instructionsAtom);
  const [input, setInput] = useAtom(inputAtom);
  const [uploads, setUploads] = useAtom(uploadsAtom);
  const [abortController, setAbortController] = useAtom(abortControllerAtom);

  const sendMessage = async (threadId: string) => {
    if (!input.trim() && uploads.length === 0) return;

    // Prepare content
    let contents: MessageContent[] = [];

    // Process uploads
    if (uploads.length > 0) {
      const uploadContents: MessageContent[] = await Promise.all(
        uploads.map(async (upload) => {
          const { url, file_metadata, viewUrl } = await api.getPresignedUrl(
            upload.file.name,
            upload.file.type,
            upload.file.size
          );

          // upload directly to storage
          await fetch(url, {
            method: "PUT",
            body: upload.file,
            headers: {
              "Content-Type": upload.file.type,
            },
          });

          return {
            type: upload.type === "image" ? "image" : "file",
            data: viewUrl,
            mimeType: upload.file.type,
            file_metadata,
          };
        })
      );
      contents.push(...uploadContents);
    }

    // Add text input
    if (input.trim()) {
      contents.push({
        type: "text",
        text: input.trim(),
      });
    }

    // Update state
    setInput("");
    setUploads([]);
    // setMessages((prev) => [
    //   ...prev,
    //   ...contents.map((msg) => ({ role: MessageRole.user, content: msg })),
    //   {
    //     role: MessageRole.assistant,
    //     content: { type: "text", text: "" },
    //     provider: model.provider,
    //     model: model.name,
    //   },
    // ]);

    setIsGenerating(true);

    await api.addMessageToThread(threadId, "user", contents);

    try {
      for await (const chunk of api.runInference(
        threadId,
        model.name,
        instructions,
        temperature,
        abortController.signal
      )) {
        // Check if the signal is aborted
        if (abortController.signal.aborted) {
          console.log("Abort signal received, exiting message loop");
          break;
        }

        const { event, data } = JSON.parse(chunk);

        if (event === "message") {
          setMessages((prev) =>
            prev.map((message, index) =>
              index === prev.length - 1 &&
              message.role === MessageRole.assistant
                ? {
                    ...message,
                    content: {
                      type: "text",
                      text: (message.content?.text || "") + data.text,
                    },
                  }
                : message
            )
          );
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Message generation aborted");
      } else {
        console.error("Error in sendMessage:", error);
      }
    } finally {
      setIsGenerating(false);
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    }
  };

  const abortMessage = () => {
    if (abortController) {
      abortController.abort();
      setIsGenerating(false);
      setAbortController(new AbortController());
    }
  };

  return {
    sendMessage,
    abortMessage,
    isGenerating,
  };
}
