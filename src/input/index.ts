import type { Key, KeyChord, Modifier } from "@/types";

const KEY_MAP: Record<string, Key> = {
  "arrowup": "up",
  "arrowdown": "down",
  "arrowleft": "left",
  "arrowright": "right",
  " ": "space",
  "return": "enter",
  "esc": "escape",
  "del": "delete",
};

const VALID_KEYS = new Set<string>([
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
  "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "enter", "escape", "tab", "space", "backspace", "delete",
  "up", "down", "left", "right",
  "home", "end", "pageup", "pagedown",
  "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12",
  "[", "]", "\\", ";", "'", ",", ".", "/", "`", "-", "=",
  "+", "*", "^", "$", "%", "#", "@", "!", "~",
]);

export function normalizeKey(rawKey: string): Key | null {
  const lower = rawKey.toLowerCase();
  const mapped = KEY_MAP[lower] ?? lower;
  if (VALID_KEYS.has(mapped)) {
    return mapped as Key;
  }
  return null;
}

export function extractModifiers(event: KeyboardEvent): Modifier[] {
  const modifiers: Modifier[] = [];
  if (event.ctrlKey) modifiers.push("ctrl");
  if (event.shiftKey) modifiers.push("shift");
  if (event.altKey) modifiers.push("alt");
  if (event.metaKey) modifiers.push("meta");
  return modifiers.sort();
}

export function parseKeyboardEvent(event: KeyboardEvent): KeyChord | null {
  const key = normalizeKey(event.key);
  if (!key) return null;
  
  const modifiers = extractModifiers(event);
  
  if (["control", "shift", "alt", "meta"].includes(event.key.toLowerCase())) {
    return null;
  }
  
  return { modifiers, key };
}

export function normalizeModifiers(modifiers: Modifier[]): Modifier[] {
  return [...modifiers].sort();
}

export function chordsEqual(a: KeyChord, b: KeyChord): boolean {
  if (a.key !== b.key) return false;
  const aMods = normalizeModifiers(a.modifiers);
  const bMods = normalizeModifiers(b.modifiers);
  if (aMods.length !== bMods.length) return false;
  return aMods.every((mod, i) => mod === bMods[i]);
}

export function sequenceMatches(input: KeyChord[], target: KeyChord[]): "none" | "partial" | "complete" {
  if (input.length === 0) return "none";
  if (input.length > target.length) return "none";
  
  for (let i = 0; i < input.length; i++) {
    if (!chordsEqual(input[i], target[i])) {
      return "none";
    }
  }
  
  return input.length === target.length ? "complete" : "partial";
}

export function formatChord(chord: KeyChord): string {
  const parts: string[] = [];
  
  if (chord.modifiers.includes("ctrl")) parts.push("Ctrl");
  if (chord.modifiers.includes("alt")) parts.push("Alt");
  if (chord.modifiers.includes("shift")) parts.push("Shift");
  if (chord.modifiers.includes("meta")) parts.push("⌘");
  
  const keyDisplay = chord.key === "space" ? "Space" :
    chord.key === "enter" ? "Enter" :
    chord.key === "escape" ? "Esc" :
    chord.key === "tab" ? "Tab" :
    chord.key === "backspace" ? "Backspace" :
    chord.key === "delete" ? "Del" :
    chord.key === "up" ? "↑" :
    chord.key === "down" ? "↓" :
    chord.key === "left" ? "←" :
    chord.key === "right" ? "→" :
    chord.key.length === 1 ? chord.key.toUpperCase() :
    chord.key.toUpperCase();
  
  parts.push(keyDisplay);
  
  return parts.join("+");
}

export function formatSequence(sequence: KeyChord[]): string {
  return sequence.map(formatChord).join(" → ");
}

export type InputManager = {
  handleKeyDown: (event: KeyboardEvent) => void;
  getBuffer: () => KeyChord[];
  resetBuffer: () => void;
  destroy: () => void;
};

export function createInputManager(
  onInput: (chord: KeyChord, buffer: KeyChord[]) => void,
  options: { timeout: number } = { timeout: 1000 }
): InputManager {
  let buffer: KeyChord[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  const resetBuffer = () => {
    buffer = [];
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  const handleKeyDown = (event: KeyboardEvent) => {
    const chord = parseKeyboardEvent(event);
    if (!chord) return;
    
    // Prevent browser/OS default actions and stop propagation
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    buffer.push(chord);
    onInput(chord, [...buffer]);
    
    timeoutId = setTimeout(() => {
      resetBuffer();
    }, options.timeout);
  };
  
  return {
    handleKeyDown,
    getBuffer: () => [...buffer],
    resetBuffer,
    destroy: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    },
  };
}