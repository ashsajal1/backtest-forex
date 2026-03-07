"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MousePointer2,
  Minus,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { DrawingTool } from "./drawings";

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  onClearDrawings: () => void;
  hasDrawings: boolean;
}

export default function DrawingToolbar({
  activeTool,
  onToolChange,
  onClearDrawings,
  hasDrawings,
}: DrawingToolbarProps) {
  const tools: { tool: DrawingTool; icon: React.ReactNode; label: string }[] = [
    {
      tool: "none",
      icon: <MousePointer2 className="w-4 h-4" />,
      label: "Select",
    },
    {
      tool: "trendline",
      icon: <TrendingUp className="w-4 h-4" />,
      label: "Trendline",
    },
    {
      tool: "measurement",
      icon: <Minus className="w-4 h-4" />,
      label: "Measure",
    },
    {
      tool: "fibonacci",
      icon: (
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z" />
        </svg>
      ),
      label: "Fibonacci",
    },
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
        {tools.map(({ tool, icon, label }) => (
          <Tooltip key={tool}>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === tool ? "default" : "ghost"}
                size="sm"
                className={`h-8 px-2 ${
                  activeTool === tool
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => onToolChange(tool)}
              >
                {icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {hasDrawings && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground hover:text-destructive"
                onClick={onClearDrawings}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear all drawings</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
