import { describe, expect, it } from "vitest";
import { buildDecisionPath, calculateMatch } from "./analysis";
import { defaultState } from "./data";
import { buildAiPossibilities, evaluateAiResultQuality, toAdviceItems } from "./aiResult";
import { buildKnowledgeContext } from "./knowledge";

describe("AI result helpers", () => {
  it("flags missing required AI sections", () => {
    const issues = evaluateAiResultQuality({
      一句话结论: "可以先验证岗位方向"
    });

    expect(issues.some((issue) => issue.includes("缺少关键模块"))).toBe(true);
  });

  it("keeps advice items concise after markdown cleanup", () => {
    expect(toAdviceItems("- **先补项目证据**\n- 改简历标题\n- 小批量投递")).toEqual([
      "先补项目证据",
      "改简历标题",
      "小批量投递"
    ]);
  });

  it("builds bounded possibility scores from local and AI evidence", () => {
    const match = calculateMatch(defaultState);
    const decisionPath = buildDecisionPath(defaultState, match);
    const knowledge = buildKnowledgeContext(defaultState);
    const possibilities = buildAiPossibilities(defaultState, match, decisionPath, knowledge, {
      一句话结论: "建议先补简历证据，再小批量投递。",
      现在最该做什么: "补一个作品或案例。",
      简历和投递打法: "重写简历标题，筛选岗位后投递。"
    });

    expect(possibilities).toHaveLength(6);
    expect(possibilities[0].label).toContain("目标岗位");
    expect(possibilities.every((item) => item.value >= 8 && item.value <= 96)).toBe(true);
  });
});
