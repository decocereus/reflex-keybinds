"use client";

import type { GameSettings } from "@/types";

type SettingsProps = {
  settings: GameSettings;
  onUpdate: (settings: Partial<GameSettings>) => void;
  onClose: () => void;
};

export function Settings({ settings, onUpdate, onClose }: SettingsProps) {
  return (
    <div className="fixed inset-0 bg-background/95 flex items-center justify-center z-50">
      <div className="animate-scale-in w-full max-w-md p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold">settings</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-6">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-medium">Assist Mode</div>
              <div className="text-xs text-muted-foreground">
                Show hints and correct bindings
              </div>
            </div>
            <button
              onClick={() => onUpdate({ assistMode: !settings.assistMode })}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.assistMode ? 'bg-accent' : 'bg-muted'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-foreground transition-transform ${
                  settings.assistMode ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
          
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-medium">Reduced Motion</div>
              <div className="text-xs text-muted-foreground">
                Minimize animations
              </div>
            </div>
            <button
              onClick={() => onUpdate({ reducedMotion: !settings.reducedMotion })}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.reducedMotion ? 'bg-accent' : 'bg-muted'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-foreground transition-transform ${
                  settings.reducedMotion ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
          
          <div>
            <div className="font-medium mb-2">Sequence Timeout</div>
            <div className="text-xs text-muted-foreground mb-3">
              Time between keypresses in a sequence
            </div>
            <div className="flex gap-2">
              {[500, 1000, 1500, 2000].map((ms) => (
                <button
                  key={ms}
                  onClick={() => onUpdate({ sequenceTimeout: ms })}
                  className={`px-3 py-1 text-xs border transition-colors ${
                    settings.sequenceTimeout === ms
                      ? 'border-accent text-accent'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {ms}ms
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-6 border-t border-border">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-muted text-foreground font-medium 
                       hover:bg-muted/80 transition-colors border border-border"
          >
            close
          </button>
        </div>
      </div>
    </div>
  );
}
