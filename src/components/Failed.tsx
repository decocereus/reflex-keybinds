"use client";

import type { Challenge, FailureReason, GameSettings } from "@/types";
import { formatSequence, formatChord } from "@/input";

type FailedProps = {
  challenge: Challenge;
  reason: FailureReason;
  settings: GameSettings;
  onNext: () => void;
  onRetry: () => void;
};

export function Failed({ challenge, reason, onNext }: FailedProps) {
  const reasonText = reason.type === "timeout" ? "timeout" :
                     reason.type === "skipped" ? "skipped" :
                     reason.type === "wrong" ? "wrong input" : "reset";
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="animate-scale-in text-center">
        <div className="text-error text-6xl mb-6">×</div>
        
        <div className="text-2xl font-bold mb-2">
          {reasonText}
        </div>
        
        <div className="text-muted-foreground text-sm mb-8">
          {challenge.prompt}
        </div>
        
        {reason.type === "wrong" && reason.userInput.length > 0 && (
          <div className="mb-6 p-4 border border-error/30 bg-error/5">
            <div className="text-xs text-muted-foreground mb-2">you pressed</div>
            <div className="flex items-center justify-center gap-2">
              {reason.userInput.map((chord, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {idx > 0 && <span className="text-muted-foreground text-xs">→</span>}
                  <span className="px-3 py-2 border border-error/50 bg-error/10 text-error font-mono text-sm">
                    {formatChord(chord)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mb-8 p-4 border border-success/30 bg-success/5">
          <div className="text-xs text-muted-foreground mb-2">correct binding</div>
          <div className="flex items-center justify-center gap-2">
            {challenge.binding.sequence.map((chord, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {idx > 0 && <span className="text-muted-foreground text-xs">→</span>}
                <span className="px-3 py-2 border border-success/50 bg-success/10 text-success font-mono text-sm">
                  {formatChord(chord)}
                </span>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {formatSequence(challenge.binding.sequence)}
          </div>
        </div>
        
        <button
          onClick={onNext}
          className="px-8 py-3 bg-muted text-foreground font-medium 
                     hover:bg-muted/80 transition-colors border border-border"
        >
          continue
        </button>
        
        <div className="mt-4 text-xs text-muted-foreground">
          press any key to continue
        </div>
      </div>
    </div>
  );
}