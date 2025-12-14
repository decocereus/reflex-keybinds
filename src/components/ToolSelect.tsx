"use client";

import type { ToolDefinition, GameSettings, GameMode } from "@/types";
import { getAllTools } from "@/bindings";
import { useState } from "react";

type ToolSelectProps = {
  onSelect: (tool: ToolDefinition) => void;
  onStartSession: (tool: ToolDefinition, mode: GameMode) => void;
  settings: GameSettings;
  onOpenSettings: () => void;
};

export function ToolSelect({ onStartSession, onOpenSettings }: ToolSelectProps) {
  const tools = getAllTools();
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold mb-2 text-center tracking-tight">
          keybind.trainer
        </h1>
        <p className="text-muted-foreground text-sm mb-12 text-center">
          muscle memory through repetition
        </p>
        
        <div className="flex flex-col gap-3 min-w-[380px]">
          {tools.map((tool, index) => (
            <div key={tool.id} style={{ animationDelay: `${index * 50}ms` }}>
              <button
                onClick={() => setSelectedTool(selectedTool?.id === tool.id ? null : tool)}
                className={`group relative w-full px-6 py-4 border bg-muted/30 
                           transition-all duration-150 text-left
                           ${selectedTool?.id === tool.id 
                             ? 'border-accent bg-muted' 
                             : 'border-border hover:bg-muted hover:border-accent/50'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{tool.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {tool.bindings.length} bindings
                  </span>
                </div>
              </button>
              
              {selectedTool?.id === tool.id && (
                <div className="border border-t-0 border-border bg-background p-5 animate-fade-in">
                  <div className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">
                    choose training mode
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <button
                      onClick={() => onStartSession(tool, "scenario")}
                      className="group relative px-5 py-4 border border-blue-500/30 bg-blue-500/5 
                                 hover:bg-blue-500/10 hover:border-blue-500/50 
                                 transition-all duration-150 text-left"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          LEARN
                        </div>
                        <span className="font-medium">Scenario Mode</span>
                      </div>
                      <div className="text-muted-foreground text-xs leading-relaxed mb-3">
                        Keybindings are displayed on screen. Practice pressing them 
                        while seeing the answer — perfect for learning new shortcuts.
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-blue-400">✓ Shows keybinding</span>
                        <span className="text-blue-400">✓ Learn by doing</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => onStartSession(tool, "reflex")}
                      className="group relative px-5 py-4 border border-orange-500/30 bg-orange-500/5 
                                 hover:bg-orange-500/10 hover:border-orange-500/50 
                                 transition-all duration-150 text-left"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="px-2 py-0.5 text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          TEST
                        </div>
                        <span className="font-medium">Reflex Mode</span>
                      </div>
                      <div className="text-muted-foreground text-xs leading-relaxed mb-3">
                        No hints — just the action name. Recall and press the correct 
                        keybinding from memory to build true muscle memory.
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-orange-400">✓ Tests recall</span>
                        <span className="text-orange-400">✓ Builds speed</span>
                      </div>
                    </button>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-xs text-muted-foreground text-center">
                      Start with <span className="text-blue-400">Scenario</span> to learn, 
                      then switch to <span className="text-orange-400">Reflex</span> to test
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-12 flex items-center justify-center gap-4">
          <button
            onClick={onOpenSettings}
            className="text-muted-foreground text-xs hover:text-foreground transition-colors"
          >
            settings
          </button>
        </div>
      </div>
    </div>
  );
}