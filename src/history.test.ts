import { describe, expect, it } from "vitest";
import { filterHistoryRecords } from "./history";
import type { AnalysisRecord } from "./types";

const records: AnalysisRecord[] = [
  {
    id: "1",
    role: "jobseeker",
    title: "用户运营求职诊断",
    mode: "deep",
    score: 82,
    level: "较匹配",
    summary: "建议优化简历证据",
    raw: "目标岗位：用户运营",
    createdAt: "2026-07-07"
  },
  {
    id: "2",
    role: "recruiter",
    title: "客服主管招聘分析",
    mode: "quick",
    summary: "候选人需要电话初筛",
    raw: "岗位：客服主管",
    createdAt: "2026-07-06"
  }
];

describe("history helpers", () => {
  it("filters by role", () => {
    expect(filterHistoryRecords(records, { role: "jobseeker" }).map((record) => record.id)).toEqual(["1"]);
    expect(filterHistoryRecords(records, { role: "recruiter" }).map((record) => record.id)).toEqual(["2"]);
  });

  it("searches title, summary and raw report text", () => {
    expect(filterHistoryRecords(records, { query: "简历" }).map((record) => record.id)).toEqual(["1"]);
    expect(filterHistoryRecords(records, { query: "客服主管" }).map((record) => record.id)).toEqual(["2"]);
  });
});
