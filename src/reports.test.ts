import { describe, expect, it } from "vitest";
import { analyzeCandidateBatch, analyzeRecruiterJob, buildActionPlan, buildDecisionPath, buildDiagnosticInsights, calculateMatch, optimizeResume } from "./analysis";
import { defaultState } from "./data";
import { buildKnowledgeContext } from "./knowledge";
import { buildCandidateBatchReport, buildLocalReport, buildRecruiterReport, formatChoiceText, parseAiSections } from "./reports";

describe("report helpers", () => {
  it("formats multi-choice answers and blanks", () => {
    expect(formatChoiceText("稳定||离家近")).toBe("稳定、离家近");
    expect(formatChoiceText("")).toBe("未填写");
  });

  it("parses fixed AI report sections and falls back for unstructured text", () => {
    const sections = parseAiSections(`一、一句话结论：先补证据再投递

二、为什么不是简单问 AI：需要结合真实经历

三、现在最该做什么：补一个项目案例`);

    expect(sections.map((section) => section.title)).toEqual([
      "一句话结论",
      "为什么不是简单问 AI",
      "现在最该做什么"
    ]);
    expect(parseAiSections("自由文本")[0].title).toBe("AI 综合分析");
  });

  it("builds a jobseeker report with local diagnosis anchors", () => {
    const match = calculateMatch(defaultState);
    const decisionPath = buildDecisionPath(defaultState, match);
    const report = buildLocalReport(
      defaultState,
      match,
      decisionPath,
      optimizeResume(defaultState),
      buildKnowledgeContext(defaultState),
      buildDiagnosticInsights(defaultState, match),
      buildActionPlan(defaultState, match)
    );

    expect(report).toContain(decisionPath.title);
    expect(report).toContain("参考分数");
    expect(report).toContain("行动计划");
  });

  it("builds recruiter reports even without candidate resumes", () => {
    const emptyCandidateState = {
      ...defaultState,
      recruiterJob: {
        ...defaultState.recruiterJob,
        candidateResume: ""
      }
    };
    const analysis = analyzeRecruiterJob(emptyCandidateState);
    const candidates = analyzeCandidateBatch(emptyCandidateState);

    expect(buildCandidateBatchReport(candidates)).toContain("尚未粘贴候选人简历");
    expect(buildRecruiterReport(analysis, candidates)).toContain("优化后");
  });
});
