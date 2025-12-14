import type { ToolDefinition, ToolId } from "@/types";
import { vim } from "./vim";
import { vscode } from "./vscode";
import { tmux } from "./tmux";

const tools: Record<ToolId, ToolDefinition> = {
  vim,
  vscode,
  tmux,
};

export function getTool(id: ToolId): ToolDefinition | undefined {
  return tools[id];
}

export function getAllTools(): ToolDefinition[] {
  return Object.values(tools);
}

export function getToolIds(): ToolId[] {
  return Object.keys(tools);
}

export { vim, vscode, tmux };