import { describe, expect, it } from "vitest";
import { extractFieldValue, parseResumeImportPreview } from "./resumeImport";

describe("resume import helpers", () => {
  it("extracts common resume fields from pasted text", () => {
    const preview = parseResumeImportPreview(`姓名：张三
当前城市：杭州
目标岗位：用户运营
期望薪资：10-12k
工作年限：3年
学历：本科

工作经历：负责社群活动和用户反馈，活动参与率提升27%。
项目复盘：沉淀用户分层标签和转化数据。`);

    expect(preview.fields.map((field) => field.label)).toEqual([
      "姓名",
      "当前城市",
      "目标岗位",
      "期望薪资",
      "工作年限",
      "学历"
    ]);
    expect(preview.sections.some((section) => section.title === "工作经历")).toBe(true);
    expect(preview.missing).not.toContain("缺少量化结果");
  });

  it("supports colon and dash field separators", () => {
    expect(extractFieldValue("城市-上海", ["城市"])).toBe("上海");
    expect(extractFieldValue("name: Alice", ["name"])).toBe("Alice");
  });
});
