import useChat, { MessageRole } from "@/hooks/useChat";
import MarkdownViewer from "../MarkdownViewer";
import ToolCallResultComponent from "./ToolCallResult";

export default function ChatMessagesList() {
  const { messages } = useChat();

  return (
    <div className="flex-1 w-full flex overflow-y-auto pt-20">
      <div className="max-w-[1200px] mx-auto p-4 w-full">
        {messages.length === 0 && (
          <div className="flex-1 w-full h-full flex items-center justify-center">
            <Sphere />
          </div>
        )}

        {messages.length > 0 && (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex flex-col
                  ${
                    message.role === MessageRole.user
                      ? "justify-end"
                      : "justify-start"
                  } 
                  mb-4`}
              >
                <>
                  {message.tool_calls?.map((toolCall, id) => (
                    <ToolCallResultComponent toolCall={toolCall} key={id} />
                  ))}
                </>

                <div
                  className={`max-w-full md:max-w-[70%] rounded-lg p-2 ${
                    message.role === MessageRole.user
                      ? "bg-primary text-white self-end dark:text-black"
                      : "bg-accent self-start"
                  }`}
                  style={{
                    whiteSpace:
                      message.role === MessageRole.user ? "pre-wrap" : "normal",
                  }}
                >
                  {message.role === MessageRole.assistant ? (
                    <MarkdownViewer content={message.content || ""} />
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { useTheme } from "next-themes";

function Sphere() {
  const { resolvedTheme } = useTheme();

  return (
    <div className={`w-full h-full`}>
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
}
