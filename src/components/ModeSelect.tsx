"use client";

import type { ToolDefinition, GameMode } from "@/types";

type ModeSelectProps = {
  tool: ToolDefinition;
  onSelect: (mode: GameMode) => void;
  onBack: () => void;
};

export function ModeSelect({ tool, onSelect, onBack }: ModeSelectProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="animate-fade-in">
        <button
          onClick={onBack}
          className="text-muted-foreground text-xs hover:text-foreground 
                     transition-colors mb-8 flex items-center gap-2"
        >
          <span>←</span>
          <span>back</span>
        </button>
        
        <h1 className="text-2xl font-bold mb-2 text-center tracking-tight">
          {tool.name}
        </h1>
        <p className="text-muted-foreground text-sm mb-12 text-center">
          select training mode
        </p>
        
        <div className="flex flex-col gap-4 min-w-[320px]">
          <button
            onClick={() => onSelect("reflex")}
            className="group relative px-6 py-5 border border-border bg-muted/30 
                       hover:bg-muted hover:border-accent/50 
                       transition-all duration-150 text-left"
          >
            <div className="font-medium mb-1">Reflex</div>
            <div className="text-muted-foreground text-xs">
              action prompt → key response
            </div>
            <div className="absolute inset-0 border border-accent opacity-0 
                            group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
          
          <button
            onClick={() => onSelect("scenario")}
            className="group relative px-6 py-5 border border-border bg-muted/30 
                       hover:bg-muted hover:border-accent/50 
                       transition-all duration-150 text-left"
          >
            <div className="font-medium mb-1">Scenario</div>
            <div className="text-muted-foreground text-xs">
              contextual challenges with editor state
            </div>
            <div className="absolute inset-0 border border-accent opacity-0 
                            group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-border">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>bindings</span>
              <span>{tool.bindings.length}</span>
            </div>
            <div className="flex justify-between">
              <span>warmup</span>
              <span>{tool.difficultyCurve.warmup}</span>
            </div>
            <div className="flex justify-between">
              <span>mastery</span>
              <span>{tool.difficultyCurve.mastery}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
