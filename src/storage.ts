import { invoke } from "@tauri-apps/api/core";
import { defaultState } from "./data";
import { buildLocalDataExportPayload } from "./dataExport";
import { buildLocalDataFileName } from "./reportExport";
import type { AnalysisRecord, AppState } from "./types";

const KEY = "jobfit-assistant-state";
const RECORDS_KEY = "jobfit-assistant-analysis-records";
const CHANGELOG_SEEN_KEY = "jobfit-assistant-seen-changelog-version";

const isTauri = () => "__TAURI_INTERNALS__" in window;

async function loadDefaultAiConfig(): Promise<Partial<AppState["aiConfig"]>> {
  try {
    if (isTauri()) {
      const raw = await invoke<string>("load_default_ai_config");
      return raw ? JSON.parse(raw) : {};
    }
  } catch (error) {
    console.warn("Default AI config is not available", error);
  }
  return {};
}

function mergeLoadedState(loaded: Partial<AppState>): AppState {
  const merged = { ...defaultState, ...loaded };
  const loadedAi = loaded.aiConfig || {};
  return {
    ...merged,
    aiConfig: { ...defaultState.aiConfig, ...loadedAi }
  };
}

function applyDefaultAiConfig(state: AppState, defaults: Partial<AppState["aiConfig"]>): AppState {
  if (state.aiConfig.apiKey.trim() || !defaults.apiKey?.trim()) return state;
  return {
    ...state,
    aiConfig: {
      ...state.aiConfig,
      apiKey: defaults.apiKey,
      baseUrl: state.aiConfig.baseUrl || defaults.baseUrl || defaultState.aiConfig.baseUrl,
      model: state.aiConfig.model || defaults.model || defaultState.aiConfig.model
    }
  };
}

function parseState(raw: string | null): AppState {
  if (!raw) return defaultState;
  try {
    return mergeLoadedState(JSON.parse(raw));
  } catch (error) {
    console.warn("Saved state is not readable; using defaults", error);
    return defaultState;
  }
}

function parseRecords(raw: string | null): AnalysisRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Saved analysis records are not readable; using empty history", error);
    return [];
  }
}

function parseRecord(raw: string): AnalysisRecord | null {
  try {
    return JSON.parse(raw) as AnalysisRecord;
  } catch (error) {
    console.warn("Saved analysis record is not readable; skipping it", error);
    return null;
  }
}

export async function loadState(): Promise<AppState> {
  try {
    if (isTauri()) {
      const raw = await invoke<string | null>("load_state");
      const defaults = await loadDefaultAiConfig();
      return applyDefaultAiConfig(parseState(raw), defaults);
    }
  } catch (error) {
    console.warn("Falling back to localStorage", error);
  }

  const raw = localStorage.getItem(KEY);
  return parseState(raw);
}

export async function saveState(state: AppState): Promise<void> {
  const raw = JSON.stringify(state);
  try {
    if (isTauri()) {
      await invoke("save_state", { raw });
      return;
    }
  } catch (error) {
    console.warn("Falling back to localStorage", error);
  }

  localStorage.setItem(KEY, raw);
}

export async function saveAnalysisRecord(record: AnalysisRecord): Promise<void> {
  try {
    if (isTauri()) {
      await invoke("save_analysis_record", { raw: JSON.stringify(record) });
      return;
    }
  } catch (error) {
    console.warn("Falling back to localStorage records", error);
  }

  const records = await loadAnalysisRecords();
  localStorage.setItem(RECORDS_KEY, JSON.stringify([record, ...records].slice(0, 50)));
}

export async function loadAnalysisRecords(): Promise<AnalysisRecord[]> {
  try {
    if (isTauri()) {
      const raw = await invoke<string[]>("load_analysis_records");
      return raw
        .map(parseRecord)
        .filter((record): record is AnalysisRecord => Boolean(record));
    }
  } catch (error) {
    console.warn("Falling back to localStorage records", error);
  }

  const raw = localStorage.getItem(RECORDS_KEY);
  return parseRecords(raw);
}

export async function clearState(): Promise<void> {
  try {
    if (isTauri()) {
      await invoke("clear_state");
      return;
    }
  } catch (error) {
    console.warn("Falling back to localStorage clear state", error);
  }

  localStorage.removeItem(KEY);
}

export async function clearAnalysisRecords(): Promise<void> {
  try {
    if (isTauri()) {
      await invoke("clear_analysis_records");
      return;
    }
  } catch (error) {
    console.warn("Falling back to localStorage clear records", error);
  }

  localStorage.removeItem(RECORDS_KEY);
}

export function exportLocalData(state: AppState, records: AnalysisRecord[]) {
  const blob = new Blob([JSON.stringify(buildLocalDataExportPayload(state, records), null, 2)], {
    type: "application/json;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildLocalDataFileName();
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function loadSeenChangelogVersion() {
  return localStorage.getItem(CHANGELOG_SEEN_KEY) || "";
}

export function saveSeenChangelogVersion(version: string) {
  localStorage.setItem(CHANGELOG_SEEN_KEY, version);
}
