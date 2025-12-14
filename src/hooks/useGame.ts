"use client";

import { useReducer, useCallback, useEffect, useRef, useState } from "react";
import type { ToolDefinition, GameMode, KeyChord, SessionStats, Challenge } from "@/types";
import { gameReducer, initialGameState, updateMastery, computeSessionStats } from "@/state";
import { storage } from "@/state/storage";
import { selectBinding, createChallenge, evaluateInput, createResult } from "@/engine";
import { createInputManager } from "@/input";

type InputStatus = "idle" | "partial" | "success" | "error";
type FeedbackState = "none" | "success" | "error";

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
  const [feedbackState, setFeedbackState] = useState<FeedbackState>("none");
  
  const inputManagerRef = useRef<ReturnType<typeof createInputManager> | null>(null);
  const persistedState = useRef(storage.load());
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoProgressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentChallengeRef = useRef<Challenge | null>(null);
  const gameModeRef = useRef<GameMode>(gameMode);
  
  gameModeRef.current = gameMode;
  
  useEffect(() => {
    if (state.type === "prompt" || state.type === "listening") {
      currentChallengeRef.current = state.challenge;
    }
  }, [state]);
  
  const selectTool = useCallback((selectedTool: ToolDefinition) => {
    setTool(selectedTool);
    dispatch({ type: "SELECT_TOOL", tool: selectedTool });
  }, []);
  
  const nextChallengeInternalRef = useRef<() => void>(() => {});
  
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
    setFeedbackState("none");
    
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
  
  const nextChallengeInternal = useCallback(() => {
    if (!tool) return;
    
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    if (autoProgressTimeoutRef.current) {
      clearTimeout(autoProgressTimeoutRef.current);
      autoProgressTimeoutRef.current = null;
    }
    
    setUserInput([]);
    setInputStatus("idle");
    setFeedbackState("none");
    
    dispatch({ type: "NEXT_CHALLENGE" });
    
    const now = Date.now();
    const binding = selectBinding(tool, persistedState.current.mastery, gameModeRef.current);
    const challenge = createChallenge(binding, gameModeRef.current, persistedState.current.settings, now);
    
    setTimeout(() => {
      dispatch({ type: "PRESENT_CHALLENGE", challenge });
    }, 100);
  }, [tool]);
  
  nextChallengeInternalRef.current = nextChallengeInternal;
  
  const handleInput = useCallback((chord: KeyChord, buffer: KeyChord[]) => {
    const challenge = currentChallengeRef.current;
    if (!challenge) return;
    
    const now = Date.now();
    dispatch({ type: "INPUT_RECEIVED", chord, buffer, timestamp: now });
    
    const matchResult = evaluateInput(challenge, buffer);
    
    setUserInput(buffer);
    
    if (matchResult === "complete") {
      setInputStatus("success");
      
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }
      
      const result = createResult(challenge, buffer, true, now);
      
      persistedState.current = updateMastery(persistedState.current, result, now);
      storage.save(persistedState.current);
      
      setStats((prev) => computeSessionStats(prev, result));
      
      if (gameModeRef.current === "scenario") {
        setFeedbackState("success");
        if (autoProgressTimeoutRef.current) {
          clearTimeout(autoProgressTimeoutRef.current);
        }
        autoProgressTimeoutRef.current = setTimeout(() => {
          nextChallengeInternalRef.current();
        }, 800);
      } else {
        dispatch({ type: "CHALLENGE_SUCCESS", result });
      }
      
      if (inputManagerRef.current) {
        inputManagerRef.current.resetBuffer();
      }
    } else if (matchResult === "partial") {
      setInputStatus("partial");
      
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }
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
        
        if (gameModeRef.current === "scenario") {
          setFeedbackState("error");
          if (autoProgressTimeoutRef.current) {
            clearTimeout(autoProgressTimeoutRef.current);
          }
          autoProgressTimeoutRef.current = setTimeout(() => {
            nextChallengeInternalRef.current();
          }, 800);
        } else {
          dispatch({ type: "CHALLENGE_FAILED", reason: { type: "wrong", userInput: wrongInput } });
        }
        
        if (inputManagerRef.current) {
          inputManagerRef.current.resetBuffer();
        }
        setUserInput([]);
        setInputStatus("idle");
      }, 800);
    }
  }, []);
  
  const nextChallenge = useCallback(() => {
    nextChallengeInternal();
  }, [nextChallengeInternal]);
  
  const skipChallenge = useCallback(() => {
    const challenge = currentChallengeRef.current;
    if (!challenge) return;
    
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    if (autoProgressTimeoutRef.current) {
      clearTimeout(autoProgressTimeoutRef.current);
      autoProgressTimeoutRef.current = null;
    }
    
    const now = Date.now();
    const result = createResult(challenge, [], false, now);
    
    persistedState.current = updateMastery(persistedState.current, result, now);
    storage.save(persistedState.current);
    
    setStats((prev) => computeSessionStats(prev, result));
    
    setUserInput([]);
    setInputStatus("idle");
    setFeedbackState("none");
    
    if (gameModeRef.current === "scenario") {
      nextChallengeInternal();
    } else {
      dispatch({ type: "CHALLENGE_FAILED", reason: { type: "skipped" } });
    }
    
    if (inputManagerRef.current) {
      inputManagerRef.current.resetBuffer();
    }
  }, [nextChallengeInternal]);
  
  const exitToMenu = useCallback(() => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    if (autoProgressTimeoutRef.current) {
      clearTimeout(autoProgressTimeoutRef.current);
      autoProgressTimeoutRef.current = null;
    }
    setTool(null);
    setUserInput([]);
    setInputStatus("idle");
    setFeedbackState("none");
    currentChallengeRef.current = null;
    dispatch({ type: "EXIT_TO_MENU" });
  }, []);
  
  const isInSession = state.type === "prompt" || state.type === "listening" || state.type === "success" || state.type === "failed";
  
  useEffect(() => {
    if (!isInSession) {
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
  }, [isInSession, handleInput]);
  
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      if (autoProgressTimeoutRef.current) {
        clearTimeout(autoProgressTimeoutRef.current);
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
    feedbackState,
    selectTool,
    startSession,
    startSessionWithTool,
    nextChallenge,
    skipChallenge,
    exitToMenu,
    updateSettings: storage.updateSettings,
  };
}