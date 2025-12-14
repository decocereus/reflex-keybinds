import type {
  GameState,
  GameMode,
  KeyChord,
  Challenge,
  Result,
  FailureReason,
  ToolDefinition,
  Binding,
  MasteryRecord,
  MatchResult,
  ChallengeUIHints,
} from "@/types";
import { chordsEqual } from "@/input";

export type EngineEvent =
  | { type: "SELECT_TOOL"; tool: ToolDefinition }
  | { type: "START_SESSION"; tool: ToolDefinition; mode: GameMode }
  | { type: "PRESENT_CHALLENGE"; challenge: Challenge }
  | { type: "KEY_INPUT"; chord: KeyChord }
  | { type: "SEQUENCE_TIMEOUT" }
  | { type: "CHALLENGE_TIMEOUT" }
  | { type: "SKIP" }
  | { type: "EXIT_TO_MENU" }
  | { type: "NEXT_CHALLENGE" };

export type Effect =
  | { type: "PERSIST_RESULT"; result: Result }
  | { type: "SCHEDULE_TIMEOUT"; ms: number; event: EngineEvent }
  | { type: "CANCEL_TIMEOUT"; id: string }
  | { type: "GENERATE_CHALLENGE"; tool: ToolDefinition; mode: GameMode; mastery: Record<string, MasteryRecord> };

export type EngineResult = {
  state: GameState;
  effects: Effect[];
};

export function matchSequence(input: KeyChord[], target: KeyChord[]): MatchResult {
  if (input.length === 0) return { type: "none" };
  if (input.length > target.length) return { type: "none" };

  for (let i = 0; i < input.length; i++) {
    if (!chordsEqual(input[i], target[i])) {
      return { type: "none" };
    }
  }

  return input.length === target.length
    ? { type: "exact", bindingId: "" }
    : { type: "partial" };
}

export function matchWithAmbiguity(
  input: KeyChord[],
  target: KeyChord[],
  allBindings: Binding[]
): MatchResult {
  const directMatch = matchSequence(input, target);

  if (directMatch.type === "exact") {
    return directMatch;
  }

  if (directMatch.type === "partial") {
    const possibleBindings = allBindings
      .filter((b) => {
        const match = matchSequence(input, b.sequence);
        return match.type === "partial" || match.type === "exact";
      })
      .map((b) => b.id);

    return { type: "partial", possibleBindings };
  }

  return { type: "none" };
}

export function computeUIHints(mode: GameMode, assistMode: boolean): ChallengeUIHints {
  const showBinding = mode === "scenario" || assistMode;
  return {
    showBinding,
    showHint: assistMode && mode === "reflex",
    instructionText: mode === "scenario"
      ? undefined
      : assistMode
        ? "hint"
        : undefined,
  };
}

export function createChallengeWithHints(
  binding: Binding,
  mode: GameMode,
  assistMode: boolean
): Challenge {
  const prompt = mode === "reflex" ? binding.action : generateScenarioPrompt(binding);
  const uiHints = computeUIHints(mode, assistMode);

  return {
    id: generateId(),
    binding,
    prompt,
    context: mode === "scenario" ? generateContext(binding) : undefined,
    startTime: Date.now(),
    uiHints,
  };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function generateScenarioPrompt(binding: Binding): string {
  const scenarios: Record<string, string[]> = {
    motion: ["Move to the target position", "Navigate to the specified location"],
    edit: ["Modify the text as needed", "Apply the required change"],
    search: ["Locate the pattern", "Find the target"],
    mode: ["Switch to the appropriate mode", "Enter the required state"],
    file: ["Perform the file operation"],
    navigation: ["Navigate to the target", "Jump to the location"],
    view: ["Adjust the view", "Change the display"],
  };

  const categoryScenarios = scenarios[binding.category] ?? ["Execute the action"];
  const randomScenario = categoryScenarios[Math.floor(Math.random() * categoryScenarios.length)];

  return `${randomScenario}: ${binding.action}`;
}

function generateContext(binding: Binding): Record<string, unknown> {
  const context: Record<string, unknown> = {};

  if (binding.context) {
    for (const rule of binding.context) {
      switch (rule.type) {
        case "mode":
          context.mode = rule.value;
          break;
        case "cursor":
          context.cursorPosition = rule.value;
          break;
        case "selection":
          context.hasSelection = rule.value === "active";
          break;
        case "windows":
          context.windowCount = rule.min;
          break;
        case "fileState":
          context.isDirty = rule.value === "dirty";
          break;
      }
    }
  }

  return context;
}

export function transition(
  state: GameState,
  event: EngineEvent,
  context: { buffer: KeyChord[]; tool?: ToolDefinition }
): EngineResult {
  const effects: Effect[] = [];

  switch (event.type) {
    case "SELECT_TOOL":
      return { state: { type: "modeSelect", tool: event.tool }, effects };

    case "START_SESSION":
      effects.push({
        type: "GENERATE_CHALLENGE",
        tool: event.tool,
        mode: event.mode,
        mastery: {},
      });
      return { state: { type: "loading" }, effects };

    case "PRESENT_CHALLENGE":
      return { state: { type: "prompt", challenge: event.challenge }, effects };

    case "KEY_INPUT": {
      if (state.type !== "prompt" && state.type !== "listening") {
        return { state, effects };
      }

      const challenge = state.challenge;
      const newBuffer = [...context.buffer, event.chord];
      const matchResult = matchSequence(newBuffer, challenge.binding.sequence);

      if (matchResult.type === "exact") {
        const result: Result = {
          challengeId: challenge.id,
          bindingId: challenge.binding.id,
          reactionMs: Date.now() - challenge.startTime,
          success: true,
          inputSequence: newBuffer,
        };
        effects.push({ type: "PERSIST_RESULT", result });
        return { state: { type: "success", result }, effects };
      }

      if (matchResult.type === "partial") {
        return {
          state: {
            type: "listening",
            challenge,
            buffer: { sequence: newBuffer, lastInputTime: Date.now() },
          },
          effects,
        };
      }

      const failResult: Result = {
        challengeId: challenge.id,
        bindingId: challenge.binding.id,
        reactionMs: Date.now() - challenge.startTime,
        success: false,
        inputSequence: newBuffer,
      };
      effects.push({ type: "PERSIST_RESULT", result: failResult });
      const reason: FailureReason = { type: "wrong", userInput: newBuffer };
      return { state: { type: "failed", challenge, reason }, effects };
    }

    case "SKIP": {
      if (state.type !== "prompt" && state.type !== "listening") {
        return { state, effects };
      }
      const challenge = state.challenge;
      const reason: FailureReason = { type: "skipped" };
      return { state: { type: "failed", challenge, reason }, effects };
    }

    case "SEQUENCE_TIMEOUT": {
      if (state.type !== "listening") {
        return { state, effects };
      }
      return { state: { type: "prompt", challenge: state.challenge }, effects };
    }

    case "NEXT_CHALLENGE":
      return { state: { type: "loading" }, effects };

    case "EXIT_TO_MENU":
      return { state: { type: "toolSelect" }, effects };

    default:
      return { state, effects };
  }
}