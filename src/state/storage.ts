import type { PersistedState, GameSettings, MasteryRecord } from "@/types";
import { loadState, saveState } from "./index";

export type StorageAPI = {
  load: () => PersistedState;
  save: (state: PersistedState) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  getMastery: (bindingId: string) => MasteryRecord | undefined;
  clearAll: () => void;
};

export function createStorage(): StorageAPI {
  let cached: PersistedState | null = null;
  
  const load = (): PersistedState => {
    if (!cached) {
      cached = loadState();
    }
    return cached;
  };
  
  const save = (state: PersistedState): void => {
    cached = state;
    saveState(state);
  };
  
  const updateSettings = (settings: Partial<GameSettings>): void => {
    const current = load();
    save({
      ...current,
      settings: {
        ...current.settings,
        ...settings,
      },
    });
  };
  
  const getMastery = (bindingId: string): MasteryRecord | undefined => {
    return load().mastery[bindingId];
  };
  
  const clearAll = (): void => {
    cached = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("keybind-trainer-state");
    }
  };
  
  return {
    load,
    save,
    updateSettings,
    getMastery,
    clearAll,
  };
}

export const storage = createStorage();
