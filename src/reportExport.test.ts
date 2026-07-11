import { describe, expect, it } from "vitest";
import { buildLocalDataFileName, buildReportFileName, formatReportDateStamp } from "./reportExport";

describe("report export helpers", () => {
  it("formats stable date stamps for exported files", () => {
    expect(formatReportDateStamp(new Date(2026, 6, 9, 8, 5))).toBe("20260709-0805");
  });

  it("builds role-specific report filenames", () => {
    const date = new Date(2026, 6, 9, 8, 5);

    expect(buildReportFileName("jobseeker", date)).toBe("求职诊断报告-20260709-0805.txt");
    expect(buildReportFileName("recruiter", date)).toBe("招聘需求分析-20260709-0805.txt");
  });

  it("builds timestamped local data filenames", () => {
    expect(buildLocalDataFileName(new Date(2026, 6, 10, 17, 8))).toBe("职配助手本地数据-20260710-1708.json");
  });
});
