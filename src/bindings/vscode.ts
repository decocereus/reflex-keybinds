import type { ToolDefinition, Binding, KeyChord, Modifier, Key, CategoryId } from "@/types";

function parseKey(keyStr: string): { modifiers: Modifier[]; key: Key } {
  const parts = keyStr.toLowerCase().split("+");
  const modifiers: Modifier[] = [];
  let key = "";

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed === "cmd" || trimmed === "meta") {
      modifiers.push("meta");
    } else if (trimmed === "ctrl" || trimmed === "control") {
      modifiers.push("ctrl");
    } else if (trimmed === "alt" || trimmed === "option") {
      modifiers.push("alt");
    } else if (trimmed === "shift") {
      modifiers.push("shift");
    } else {
      key = trimmed;
    }
  }

  const keyMap: Record<string, Key> = {
    escape: "escape",
    enter: "enter",
    space: "space",
    tab: "tab",
    backspace: "backspace",
    delete: "delete",
    up: "up",
    down: "down",
    left: "left",
    right: "right",
    pageup: "pageup",
    pagedown: "pagedown",
    home: "home",
    end: "end",
    "`": "`",
    "-": "-",
    "=": "=",
    "[": "[",
    "]": "]",
    "\\": "\\",
    ";": ";",
    "'": "'",
    ",": ",",
    ".": ".",
    "/": "/",
    "numpad0": "0",
  };

  const finalKey = (keyMap[key] || key) as Key;

  return { modifiers, key: finalKey };
}

function parseKeySequence(keyStr: string): KeyChord[] {
  const parts = keyStr.split(" ").filter(p => p.trim());
  return parts.map(part => parseKey(part));
}

type RawBinding = {
  key: string;
  command: string;
  when?: string;
  categoryOverride?: CategoryId;
};

