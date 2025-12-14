"use client";

import { useReducer, useCallback, useEffect, useRef, useState } from "react";
import type { ToolDefinition, GameMode, KeyChord, SessionStats } from "@/types";
import { gameReducer, initialGameState, updateMastery, computeSessionStats } from "@/state";
import { storage } from "@/state/storage";
import { selectBinding, createChallenge, evaluateInput, createResult } from "@/engine";
import { createInputManager } from "@/input";

type InputStatus = "idle" | "partial" | "success" | "error";

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [tool, setTool] = useState<ToolDefinition | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>("reflex");
  const [stats, setStats] = useState<SessionStats>({
    totalAttempts: 0,
    correctAttempts: 0,
    avgReactionMs: 0,
    startTime: Date.now(),
  });
  const [userInput, setUserInput] = useState<KeyChord[]>([]);
  const [inputStatus, setInputStatus] = useState<InputStatus>("idle");
  
  const inputManagerRef = useRef<ReturnType<typeof createInputManager> | null>(null);
  const persistedState = useRef(storage.load());
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const selectTool = useCallback((selectedTool: ToolDefinition) => {
    setTool(selectedTool);
    dispatch({ type: "SELECT_TOOL", tool: selectedTool });
  }, []);
  
  const startSessionWithTool = useCallback((selectedTool: ToolDefinition, mode: GameMode) => {
    const now = Date.now();
    setTool(selectedTool);
    setGameMode(mode);
    setStats({
      totalAttempts: 0,
      correctAttempts: 0,
      avgReactionMs: 0,
      startTime: now,
    });
    setUserInput([]);
    setInputStatus("idle");
    
    dispatch({ type: "START_SESSION" });
    
    const binding = selectBinding(selectedTool, persistedState.current.mastery, mode);
    const challenge = createChallenge(binding, mode, persistedState.current.settings, now);
    
    setTimeout(() => {
      dispatch({ type: "PRESENT_CHALLENGE", challenge });
    }, 100);
  }, []);
  
  const startSession = useCallback((mode: GameMode) => {
    if (!tool) return;
    startSessionWithTool(tool, mode);
  }, [tool, startSessionWithTool]);
  
  const handleInput = useCallback((chord: KeyChord, buffer: KeyChord[]) => {
    if (state.type !== "prompt" && state.type !== "listening") return;
    
    const now = Date.now();
    dispatch({ type: "INPUT_RECEIVED", chord, buffer, timestamp: now });
    
    const challenge = state.type === "prompt" ? state.challenge : state.challenge;
    const matchResult = evaluateInput(challenge, buffer);
    
    setUserInput(buffer);
    
    if (matchResult === "complete") {
      setInputStatus("success");
      const result = createResult(challenge, buffer, true, now);
      
      persistedState.current = updateMastery(persistedState.current, result, now);
      storage.save(persistedState.current);
      
      setStats((prev) => computeSessionStats(prev, result));
      
      dispatch({ type: "CHALLENGE_SUCCESS", result });
      
      if (inputManagerRef.current) {
        inputManagerRef.current.resetBuffer();
      }
    } else if (matchResult === "partial") {
      setInputStatus("partial");
    } else if (matchResult === "none") {
      setInputStatus("error");
      
      const wrongInput = [...buffer];
      
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      
      errorTimeoutRef.current = setTimeout(() => {
        const errorNow = Date.now();
        const result = createResult(challenge, wrongInput, false, errorNow);
        
        persistedState.current = updateMastery(persistedState.current, result, errorNow);
        storage.save(persistedState.current);
        
        setStats((prev) => computeSessionStats(prev, result));
        
        dispatch({ type: "CHALLENGE_FAILED", reason: { type: "wrong", userInput: wrongInput } });
        
        if (inputManagerRef.current) {
          inputManagerRef.current.resetBuffer();
        }
        setUserInput([]);
        setInputStatus("idle");
      }, 800);
    }
  }, [state]);
  
  const nextChallenge = useCallback(() => {
    if (!tool) return;
    
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    
    setUserInput([]);
    setInputStatus("idle");
    
    dispatch({ type: "NEXT_CHALLENGE" });
    
    const now = Date.now();
    const binding = selectBinding(tool, persistedState.current.mastery, gameMode);
    const challenge = createChallenge(binding, gameMode, persistedState.current.settings, now);
    
    setTimeout(() => {
      dispatch({ type: "PRESENT_CHALLENGE", challenge });
    }, 100);
  }, [tool, gameMode]);
  
  const skipChallenge = useCallback(() => {
    if (state.type !== "prompt" && state.type !== "listening") return;
    
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    
    const now = Date.now();
    const challenge = state.type === "prompt" ? state.challenge : state.challenge;
    const result = createResult(challenge, [], false, now);
    
    persistedState.current = updateMastery(persistedState.current, result, now);
    storage.save(persistedState.current);
    
    setStats((prev) => computeSessionStats(prev, result));
    
    setUserInput([]);
    setInputStatus("idle");
    
    dispatch({ type: "CHALLENGE_FAILED", reason: { type: "skipped" } });
    
    if (inputManagerRef.current) {
      inputManagerRef.current.resetBuffer();
    }
  }, [state]);
  
  const exitToMenu = useCallback(() => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    setTool(null);
    setUserInput([]);
    setInputStatus("idle");
    dispatch({ type: "EXIT_TO_MENU" });
  }, []);
  
  useEffect(() => {
    if (state.type !== "prompt" && state.type !== "listening") {
      return;
    }
    
    const settings = persistedState.current.settings;
    inputManagerRef.current = createInputManager(handleInput, {
      timeout: settings.sequenceTimeout,
    });
    
    const handler = (e: KeyboardEvent) => {
      inputManagerRef.current?.handleKeyDown(e);
    };
    
    window.addEventListener("keydown", handler, { capture: true });
    
    return () => {
      window.removeEventListener("keydown", handler, { capture: true });
      inputManagerRef.current?.destroy();
      inputManagerRef.current = null;
    };
  }, [state.type, handleInput]);
  
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    state,
    tool,
    gameMode,
    stats,
    settings: persistedState.current.settings,
    userInput,
    inputStatus,
    selectTool,
    startSession,
    startSessionWithTool,
    nextChallenge,
    skipChallenge,
    exitToMenu,
    updateSettings: storage.updateSettings,
  };
}