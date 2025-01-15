"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import { Textarea } from "./ui/textarea";
import { useAtom } from "jotai";
import { instructionsAtom, temperatureAtom } from "@/atoms/chat";

export default function ChatSettings() {
  const [temperature, setTemperature] = useAtom(temperatureAtom);
  const [, setInputValue] = useState(temperature.toFixed(2));
  const [instructions, setInstructions] = useAtom(instructionsAtom);

  useEffect(() => {
    setInputValue(temperature.toFixed(1));
  }, [temperature]);

  const handleTemperatureChange = (value: number[]) => {
    const newTemp = value[0];
    setTemperature(newTemp);
  };

  //   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //     const value = e.target.value;
  //     setInputValue(value);
  //     const numValue = parseFloat(value);
  //     if (!isNaN(numValue) && numValue >= 0 && numValue <= 2) {
  //       setTemperature(numValue);
  //     }
  //   };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Settings size={16} className="min-h-4 min-w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-medium leading-none">Creativity</h4>
              <div className="text-base font-medium pr-2">
                {temperature.toFixed(1)}
              </div>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[temperature]}
              onValueChange={handleTemperatureChange}
            />
          </div>

          <div className="space-y-3">
            <h4 className="font-medium leading-none">Custom Instructions</h4>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Add any custom instructions for the AI..."
              className="w-full min-h-[200px] p-2 text-sm rounded-md max-h-[600px]"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