const rawBindings: RawBinding[] = [
  // Essential navigation
  { key: "cmd+p", command: "workbench.action.quickOpen" },
  { key: "ctrl+g", command: "workbench.action.gotoLine" },
  { key: "shift+cmd+o", command: "workbench.action.gotoSymbol" },
  { key: "cmd+t", command: "workbench.action.showAllSymbols" },
  { key: "f12", command: "editor.action.revealDefinition", when: "editorHasDefinitionProvider" },
  { key: "shift+f12", command: "editor.action.goToReferences", when: "editorHasReferenceProvider" },
  { key: "ctrl+-", command: "workbench.action.navigateBack", when: "canNavigateBack" },
  { key: "ctrl+shift+-", command: "workbench.action.navigateForward", when: "canNavigateForward" },
  { key: "cmd+r cmd+q", command: "workbench.action.navigateToLastEditLocation" },
  { key: "shift+cmd+\\", command: "editor.action.jumpToBracket", when: "editorTextFocus" },

  // Search & Replace
  { key: "cmd+f", command: "actions.find", when: "editorFocus" },
  { key: "shift+cmd+f", command: "workbench.action.findInFiles" },
  { key: "alt+cmd+f", command: "editor.action.startFindReplaceAction", when: "editorFocus" },
  { key: "shift+cmd+h", command: "workbench.action.replaceInFiles" },
  { key: "cmd+d", command: "editor.action.addSelectionToNextFindMatch", when: "editorFocus" },
  { key: "shift+cmd+l", command: "editor.action.selectHighlights", when: "editorFocus" },
  { key: "cmd+g", command: "editor.action.nextMatchFindAction", when: "editorFocus" },
  { key: "shift+cmd+g", command: "editor.action.previousMatchFindAction", when: "editorFocus" },

  // Editing powerhouse
  { key: "alt+down", command: "editor.action.moveLinesDownAction", when: "editorTextFocus" },
  { key: "alt+up", command: "editor.action.moveLinesUpAction", when: "editorTextFocus" },
  { key: "shift+alt+down", command: "editor.action.copyLinesDownAction", when: "editorTextFocus" },
  { key: "shift+alt+up", command: "editor.action.copyLinesUpAction", when: "editorTextFocus" },
  { key: "shift+cmd+k", command: "editor.action.deleteLines", when: "textInputFocus" },
  { key: "cmd+enter", command: "editor.action.insertLineAfter", when: "editorTextFocus" },
  { key: "shift+cmd+enter", command: "editor.action.insertLineBefore", when: "editorTextFocus" },
  { key: "cmd+/", command: "editor.action.commentLine", when: "editorTextFocus" },
  { key: "shift+alt+a", command: "editor.action.blockComment", when: "editorTextFocus" },
  { key: "cmd+]", command: "editor.action.indentLines", when: "editorTextFocus" },
  { key: "cmd+[", command: "editor.action.outdentLines", when: "editorTextFocus" },
  { key: "shift+alt+f", command: "editor.action.formatDocument", when: "editorTextFocus" },
  { key: "ctrl+j", command: "editor.action.joinLines", when: "editorTextFocus" },

  // Multi-cursor
  { key: "alt+cmd+up", command: "editor.action.insertCursorAbove", when: "editorTextFocus" },
  { key: "alt+cmd+down", command: "editor.action.insertCursorBelow", when: "editorTextFocus" },
  { key: "shift+alt+i", command: "editor.action.insertCursorAtEndOfEachLineSelected", when: "editorTextFocus" },

  // Refactoring & Code Actions
  { key: "f2", command: "editor.action.rename", when: "editorHasRenameProvider" },
  { key: "cmd+.", command: "editor.action.quickFix", when: "editorHasCodeActionsProvider" },
  { key: "ctrl+shift+r", command: "editor.action.refactor", when: "editorHasCodeActionsProvider" },

  // Editor management
  { key: "cmd+w", command: "workbench.action.closeActiveEditor" },
  { key: "cmd+\\", command: "workbench.action.splitEditor" },
  { key: "shift+cmd+]", command: "workbench.action.nextEditor" },
  { key: "shift+cmd+[", command: "workbench.action.previousEditor" },
  { key: "cmd+1", command: "workbench.action.focusFirstEditorGroup" },
  { key: "cmd+2", command: "workbench.action.focusSecondEditorGroup" },
  { key: "cmd+3", command: "workbench.action.focusThirdEditorGroup" },
  { key: "shift+cmd+t", command: "workbench.action.reopenClosedEditor" },

  // Panel & Sidebar
  { key: "cmd+b", command: "workbench.action.toggleSidebarVisibility" },
  { key: "cmd+j", command: "workbench.action.togglePanel" },
  { key: "ctrl+`", command: "workbench.action.terminal.toggleTerminal", when: "terminal.active" },
  { key: "ctrl+shift+`", command: "workbench.action.terminal.new", when: "terminalProcessSupported" },
  { key: "shift+cmd+e", command: "workbench.view.explorer" },
  { key: "ctrl+shift+g", command: "workbench.view.scm", when: "workbench.scm.active" },
  { key: "shift+cmd+m", command: "workbench.actions.view.problems", when: "workbench.panel.markers.view.active" },
  { key: "shift+cmd+u", command: "workbench.action.output.toggleOutput", when: "workbench.panel.output.active" },

  // Commands & Settings
  { key: "shift+cmd+p", command: "workbench.action.showCommands" },
  { key: "cmd+,", command: "workbench.action.openSettings" },
  { key: "cmd+r cmd+s", command: "workbench.action.openGlobalKeybindings" },

  // File operations
  { key: "cmd+s", command: "workbench.action.files.save" },
  { key: "cmd+n", command: "workbench.action.files.newUntitledFile" },

  // IntelliSense
  { key: "ctrl+space", command: "editor.action.triggerSuggest", when: "editorHasCompletionItemProvider" },
  { key: "shift+cmd+space", command: "editor.action.triggerParameterHints", when: "editorHasSignatureHelpProvider" },

  // Code folding
  { key: "alt+cmd+[", command: "editor.fold", when: "editorTextFocus" },
  { key: "alt+cmd+]", command: "editor.unfold", when: "editorTextFocus" },
  { key: "cmd+r cmd+0", command: "editor.foldAll", when: "editorTextFocus" },
  { key: "cmd+r cmd+j", command: "editor.unfoldAll", when: "editorTextFocus" },

  // Debug
  { key: "f5", command: "workbench.action.debug.start", when: "debuggersAvailable" },
  { key: "f9", command: "editor.debug.action.toggleBreakpoint", when: "debuggersAvailable" },
  { key: "f10", command: "workbench.action.debug.stepOver", when: "debugState == 'stopped'" },
  { key: "f11", command: "workbench.action.debug.stepInto", when: "debugState != 'inactive'" },
  { key: "shift+f11", command: "workbench.action.debug.stepOut", when: "debugState == 'stopped'" },

  // AI features (Cursor specific)
  { key: "cmd+k", command: "aipopup.action.modal.generate", when: "editorFocus" },
  { key: "cmd+l", command: "aichat.newchataction" },
  { key: "cmd+i", command: "composer.startComposerPrompt" },
];

