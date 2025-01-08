"use client";

import ChatInputForm from "@/components/chat/ChatInputForm";
import useChat, { isNewThreadAtom, MessageContent } from "@/hooks/useChat";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { useTheme } from "next-themes";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { memo } from "react";

export default function Home() {
  const { handleSubmit, handleAbort, input, selectedAttachments } = useChat();
  const router = useRouter();
  const [, setIsNewThread] = useAtom(isNewThreadAtom);

  return (
    <>
      <div className="h-[90%] w-full flex items-center justify-center">
        <Sphere />
      </div>

      <div className="w-full flex items-center justify-center mx-auto p-1 pb-2 absolute bottom-0 left-0 right-0">
        <ChatInputForm
          onSubmit={async () => {
            try {
              // Create a new thread and navigate to it
              const { id: threadId } = await api.createThread();
              setIsNewThread(true);
              router.push(`/${threadId}`);

              let messages: MessageContent[] = [];

              if (selectedAttachments.length) {
                messages = await Promise.all(
                  selectedAttachments.map(async (attachment) => {
                    const reader = new FileReader();
                    const base64Promise = new Promise<string>((resolve) => {
                      reader.onload = () => resolve(reader.result as string);
                    });
                    reader.readAsDataURL(attachment);
                    const base64 = await base64Promise;

                    return {
                      type: attachment.type.startsWith("image/")
                        ? "image"
                        : "file",
                      image: attachment.type.startsWith("image/")
                        ? base64
                        : undefined,
                      mimeType:
                        attachment.type === "application/pdf"
                          ? "application/pdf"
                          : undefined,
                      data:
                        attachment.type === "application/pdf"
                          ? base64
                          : undefined,
                    };
                  })
                );
              }

              // add user text input
              messages.push({
                type: "text",
                text: input,
              });

              // Submit the message to the new thread
              handleSubmit(threadId, messages);
            } catch (error) {
              console.error("Error creating thread:", error);
            }
          }}
          onAbort={handleAbort}
          aria-label="Chat input form"
        />
      </div>
    </>
  );
}

const Sphere = memo(function Sphere() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.1} />
        <directionalLight position={[3, 3, 5]} intensity={0.3} />
        <pointLight position={[-5, -5, -5]} intensity={0.1} color="#ffffff" />
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial
            color={resolvedTheme === "dark" ? "white" : "black"}
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>
        <Environment preset="warehouse" />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
      </Canvas>
    </div>
  );
});
