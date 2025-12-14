import type {
  GameState,
  GameSettings,
  PersistedState,
  MasteryRecord,
  ToolDefinition,
  Challenge,
  Result,
  FailureReason,
  KeyChord,
  InputBuffer,
  SessionStats,
} from "@/types";

const STORAGE_KEY = "keybind-trainer-state";
const CURRENT_VERSION = 1;

const DEFAULT_SETTINGS: GameSettings = {
  assistMode: false,
  reducedMotion: false,
  sequenceTimeout: 1500,
  challengeTimeout: null,
};

function getDefaultPersistedState(): PersistedState {
  return {
    version: CURRENT_VERSION,
    mastery: {},
    settings: DEFAULT_SETTINGS,
  };
}

export function loadState(): PersistedState {
  if (typeof window === "undefined") {
    return getDefaultPersistedState();
  }
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultPersistedState();
    
    const parsed = JSON.parse(raw) as PersistedState;
    
    if (parsed.version !== CURRENT_VERSION) {
      return migrateState(parsed);
    }
    
    return parsed;
  } catch {
    return getDefaultPersistedState();
  }
}

export function saveState(state: PersistedState): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silently fail if storage is unavailable
  }
}

function migrateState(state: PersistedState): PersistedState {
  return {
    ...getDefaultPersistedState(),
    mastery: state.mastery ?? {},
    settings: {
      ...DEFAULT_SETTINGS,
      ...state.settings,
    },
    lastTool: state.lastTool,
    lastMode: state.lastMode,
    version: CURRENT_VERSION,
  };
}

export function updateMastery(
  state: PersistedState,
  result: Result,
  timestamp: number = Date.now()
): PersistedState {
  const existing = state.mastery[result.bindingId] ?? {
    bindingId: result.bindingId,
    attempts: 0,
    successes: 0,
    avgReactionMs: 0,
    lastSeen: 0,
  };
  
  const newAttempts = existing.attempts + 1;
  const newSuccesses = existing.successes + (result.success ? 1 : 0);
  const newAvgReactionMs = result.success
    ? (existing.avgReactionMs * existing.successes + result.reactionMs) / newSuccesses
    : existing.avgReactionMs;
  
  const updated: MasteryRecord = {
    bindingId: result.bindingId,
    attempts: newAttempts,
    successes: newSuccesses,
    avgReactionMs: newAvgReactionMs,
    lastSeen: timestamp,
  };
  
  return {
    ...state,
    mastery: {
      ...state.mastery,
      [result.bindingId]: updated,
    },
  };
}

export function getMasteryScore(record: MasteryRecord, currentTime: number = Date.now()): number {
  if (record.attempts === 0) return 0;
  const successRate = record.successes / record.attempts;
  const speedFactor = Math.max(0, 1 - record.avgReactionMs / 5000);
  const decayFactor = Math.exp(-(currentTime - record.lastSeen) / (7 * 24 * 60 * 60 * 1000));
  return successRate * 0.5 + speedFactor * 0.3 + decayFactor * 0.2;
}

export function computeSessionStats(
  prevStats: SessionStats,
  result: Result
): SessionStats {
  const totalAttempts = prevStats.totalAttempts + 1;
  const correctAttempts = prevStats.correctAttempts + (result.success ? 1 : 0);
  const avgReactionMs = result.success
    ? (prevStats.avgReactionMs * prevStats.correctAttempts + result.reactionMs) / correctAttempts
    : prevStats.avgReactionMs;
  
  return {
    ...prevStats,
    totalAttempts,
    correctAttempts,
    avgReactionMs,
  };
}

export type GameAction =
  | { type: "SELECT_TOOL"; tool: ToolDefinition }
  | { type: "START_SESSION" }
  | { type: "PRESENT_CHALLENGE"; challenge: Challenge }
  | { type: "INPUT_RECEIVED"; chord: KeyChord; buffer: KeyChord[]; timestamp: number }
  | { type: "CHALLENGE_SUCCESS"; result: Result }
  | { type: "CHALLENGE_FAILED"; reason: FailureReason }
  | { type: "NEXT_CHALLENGE" }
  | { type: "RESET" }
  | { type: "EXIT_TO_MENU" };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SELECT_TOOL":
      return { type: "modeSelect", tool: action.tool };
    
    case "START_SESSION":
      return { type: "loading" };
    
    case "PRESENT_CHALLENGE":
      return { type: "prompt", challenge: action.challenge };
    
    case "INPUT_RECEIVED":
      if (state.type !== "prompt" && state.type !== "listening") {
        return state;
      }
      const challenge = state.type === "prompt" ? state.challenge : state.challenge;
      const buffer: InputBuffer = {
        sequence: action.buffer,
        lastInputTime: action.timestamp,
      };
      return { type: "listening", challenge, buffer };
    
    case "CHALLENGE_SUCCESS":
      return { type: "success", result: action.result };
    
    case "CHALLENGE_FAILED":
      if (state.type !== "listening" && state.type !== "prompt") {
        return state;
      }
      const failChallenge = state.type === "listening" ? state.challenge : state.challenge;
      return { type: "failed", challenge: failChallenge, reason: action.reason };
    
    case "NEXT_CHALLENGE":
      return { type: "loading" };
    
    case "RESET":
      return { type: "idle" };
    
    case "EXIT_TO_MENU":
      return { type: "toolSelect" };
    
    default:
      return state;
  }
}

export const initialGameState: GameState = { type: "toolSelect" };