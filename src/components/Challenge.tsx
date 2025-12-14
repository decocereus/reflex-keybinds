"use client";

import type { Challenge as ChallengeType, SessionStats, GameSettings, KeyChord, GameMode } from "@/types";
import { formatSequence, formatChord } from "@/input";
import { useEffect, useState } from "react";
import { KeyDisplay } from "./KeyDisplay";

type ChallengeProps = {
  challenge: ChallengeType;
  stats: SessionStats;
  settings: GameSettings;
  gameMode: GameMode;
  isListening: boolean;
  userInput: KeyChord[];
  inputStatus: "idle" | "partial" | "success" | "error";
  onSkip: () => void;
  onExit: () => void;
};

export function Challenge({ 
  challenge, 
  stats, 
  settings,
  gameMode,
  isListening,
  userInput,
  inputStatus,
  onSkip, 
  onExit 
}: ChallengeProps) {
  const [elapsed, setElapsed] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - challenge.startTime);
    }, 100);
    
    return () => clearInterval(interval);
  }, [challenge.startTime]);
  
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${seconds}.${tenths}s`;
  };

  const showBinding = gameMode === "scenario" || settings.assistMode;
  
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <button
          onClick={onExit}
          className="text-muted-foreground text-xs hover:text-foreground transition-colors"
        >
          ← exit
        </button>
        
        <div className="flex items-center gap-4">
          <div className={`px-2 py-1 text-xs font-medium uppercase tracking-wider ${
            gameMode === "reflex" 
              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
              : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
          }`}>
            {gameMode}
          </div>
          
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span>{stats.correctAttempts}/{stats.totalAttempts}</span>
            {stats.correctAttempts > 0 && (
              <span>{Math.round(stats.avgReactionMs)}ms avg</span>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="animate-fade-in text-center max-w-lg">
          {challenge.binding.mode && (
            <div className="text-xs text-accent mb-4 uppercase tracking-wider">
              {challenge.binding.mode} mode
            </div>
          )}
          
          <div className="text-3xl font-bold mb-4 leading-tight">
            {challenge.prompt}
          </div>

          {gameMode === "scenario" && (
            <div className="text-sm text-muted-foreground mb-6 max-w-md">
              Press the keybinding shown below to perform this action
            </div>
          )}

          {gameMode === "reflex" && !settings.assistMode && (
            <div className="text-sm text-muted-foreground mb-6">
              Recall and press the correct keybinding
            </div>
          )}
          
          {showBinding && (
            <div className="mb-6 p-4 border border-accent/30 bg-accent/5">
              <div className="text-xs text-muted-foreground mb-3">
                {gameMode === "scenario" ? "keybinding to learn" : "hint"}
              </div>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {challenge.binding.sequence.map((chord, idx) => {
                  const isPressed = idx < userInput.length;
                  const isCorrect = isPressed && JSON.stringify(userInput[idx]) === JSON.stringify(chord);
                  const isWrong = isPressed && !isCorrect;
                  const isCurrent = idx === userInput.length;
                  
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      {idx > 0 && <span className="text-muted-foreground text-xs">then</span>}
                      <span className={`px-4 py-2 border font-mono text-sm transition-all ${
                        isWrong 
                          ? "border-error bg-error/20 text-error"
                          : isCorrect
                            ? "border-success bg-success/20 text-success"
                            : isCurrent
                              ? "border-accent bg-accent/10 text-accent animate-pulse"
                              : "border-border bg-muted/30 text-foreground"
                      }`}>
                        {formatChord(chord)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {!showBinding && (
            <div className="mb-6">
              <KeyDisplay
                targetSequence={challenge.binding.sequence}
                userInput={userInput}
                showTarget={false}
                status={inputStatus}
              />
            </div>
          )}
          
          <div className={`text-sm transition-colors ${
            isListening ? 'text-accent' : 'text-muted-foreground'
          }`}>
            {inputStatus === "error" ? (
              <span className="text-error">wrong key — try again</span>
            ) : isListening ? (
              <span className="animate-pulse-glow">listening...</span>
            ) : (
              <span>awaiting input</span>
            )}
          </div>
          
          <div className="mt-6 text-2xl font-mono text-muted-foreground">
            {formatTime(elapsed)}
          </div>
        </div>
      </main>
      
      <footer className="flex items-center justify-between px-6 py-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          {gameMode === "scenario" 
            ? "learning mode — bindings shown" 
            : "reflex mode — test your memory"}
        </div>
        <button
          onClick={onSkip}
          className="text-muted-foreground text-xs hover:text-foreground transition-colors"
        >
          skip (tab)
        </button>
      </footer>
    </div>
  );
}