function categorizeCommand(command: string): CategoryId {
  if (command.includes("cursor") || command.includes("navigate") || command.includes("goto") || command.includes("scroll")) return "navigation";
  if (command.includes("find") || command.includes("search") || command.includes("replace")) return "search";
  if (command.includes("delete") || command.includes("copy") || command.includes("cut") || command.includes("paste") || command.includes("undo") || command.includes("redo") || command.includes("comment") || command.includes("indent") || command.includes("format") || command.includes("fold") || command.includes("unfold") || command.includes("Line") || command.includes("insert")) return "edit";
  if (command.includes("debug") || command.includes("breakpoint")) return "debug";
  if (command.includes("terminal")) return "terminal";
  if (command.includes("editor") || command.includes("split") || command.includes("close") || command.includes("focus")) return "editor";
  if (command.includes("view") || command.includes("sidebar") || command.includes("panel") || command.includes("zoom") || command.includes("toggle")) return "view";
  if (command.includes("file") || command.includes("save") || command.includes("open")) return "file";
  if (command.includes("suggest") || command.includes("snippet") || command.includes("trigger")) return "intellisense";
  if (command.includes("refactor") || command.includes("rename") || command.includes("quickFix")) return "refactor";
  if (command.includes("composer") || command.includes("chat") || command.includes("ai")) return "ai";
  return "general";
}

function getDifficulty(sequence: KeyChord[]): 1 | 2 | 3 | 4 | 5 {
  if (sequence.length > 1) return 3;
  const chord = sequence[0];
  const modCount = chord.modifiers.length;
  if (modCount === 0) return 1;
  if (modCount === 1) return 1;
  if (modCount === 2) return 2;
  return 3;
}

function humanizeCommand(command: string): string {
  const parts = command.split(".");
  const lastPart = parts[parts.length - 1];
  const words = lastPart
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .toLowerCase()
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const seenIds = new Set<string>();
const bindings: Binding[] = rawBindings
  .filter(b => {
    const seq = parseKeySequence(b.key);
    return seq.length > 0 && seq.every(c => c.key);
  })
  .map((b, i) => {
    const sequence = parseKeySequence(b.key);
    let id = `vscode-${b.command.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`;
    if (seenIds.has(id)) {
      id = `${id}-${i}`;
    }
    seenIds.add(id);
    
    const inferredCategory = categorizeCommand(b.command);
    
    return {
      id,
      tool: "vscode" as const,
      actionId: b.command,
      action: humanizeCommand(b.command),
      sequence,
      category: b.categoryOverride ?? inferredCategory,
      categoryOverride: b.categoryOverride,
      difficulty: getDifficulty(sequence),
    };
  });

export const vscode: ToolDefinition = {
  id: "vscode",
  name: "VS Code (Cursor)",
  bindings,
  difficultyCurve: {
    warmup: 10,
    mastery: 80,
  },
};