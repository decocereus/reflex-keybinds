import type { ToolDefinition, Binding, KeyChord, Modifier, Key } from "@/types";

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

const rawBindings: Array<{ key: string; command: string; when?: string }> = [
  { key: "escape escape", command: "workbench.action.exitZenMode", when: "inZenMode" },
  { key: "cmd+down", command: "cursorBottom", when: "textInputFocus" },
  { key: "shift+cmd+down", command: "cursorBottomSelect", when: "textInputFocus" },
  { key: "ctrl+n", command: "cursorDown", when: "textInputFocus" },
  { key: "down", command: "cursorDown", when: "textInputFocus" },
  { key: "cmd+right", command: "cursorEnd", when: "textInputFocus" },
  { key: "end", command: "cursorEnd", when: "textInputFocus" },
  { key: "cmd+left", command: "cursorHome", when: "textInputFocus" },
  { key: "home", command: "cursorHome", when: "textInputFocus" },
  { key: "ctrl+b", command: "cursorLeft", when: "textInputFocus" },
  { key: "left", command: "cursorLeft", when: "textInputFocus" },
  { key: "ctrl+f", command: "cursorRight", when: "textInputFocus" },
  { key: "right", command: "cursorRight", when: "textInputFocus" },
  { key: "cmd+up", command: "cursorTop", when: "textInputFocus" },
  { key: "ctrl+p", command: "cursorUp", when: "textInputFocus" },
  { key: "up", command: "cursorUp", when: "textInputFocus" },
  { key: "backspace", command: "deleteLeft", when: "textInputFocus" },
  { key: "delete", command: "deleteRight", when: "textInputFocus" },
  { key: "cmd+a", command: "editor.action.selectAll" },
  { key: "cmd+c", command: "execCopy" },
  { key: "cmd+x", command: "execCut" },
  { key: "cmd+v", command: "execPaste" },
  { key: "shift+cmd+z", command: "redo" },
  { key: "cmd+z", command: "undo" },
  { key: "cmd+f", command: "actions.find", when: "editorFocus" },
  { key: "cmd+e", command: "actions.findWithSelection" },
  { key: "cmd+u", command: "cursorUndo", when: "textInputFocus" },
  { key: "alt+right", command: "cursorWordEndRight", when: "textInputFocus" },
  { key: "alt+left", command: "cursorWordLeft", when: "textInputFocus" },
  { key: "cmd+backspace", command: "deleteAllLeft", when: "textInputFocus" },
  { key: "ctrl+k", command: "deleteAllRight", when: "textInputFocus" },
  { key: "alt+backspace", command: "deleteWordLeft", when: "textInputFocus" },
  { key: "alt+delete", command: "deleteWordRight", when: "textInputFocus" },
  { key: "cmd+r cmd+c", command: "editor.action.addCommentLine", when: "editorTextFocus" },
  { key: "cmd+d", command: "editor.action.addSelectionToNextFindMatch", when: "editorFocus" },
  { key: "shift+alt+a", command: "editor.action.blockComment", when: "editorTextFocus" },
  { key: "cmd+f2", command: "editor.action.changeAll", when: "editorTextFocus" },
  { key: "cmd+c", command: "editor.action.clipboardCopyAction" },
  { key: "cmd+x", command: "editor.action.clipboardCutAction" },
  { key: "cmd+v", command: "editor.action.clipboardPasteAction" },
  { key: "cmd+/", command: "editor.action.commentLine", when: "editorTextFocus" },
  { key: "shift+alt+down", command: "editor.action.copyLinesDownAction", when: "editorTextFocus" },
  { key: "shift+alt+up", command: "editor.action.copyLinesUpAction", when: "editorTextFocus" },
  { key: "shift+cmd+k", command: "editor.action.deleteLines", when: "textInputFocus" },
  { key: "shift+alt+f", command: "editor.action.formatDocument", when: "editorTextFocus" },
  { key: "cmd+f12", command: "editor.action.goToImplementation", when: "editorHasImplementationProvider" },
  { key: "shift+f12", command: "editor.action.goToReferences", when: "editorHasReferenceProvider" },
  { key: "cmd+]", command: "editor.action.indentLines", when: "editorTextFocus" },
  { key: "alt+cmd+up", command: "editor.action.insertCursorAbove", when: "editorTextFocus" },
  { key: "shift+alt+i", command: "editor.action.insertCursorAtEndOfEachLineSelected", when: "editorTextFocus" },
  { key: "alt+cmd+down", command: "editor.action.insertCursorBelow", when: "editorTextFocus" },
  { key: "cmd+enter", command: "editor.action.insertLineAfter", when: "editorTextFocus" },
  { key: "shift+cmd+enter", command: "editor.action.insertLineBefore", when: "editorTextFocus" },
  { key: "ctrl+j", command: "editor.action.joinLines", when: "editorTextFocus" },
  { key: "shift+cmd+\\", command: "editor.action.jumpToBracket", when: "editorTextFocus" },
  { key: "alt+f8", command: "editor.action.marker.next", when: "editorFocus" },
  { key: "f8", command: "editor.action.marker.nextInFiles", when: "editorFocus" },
  { key: "shift+alt+f8", command: "editor.action.marker.prev", when: "editorFocus" },
  { key: "shift+f8", command: "editor.action.marker.prevInFiles", when: "editorFocus" },
  { key: "alt+down", command: "editor.action.moveLinesDownAction", when: "editorTextFocus" },
  { key: "alt+up", command: "editor.action.moveLinesUpAction", when: "editorTextFocus" },
  { key: "f3", command: "editor.action.nextMatchFindAction", when: "editorFocus" },
  { key: "cmd+g", command: "editor.action.nextMatchFindAction", when: "editorFocus" },
  { key: "cmd+[", command: "editor.action.outdentLines", when: "editorTextFocus" },
  { key: "alt+f12", command: "editor.action.peekDefinition", when: "editorHasDefinitionProvider" },
  { key: "shift+f3", command: "editor.action.previousMatchFindAction", when: "editorFocus" },
  { key: "shift+cmd+g", command: "editor.action.previousMatchFindAction", when: "editorFocus" },
  { key: "cmd+.", command: "editor.action.quickFix", when: "editorHasCodeActionsProvider" },
  { key: "ctrl+shift+r", command: "editor.action.refactor", when: "editorHasCodeActionsProvider" },
  { key: "f2", command: "editor.action.rename", when: "editorHasRenameProvider" },
  { key: "f12", command: "editor.action.revealDefinition", when: "editorHasDefinitionProvider" },
  { key: "shift+cmd+l", command: "editor.action.selectHighlights", when: "editorFocus" },
  { key: "cmd+r cmd+i", command: "editor.action.showHover", when: "editorTextFocus" },
  { key: "ctrl+shift+right", command: "editor.action.smartSelect.expand", when: "editorTextFocus" },
  { key: "ctrl+shift+left", command: "editor.action.smartSelect.shrink", when: "editorTextFocus" },
  { key: "alt+cmd+f", command: "editor.action.startFindReplaceAction", when: "editorFocus" },
  { key: "alt+z", command: "editor.action.toggleWordWrap" },
  { key: "ctrl+t", command: "editor.action.transposeLetters", when: "textInputFocus" },
  { key: "shift+cmd+space", command: "editor.action.triggerParameterHints", when: "editorHasSignatureHelpProvider" },
  { key: "cmd+i", command: "editor.action.triggerSuggest", when: "editorHasCompletionItemProvider" },
  { key: "ctrl+space", command: "editor.action.triggerSuggest", when: "editorHasCompletionItemProvider" },
  { key: "alt+cmd+[", command: "editor.fold", when: "editorTextFocus" },
  { key: "cmd+r cmd+0", command: "editor.foldAll", when: "editorTextFocus" },
  { key: "cmd+r cmd+j", command: "editor.unfoldAll", when: "editorTextFocus" },
  { key: "alt+cmd+]", command: "editor.unfold", when: "editorTextFocus" },
  { key: "f9", command: "editor.debug.action.toggleBreakpoint", when: "debuggersAvailable" },
  { key: "shift+cmd+;", command: "breadcrumbs.focus", when: "breadcrumbsPossible" },
  { key: "shift+cmd+.", command: "breadcrumbs.focusAndSelect", when: "breadcrumbsPossible" },
  { key: "alt+cmd+c", command: "copyFilePath", when: "!editorFocus" },
  { key: "shift+alt+cmd+c", command: "copyRelativeFilePath", when: "!editorFocus" },
  { key: "cmd+w", command: "workbench.action.closeActiveEditor" },
  { key: "cmd+r cmd+w", command: "workbench.action.closeAllEditors" },
  { key: "cmd+r f", command: "workbench.action.closeFolder", when: "workbenchState != 'empty'" },
  { key: "shift+cmd+w", command: "workbench.action.closeWindow" },
  { key: "shift+f5", command: "workbench.action.debug.disconnect", when: "inDebugMode" },
  { key: "shift+cmd+f5", command: "workbench.action.debug.restart", when: "inDebugMode" },
  { key: "ctrl+f5", command: "workbench.action.debug.run", when: "debuggersAvailable" },
  { key: "f5", command: "workbench.action.debug.start", when: "debuggersAvailable" },
  { key: "shift+f11", command: "workbench.action.debug.stepOut", when: "debugState == 'stopped'" },
  { key: "f10", command: "workbench.action.debug.stepOver", when: "debugState == 'stopped'" },
  { key: "shift+f5", command: "workbench.action.debug.stop", when: "inDebugMode" },
  { key: "f11", command: "workbench.action.debug.stepInto", when: "debugState != 'inactive'" },
  { key: "cmd+r m", command: "workbench.action.editor.changeLanguageMode" },
  { key: "cmd+r p", command: "workbench.action.files.copyPathOfActiveFile" },
  { key: "cmd+n", command: "workbench.action.files.newUntitledFile" },
  { key: "cmd+o", command: "workbench.action.files.openFileFolder", when: "isMacNative" },
  { key: "cmd+r r", command: "workbench.action.files.revealActiveFileInWindows" },
  { key: "cmd+s", command: "workbench.action.files.save" },
  { key: "shift+cmd+s", command: "workbench.action.files.saveAs" },
  { key: "cmd+r s", command: "workbench.action.files.saveWithoutFormatting" },
  { key: "shift+cmd+f", command: "workbench.action.findInFiles" },
  { key: "cmd+8", command: "workbench.action.focusEighthEditorGroup" },
  { key: "cmd+5", command: "workbench.action.focusFifthEditorGroup" },
  { key: "cmd+1", command: "workbench.action.focusFirstEditorGroup" },
  { key: "cmd+4", command: "workbench.action.focusFourthEditorGroup" },
  { key: "cmd+2", command: "workbench.action.focusSecondEditorGroup" },
  { key: "cmd+7", command: "workbench.action.focusSeventhEditorGroup" },
  { key: "cmd+0", command: "workbench.action.focusSideBar" },
  { key: "cmd+6", command: "workbench.action.focusSixthEditorGroup" },
  { key: "cmd+3", command: "workbench.action.focusThirdEditorGroup" },
  { key: "ctrl+g", command: "workbench.action.gotoLine" },
  { key: "shift+cmd+o", command: "workbench.action.gotoSymbol" },
  { key: "ctrl+-", command: "workbench.action.navigateBack", when: "canNavigateBack" },
  { key: "ctrl+shift+-", command: "workbench.action.navigateForward", when: "canNavigateForward" },
  { key: "cmd+r cmd+q", command: "workbench.action.navigateToLastEditLocation" },
  { key: "shift+cmd+n", command: "workbench.action.newWindow" },
  { key: "shift+cmd+]", command: "workbench.action.nextEditor" },
  { key: "alt+cmd+right", command: "workbench.action.nextEditor" },
  { key: "shift+cmd+[", command: "workbench.action.previousEditor" },
  { key: "alt+cmd+left", command: "workbench.action.previousEditor" },
  { key: "cmd+r cmd+s", command: "workbench.action.openGlobalKeybindings" },
  { key: "ctrl+r", command: "workbench.action.openRecent" },
  { key: "cmd+,", command: "workbench.action.openSettings" },
  { key: "shift+cmd+u", command: "workbench.action.output.toggleOutput", when: "workbench.panel.output.active" },
  { key: "cmd+p", command: "workbench.action.quickOpen" },
  { key: "shift+cmd+t", command: "workbench.action.reopenClosedEditor" },
  { key: "shift+cmd+h", command: "workbench.action.replaceInFiles" },
  { key: "cmd+r cmd+t", command: "workbench.action.selectTheme" },
  { key: "alt+cmd+tab", command: "workbench.action.showAllEditors" },
  { key: "cmd+t", command: "workbench.action.showAllSymbols" },
  { key: "f1", command: "workbench.action.showCommands" },
  { key: "shift+cmd+p", command: "workbench.action.showCommands" },
  { key: "cmd+\\", command: "workbench.action.splitEditor" },
  { key: "cmd+r cmd+\\", command: "workbench.action.splitEditorOrthogonal" },
  { key: "shift+cmd+b", command: "workbench.action.tasks.build", when: "taskCommandsRegistered" },
  { key: "ctrl+`", command: "workbench.action.terminal.toggleTerminal", when: "terminal.active" },
  { key: "ctrl+shift+`", command: "workbench.action.terminal.new", when: "terminalProcessSupported" },
  { key: "alt+cmd+b", command: "workbench.action.toggleAuxiliaryBar" },
  { key: "alt+cmd+0", command: "workbench.action.toggleEditorGroupLayout" },
  { key: "ctrl+cmd+f", command: "workbench.action.toggleFullScreen" },
  { key: "cmd+j", command: "workbench.action.togglePanel" },
  { key: "cmd+b", command: "workbench.action.toggleSidebarVisibility" },
  { key: "cmd+r z", command: "workbench.action.toggleZenMode" },
  { key: "cmd+=", command: "workbench.action.zoomIn" },
  { key: "cmd+-", command: "workbench.action.zoomOut" },
  { key: "cmd+numpad0", command: "workbench.action.zoomReset" },
  { key: "shift+cmd+m", command: "workbench.actions.view.problems", when: "workbench.panel.markers.view.active" },
  { key: "shift+cmd+d", command: "workbench.view.debug" },
  { key: "shift+cmd+e", command: "workbench.view.explorer" },
  { key: "shift+cmd+x", command: "workbench.view.extensions" },
  { key: "ctrl+shift+g", command: "workbench.view.scm", when: "workbench.scm.active" },
  { key: "cmd+l", command: "aichat.newchataction" },
  { key: "shift+cmd+i", command: "composer.newAgentChat" },
  { key: "cmd+i", command: "composer.startComposerPrompt" },
  { key: "cmd+k", command: "aipopup.action.modal.generate", when: "editorFocus" },
  { key: "shift+cmd+k", command: "aipopup.action.modal.generate", when: "editorFocus" },
  { key: "tab", command: "acceptSelectedSuggestion", when: "suggestWidgetHasFocusedSuggestion" },
  { key: "enter", command: "acceptSelectedSuggestion", when: "suggestWidgetHasFocusedSuggestion" },
  { key: "tab", command: "jumpToNextSnippetPlaceholder", when: "hasNextTabstop" },
  { key: "shift+tab", command: "jumpToPrevSnippetPlaceholder", when: "hasPrevTabstop" },
  { key: "escape", command: "hideSuggestWidget", when: "suggestWidgetVisible" },
  { key: "escape", command: "leaveSnippet", when: "inSnippetMode" },
  { key: "escape", command: "closeFindWidget", when: "findWidgetVisible" },
  { key: "alt+cmd+enter", command: "editor.action.replaceAll", when: "findWidgetVisible" },
  { key: "shift+cmd+1", command: "editor.action.replaceOne", when: "findWidgetVisible" },
  { key: "alt+enter", command: "editor.action.selectAllMatches", when: "findWidgetVisible" },
  { key: "alt+cmd+c", command: "toggleFindCaseSensitive", when: "editorFocus" },
  { key: "alt+cmd+r", command: "toggleFindRegex", when: "editorFocus" },
  { key: "alt+cmd+w", command: "toggleFindWholeWord", when: "editorFocus" },
];

function categorizeCommand(command: string): string {
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
    return {
      id,
      tool: "vscode" as const,
      action: humanizeCommand(b.command),
      sequence,
      category: categorizeCommand(b.command),
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