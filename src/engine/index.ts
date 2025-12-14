import type {
  ToolDefinition,
  Binding,
  Challenge,
  Result,
  KeyChord,
  MasteryRecord,
  GameMode,
  ContextRule,
  GameSettings,
  ChallengeUIHints,
} from "@/types";
import { sequenceMatches } from "@/input";
import { getMasteryScore } from "@/state";

export { matchSequence, matchWithAmbiguity, computeUIHints, transition } from "./core";
export type { EngineEvent, Effect, EngineResult } from "./core";

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function selectBinding(
  tool: ToolDefinition,
  mastery: Record<string, MasteryRecord>,
  mode: GameMode,
  currentModeId?: string
): Binding {
  let candidates = tool.bindings;
  
  if (currentModeId && tool.modes) {
    candidates = candidates.filter(
      (b) => !b.mode || b.mode === currentModeId
    );
  }
  
  if (candidates.length === 0) {
    candidates = tool.bindings;
  }
  
  const scored = candidates.map((binding) => {
    const record = mastery[binding.id];
    const masteryScore = record ? getMasteryScore(record) : 0;
    
    const difficultyWeight = 1 / binding.difficulty;
    const weaknessWeight = 1 - masteryScore;
    const recencyWeight = record
      ? Math.min(1, (Date.now() - record.lastSeen) / (24 * 60 * 60 * 1000))
      : 1;
    
    const score = difficultyWeight * 0.2 + weaknessWeight * 0.5 + recencyWeight * 0.3;
    
    return { binding, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  
  const topCount = Math.min(5, scored.length);
  const topCandidates = scored.slice(0, topCount);
  const randomIndex = Math.floor(Math.random() * topCandidates.length);
  
  return topCandidates[randomIndex].binding;
}

function computeUIHintsForChallenge(mode: GameMode, settings: GameSettings): ChallengeUIHints {
  const showBinding = mode === "scenario" || settings.assistMode;
  return {
    showBinding,
    showHint: settings.assistMode && mode === "reflex",
    instructionText: mode === "scenario"
      ? "keybinding to learn"
      : settings.assistMode
        ? "hint"
        : undefined,
  };
}

export function createChallenge(
  binding: Binding,
  mode: GameMode,
  settings: GameSettings = { assistMode: false, reducedMotion: false, sequenceTimeout: 1500, challengeTimeout: null },
  timestamp: number = Date.now()
): Challenge {
  const prompt = mode === "reflex"
    ? binding.action
    : generateScenarioPrompt(binding);
  
  return {
    id: generateId(),
    binding,
    prompt,
    context: mode === "scenario" ? generateContext(binding) : undefined,
    startTimestamp: timestamp,
    uiHints: computeUIHintsForChallenge(mode, settings),
  };
}

function generateScenarioPrompt(binding: Binding): string {
  const scenarios: Record<string, string[]> = {
    motion: [
      "Move to the target position",
      "Navigate to the specified location",
      "Reach the destination",
    ],
    edit: [
      "Modify the text as needed",
      "Apply the required change",
      "Transform the content",
    ],
    search: [
      "Locate the pattern",
      "Find the target",
      "Search for the match",
    ],
    mode: [
      "Switch to the appropriate mode",
      "Enter the required state",
      "Change the editing mode",
    ],
    file: [
      "Perform the file operation",
      "Execute the file action",
    ],
    navigation: [
      "Navigate to the target",
      "Jump to the location",
    ],
    view: [
      "Adjust the view",
      "Change the display",
    ],
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

export function evaluateInput(
  challenge: Challenge,
  inputSequence: KeyChord[]
): "none" | "partial" | "complete" {
  return sequenceMatches(inputSequence, challenge.binding.sequence);
}

export function createResult(
  challenge: Challenge,
  inputSequence: KeyChord[],
  success: boolean,
  timestamp: number = Date.now()
): Result {
  return {
    challengeId: challenge.id,
    bindingId: challenge.binding.id,
    reactionMs: timestamp - challenge.startTimestamp,
    success,
    inputSequence,
  };
}

export function evaluateContext(
  binding: Binding,
  context: Record<string, unknown>
): boolean {
  if (!binding.context || binding.context.length === 0) {
    return true;
  }
  
  return binding.context.every((rule) => evaluateContextRule(rule, context));
}

function evaluateContextRule(
  rule: ContextRule,
  context: Record<string, unknown>
): boolean {
  switch (rule.type) {
    case "mode":
      return context.mode === rule.value;
    case "cursor":
      return context.cursorPosition === rule.value;
    case "selection":
      return rule.value === "active" ? !!context.hasSelection : !context.hasSelection;
    case "windows":
      return typeof context.windowCount === "number" && context.windowCount >= rule.min;
    case "fileState":
      return rule.value === "dirty" ? !!context.isDirty : !context.isDirty;
    default:
      return true;
  }
}

export function findOverlappingBindings(
  tool: ToolDefinition,
  binding: Binding
): Binding[] {
  return tool.bindings.filter((b) => {
    if (b.id === binding.id) return false;
    
    const minLength = Math.min(b.sequence.length, binding.sequence.length);
    for (let i = 0; i < minLength; i++) {
      const matchResult = sequenceMatches(
        binding.sequence.slice(0, i + 1),
        b.sequence
      );
      if (matchResult === "partial" || matchResult === "complete") {
        return true;
      }
    }
    
    return false;
  });
}

export function getBindingsByCategory(
  tool: ToolDefinition
): Record<string, Binding[]> {
  const grouped: Record<string, Binding[]> = {};
  
  for (const binding of tool.bindings) {
    const category = binding.categoryOverride ?? binding.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(binding);
  }
  
  return grouped;
}

export function getBindingsByDifficulty(
  tool: ToolDefinition,
  difficulty: 1 | 2 | 3 | 4 | 5
): Binding[] {
  return tool.bindings.filter((b) => b.difficulty === difficulty);
}