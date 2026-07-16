import { describe, expect, it } from "vitest";
import { defaultState } from "./data";
import { buildLocalDataExportPayload } from "./dataExport";
import type { AnalysisRecord } from "./types";

describe("local data export", () => {
  it("removes AI API Key while preserving non-sensitive AI settings", () => {
    const payload = buildLocalDataExportPayload(
      {
        ...defaultState,
        aiConfig: {
          apiKey: "sk-private-key",
          baseUrl: "https://api.example.com/v1",
          model: "example-model",
          allowSensitiveAi: true
        }
      },
      [],
      "2026-07-14T09:00:00.000Z"
    );

    expect(payload.state.aiConfig.apiKey).toBe("");
    expect(payload.state.aiConfig.baseUrl).toBe("https://api.example.com/v1");
    expect(payload.state.aiConfig.model).toBe("example-model");
    expect(payload.state.aiConfig.allowSensitiveAi).toBe(true);
    expect(payload.exportedAt).toBe("2026-07-14T09:00:00.000Z");
  });

  it("keeps analysis records in exported backups", () => {
    const records: AnalysisRecord[] = [
      {
        id: "record-1",
        role: "jobseeker",
        title: "求职诊断",
        mode: "quick",
        summary: "建议先补简历证据",
        raw: "完整报告",
        createdAt: "2026-07-14"
      }
    ];

    const payload = buildLocalDataExportPayload(defaultState, records, "2026-07-14T09:00:00.000Z");

    expect(payload.records).toEqual(records);
    expect(payload.note).toContain("AI API Key");
  });
});
