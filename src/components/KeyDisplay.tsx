"use client";

import type { KeyChord } from "@/types";
import { formatChord } from "@/input";

type KeyDisplayProps = {
  targetSequence: KeyChord[];
  userInput: KeyChord[];
  showTarget: boolean;
  status: "idle" | "partial" | "success" | "error";
};

function chordsEqual(a: KeyChord, b: KeyChord): boolean {
  if (a.key !== b.key) return false;
  if (a.modifiers.length !== b.modifiers.length) return false;
  const aMods = [...a.modifiers].sort();
  const bMods = [...b.modifiers].sort();
  return aMods.every((mod, i) => mod === bMods[i]);
}

export function KeyDisplay({ targetSequence, userInput, showTarget, status }: KeyDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {showTarget && (
        <div className="flex items-center gap-2">
          {targetSequence.map((chord, idx) => {
            const userChord = userInput[idx];
            const isCorrect = userChord && chordsEqual(chord, userChord);
            const isWrong = userChord && !chordsEqual(chord, userChord);
            const isPending = !userChord;
            
            return (
              <div key={idx} className="flex items-center gap-2">
                {idx > 0 && (
                  <span className="text-muted-foreground text-xs">→</span>
                )}
                <div
                  className={`
                    px-3 py-2 border font-mono text-sm transition-all duration-150
                    ${isCorrect ? "border-success bg-success/10 text-success" : ""}
                    ${isWrong ? "border-error bg-error/10 text-error" : ""}
                    ${isPending ? "border-border bg-muted/30 text-muted-foreground" : ""}
                  `}
                >
                  {formatChord(chord)}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {userInput.length > 0 && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground mr-2">input:</span>
          {userInput.map((chord, idx) => {
            const targetChord = targetSequence[idx];
            const isCorrect = targetChord && chordsEqual(chord, targetChord);
            
            return (
              <div key={idx} className="flex items-center gap-2">
                {idx > 0 && (
                  <span className="text-muted-foreground text-xs">→</span>
                )}
                <div
                  className={`
                    px-3 py-2 border font-mono text-sm transition-all duration-75
                    animate-scale-in
                    ${isCorrect ? "border-success bg-success/20 text-success" : "border-error bg-error/20 text-error"}
                  `}
                >
                  {formatChord(chord)}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {status === "error" && userInput.length > 0 && (
        <div className="text-error text-xs mt-2 animate-fade-in">
          wrong key — buffer reset
        </div>
      )}
    </div>
  );
}
