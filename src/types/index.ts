// Closed registries
export const Tools = ["vim", "vscode", "tmux"] as const;
export type ToolId = (typeof Tools)[number];

export const VimModes = ["normal", "insert", "visual", "command"] as const;
export const TmuxModes = [] as const;
export const VSCodeModes = [] as const;
export type VimModeId = (typeof VimModes)[number];
export type ModeId = VimModeId | string; // Allow string for extensibility, but prefer closed unions

export const Categories = [
  "motion",
  "edit",
  "mode",
  "search",
  "window",
  "pane",
  "file",
  "navigation",
  "view",
  "command",
  "mark",
  "core",
  "copy",
  "session",
  "debug",
  "terminal",
  "editor",
  "intellisense",
  "refactor",
  "ai",
  "general",
  "unknown",
] as const;
export type CategoryId = (typeof Categories)[number];

export type Modifier = "ctrl" | "shift" | "alt" | "meta";

export type Key =
  | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m"
  | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z"
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "enter" | "escape" | "tab" | "space" | "backspace" | "delete"
  | "up" | "down" | "left" | "right"
  | "home" | "end" | "pageup" | "pagedown"
  | "f1" | "f2" | "f3" | "f4" | "f5" | "f6" | "f7" | "f8" | "f9" | "f10" | "f11" | "f12"
  | "[" | "]" | "\\" | ";" | "'" | "," | "." | "/" | "`" | "-" | "="
  | "+" | "*" | "^" | "$" | "%" | "#" | "@" | "!" | "~"
  | "{" | "}";

export type KeyChord = {
  modifiers: Modifier[];
  key: Key;
};

export type ContextRule =
  | { type: "mode"; value: ModeId }
  | { type: "cursor"; value: "start" | "middle" | "end" }
  | { type: "selection"; value: "none" | "active" }
  | { type: "windows"; min: number }
  | { type: "fileState"; value: "clean" | "dirty" };

export type Binding = {
  id: string;
  tool: ToolId;
  mode?: ModeId;
  actionId?: string;
  action: string;
  sequence: KeyChord[];
  category: CategoryId;
  difficulty: 1 | 2 | 3 | 4 | 5;
  description?: string;
  context?: ContextRule[];
};

export type ModeDefinition = {
  id: ModeId;
  name: string;
  defaultMode?: boolean;
};

export type ToolDefinition = {
  id: ToolId;
  name: string;
  modes?: ModeDefinition[];
  bindings: Binding[];
  difficultyCurve: {
    warmup: number;
    mastery: number;
  };
};

export type ChallengeUIHints = {
  showBinding: boolean;
  showHint: boolean;
  instructionText?: string;
};

export type Challenge = {
  id: string;
  binding: Binding;
  prompt: string;
  context?: Record<string, unknown>;
  startTime: number;
  uiHints: ChallengeUIHints;
};

export type Result = {
  challengeId: string;
  bindingId: string;
  reactionMs: number;
  success: boolean;
  inputSequence: KeyChord[];
};

export type FailureReason =
  | { type: "timeout" }
  | { type: "reset" }
  | { type: "skipped" }
  | { type: "wrong"; userInput: KeyChord[] };

export type InputBuffer = {
  sequence: KeyChord[];
  lastInputTime: number;
};

// FSM states - explicit discriminated union
export type GameState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "toolSelect" }
  | { type: "modeSelect"; tool: ToolDefinition }
  | { type: "prompt"; challenge: Challenge }
  | { type: "listening"; challenge: Challenge; buffer: InputBuffer }
  | { type: "success"; result: Result }
  | { type: "failed"; challenge: Challenge; reason: FailureReason };

export type GameMode = "reflex" | "scenario";

export type GameSettings = {
  assistMode: boolean;
  reducedMotion: boolean;
  sequenceTimeout: number;
  challengeTimeout: number | null;
};

// Input matching result with ambiguity support
export type MatchResult =
  | { type: "none" }
  | { type: "partial"; possibleBindings?: string[] }
  | { type: "exact"; bindingId: string };

export type MasteryRecord = {
  bindingId: string;
  attempts: number;
  successes: number;
  avgReactionMs: number;
  lastSeen: number;
};

export type SessionStats = {
  totalAttempts: number;
  correctAttempts: number;
  avgReactionMs: number;
  startTime: number;
};

export type PersistedState = {
  version: number;
  mastery: Record<string, MasteryRecord>;
  settings: GameSettings;
  lastTool?: ToolId;
  lastMode?: GameMode;
};