"use client";

import { useGame } from "@/hooks/useGame";
import { ToolSelect } from "./ToolSelect";
import { Challenge } from "./Challenge";
import { Success } from "./Success";
import { Failed } from "./Failed";
import { Settings } from "./Settings";
import { useEffect, useState } from "react";

export function GameController() {
  const {
    state,
    tool,
    gameMode,
    stats,
    settings,
    userInput,
    inputStatus,
    selectTool,
    startSessionWithTool,
    nextChallenge,
    skipChallenge,
    exitToMenu,
    updateSettings,
  } = useGame();
  
  const [showSettings, setShowSettings] = useState(false);
  
  useEffect(() => {
    if (state.type === "success" || state.type === "failed") {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          exitToMenu();
        } else {
          nextChallenge();
        }
      };
      
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  }, [state.type, nextChallenge, exitToMenu]);
  
  useEffect(() => {
    if (state.type === "prompt" || state.type === "listening") {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Tab") {
          e.preventDefault();
          skipChallenge();
        }
      };
      
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  }, [state.type, skipChallenge]);
  
  const content = (() => {
    switch (state.type) {
      case "idle":
      case "toolSelect":
      case "modeSelect":
        return (
          <ToolSelect
            onSelect={selectTool}
            onStartSession={startSessionWithTool}
            settings={settings}
            onOpenSettings={() => setShowSettings(true)}
          />
        );
      
      case "loading":
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-muted-foreground text-sm animate-pulse-glow">
              loading...
            </div>
          </div>
        );
      
      case "prompt":
      case "listening":
        return (
          <Challenge
            challenge={state.challenge}
            stats={stats}
            settings={settings}
            gameMode={gameMode}
            isListening={state.type === "listening"}
            userInput={userInput}
            inputStatus={inputStatus}
            onSkip={skipChallenge}
            onExit={exitToMenu}
          />
        );
      
      case "success":
        return (
          <Success
            result={state.result}
            onNext={nextChallenge}
          />
        );
      
      case "failed":
        return (
          <Failed
            challenge={state.challenge}
            reason={state.reason}
            settings={settings}
            onNext={nextChallenge}
            onRetry={nextChallenge}
          />
        );
      
      default:
        return null;
    }
  })();
  
  return (
    <>
      {content}
      {showSettings && (
        <Settings
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}