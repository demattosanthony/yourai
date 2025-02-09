"use client";

import api from "@/lib/api";
import ChatInputForm from "@/components/chat/ChatInputForm";
import ChatMessagesList from "@/components/chat/MessagesList";
import { useThreadQuery } from "@/queries/queries";
import { Attachment, Message } from "@ai-sdk/ui-utils";
import { useChat } from "ai/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import {
  initalInputAtom,
  instructionsAtom,
  modelAtom,
  temperatureAtom,
  uploadsAtom,
} from "@/atoms/chat";
import { useWorkspace } from "@/components/workspace-context";

type ExtendedAttachment = Attachment & {
  file_key: string;
};

export default function ThreadsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ threadId: string }>();
  const threadId = params.threadId;
  const isNew = searchParams.get("new") === "true";

  const [initalInput, setInitalInput] = useAtom(initalInputAtom);
  const [model] = useAtom(modelAtom);
  const [uploads, setUploads] = useAtom(uploadsAtom);
  const [temperature] = useAtom(temperatureAtom);
  const [instructions] = useAtom(instructionsAtom);
  const { activeWorkspace } = useWorkspace();

  const { data: thread } = useThreadQuery(threadId, isNew);

  const initialMessages = useMemo<Message[]>(() => {
    if (!thread?.messages) return [];

    return thread.messages.map((message) => ({
      content: message.content?.text || "",
      role: message.role as "user" | "assistant",
      id: message.id,
      createdAt: message.createdAt ? new Date(message.createdAt) : undefined,
      reasoning: message.reasoning,
      experimental_attachments:
        message.content?.type === "image" || message.content?.type === "file"
          ? [
              {
                name: message.content.file_metadata?.filename,
                url: message.content?.data || "",
                file_key: message.content.file_metadata?.file_key,
                contentType: message.content.file_metadata?.mime_type,
              },
            ]
          : [],
    }));
  }, [thread?.messages]);

  const {
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    messages,
    isLoading,
    stop,
  } = useChat({
    api: `${process.env.NEXT_PUBLIC_API_URL}/threads/${threadId}/inference${
      activeWorkspace?.type === "organization"
        ? `?organizationId=${activeWorkspace.id}`
        : ""
    }`,
    credentials: "include" as const,
    initialInput: isNew ? initalInput : "",
    initialMessages,
    id: threadId,
    experimental_prepareRequestBody({
      messages,
      id,
    }: {
      messages: Message[];
      id: string;
    }) {
      return {
        message: messages[messages.length - 1],
        id,
        model: model.name,
        temperature,
        instructions,
      };
    },
  });

  async function processAttachments() {
    if (uploads.length > 0) {
      const attachments: ExtendedAttachment[] = await Promise.all(
        uploads.map(async (upload) => {
          const { url, file_metadata, viewUrl } = await api.getPresignedUrl(
            upload.file.name,
            upload.file.type,
            upload.file.size
          );

          await fetch(url, {
            method: "PUT",
            body: upload.file,
            headers: {
              "Content-Type": upload.file.type,
            },
          });

          return {
            name: upload.file.name,
            contentType: upload.file.type,
            url: viewUrl,
            file_key: file_metadata.file_key,
          };
        })
      );
      return attachments;
    }
    return [];
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const attachments = await processAttachments();
    handleSubmit(e, {
      experimental_attachments: attachments,
    });
    setUploads([]);
  }

  useEffect(() => {
    if (isNew) {
      onSubmit({ preventDefault: () => {} } as React.FormEvent);
      router.replace(`/threads/${threadId}`);
      setInitalInput("");

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["threads"] });
      }, 2000);
    }
  }, []);

  useEffect(() => {
    return () => {
      setInitalInput("");
    };
  }, [threadId]);

  return (
    <>
      <ChatMessagesList messages={messages} isLoading={isLoading} />

      <div className="w-full flex items-center justify-center mx-auto px-6 pb-8 md:pb-4 md:p-2">
        <ChatInputForm
          input={input}
          setInput={setInput}
          handleInputChange={handleInputChange}
          onSubmit={onSubmit}
          stop={stop}
          isGenerating={isLoading}
        />
      </div>
    </>
  );
}
