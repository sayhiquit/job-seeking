import type { AnalysisRecord, AppState } from "./types";

export function buildLocalDataExportPayload(
  state: AppState,
  records: AnalysisRecord[],
  exportedAt = new Date().toISOString()
) {
  return {
    state: {
      ...state,
      aiConfig: {
        ...state.aiConfig,
        apiKey: ""
      }
    },
    records,
    exportedAt,
    note: "AI API Key has been removed from this export."
  };
}
