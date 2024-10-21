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
            <div
              className={`w-32 h-32 bg-black rounded-full dark:bg-white

                `}
            ></div>
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
                  className={`max-w-full md:max-w-[70%] rounded-xl p-3 ${
                    message.role === MessageRole.user
                      ? "bg-primary text-white self-end dark:text-black"
                      : "bg-secondary self-start"
                  }`}
                >
                  <MarkdownViewer content={message.content || ""} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
