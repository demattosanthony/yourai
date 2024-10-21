import { ToolCall } from "@/hooks/useChat";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Check, Loader2 } from "lucide-react";
import { ScrollBar } from "../ui/scroll-area";

export default function ToolCallResultComponent({
  toolCall,
}: {
  toolCall: ToolCall;
}) {
  switch (toolCall.function.name) {
    case "webSearch":
      return (
        <div className="flex flex-col gap-2 w-full flex-1 max-w-[450px]">
          <div className="w-full flex flex-1">
            <ScrollArea className="flex flex-1">
              <div className="flex w-max pb-4 gap-2">
                {toolCall.status === "pending" ? (
                  <div className="flex max-w-[300px]">
                    <Loader2 className="h-5 w-5 text-primary animate-spin mr-2" />
                    <p className="text-sm text-primary/80">
                      Searching the web...
                    </p>
                  </div>
                ) : (
                  <div className="flex max-w-[300px]">
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <p className="text-sm text-primary/80">
                      Finished web search
                    </p>
                  </div>
                )}
              </div>
              <ScrollBar orientation="horizontal" />
              <div className="w-full"></div>
            </ScrollArea>
          </div>
        </div>
      );

    default:
      return <div>Unknown tool call result</div>;
  }
}
