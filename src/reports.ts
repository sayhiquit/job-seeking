import { analyzeCandidateBatch, analyzeRecruiterJob, buildActionPlan, buildDecisionPath, buildDiagnosticInsights, calculateMatch } from "./analysis";
import { buildKnowledgeContext } from "./knowledge";
import { buildStudentPlanItems } from "./plans";
import type { AppState } from "./types";

export function buildLocalReport(
  state: AppState,
  match: ReturnType<typeof calculateMatch>,
  decisionPath: ReturnType<typeof buildDecisionPath>,
  optimizedResume: string,
  knowledge: ReturnType<typeof buildKnowledgeContext>,
  diagnosticInsights: ReturnType<typeof buildDiagnosticInsights>,
  actionPlan: ReturnType<typeof buildActionPlan>
) {
  const studentPlan = state.detailMode === "student" ? buildStudentPlanItems(state, decisionPath) : null;
  return [
    `一、最终路径：${decisionPath.title}`,
    decisionPath.verdict,
    `下一步动作：${decisionPath.primaryAction}`,
    "",
    `参考分数：${match.total}/100`,
    `参考等级：${match.level}`,
    `工作风格：${match.personality.description}`,
    `目标明确度：${state.careerIntent.clarity}`,
    `核心诉求：${formatChoiceText(state.careerIntent.mainGoal)}`,
    `期望/最低收入：${state.careerIntent.expectedIncome}`,
    `不能接受：${formatChoiceText(state.careerIntent.bottomLine)}`,
    "",
    "二、百分比诊断依据",
    ...diagnosticInsights.possibilities.flatMap((item) => [
      `【${item.label}】${item.score}/100`,
      `- 说明：${item.summary}`,
      `- 影响因素：${item.influencedBy.join("；")}`,
      `- 判断原因：${item.why.join("；")}`,
      `- 下一步：${item.doNext.join("；")}`
    ]),
    ...(diagnosticInsights.confidenceWarnings.length
      ? ["", "置信度提醒", ...diagnosticInsights.confidenceWarnings.map((item) => `- ${item}`)]
      : []),
    "",
    "三、做这个岗位/方向的优势",
    ...decisionPath.advantages.map((item) => `- ${item}`),
    "",
    "四、做这个岗位/方向的风险",
    ...decisionPath.risks.map((item) => `- ${item}`),
    "",
    "五、如果坚持做这个岗位，需要这样提升",
    ...decisionPath.ifInsist.map((item) => `- ${item}`),
    "",
    "六、如果换方向，更适合先投这些",
    ...decisionPath.alternatives.map((item) => `- ${item}`),
    "",
    ...(studentPlan
      ? [
          "七、学生/应届专属建议",
          "可直接尝试：",
          ...studentPlan.directRoles.map((item) => `- ${item}`),
          "需要先补作品后再冲：",
          ...studentPlan.portfolioRoles.map((item) => `- ${item}`),
          "不建议现在硬冲：",
          ...studentPlan.riskyRoles.map((item) => `- ${item}`),
          "45 天补强路线：",
          ...studentPlan.timeline.map((item) => `- ${item}`),
          ""
        ]
      : []),
    studentPlan ? "八、行动计划" : "七、行动计划",
    "今天：",
    ...actionPlan.today.map((item) => `- ${item}`),
    "本周：",
    ...actionPlan.week.map((item) => `- ${item}`),
    "30 天：",
    ...actionPlan.month.map((item) => `- ${item}`),
    "停止硬冲规则：",
    ...actionPlan.stopRules.map((item) => `- ${item}`),
    "",
    studentPlan ? "九、简历应该按什么策略改" : "八、简历应该按什么策略改",
    decisionPath.resumeStrategy,
    ...decisionPath.resumeFocus.map((item) => `- ${item}`),
    "",
    studentPlan ? "十、城市机会判断" : "九、城市机会判断",
    knowledge.targetCity
      ? `目标城市 ${state.targetJob.city}：优势行业 ${knowledge.targetCity.strongIndustries.join("、")}；适合岗位 ${knowledge.targetCity.suitableRoles.join("、")}。`
      : "暂无目标城市库数据，建议用 AI 结合岗位、行业和当前城市继续分析。",
    "",
    studentPlan ? "十一、简历优化建议" : "十、简历优化建议",
    optimizedResume
  ].join("\n");
}

export function formatChoiceText(value: string) {
  return value ? value.split("||").filter(Boolean).join("、") : "未填写";
}

export function buildRecruiterReport(analysis: ReturnType<typeof analyzeRecruiterJob>, candidateBatch: ReturnType<typeof analyzeCandidateBatch>) {
  return [
    "一、人才画像",
    ...analysis.mustHave.map((item) => `- ${item}`),
    "",
    "二、加分项",
    ...analysis.niceToHave.map((item) => `- ${item}`),
    "",
    "三、招聘风险",
    ...analysis.risks.map((item) => `- ${item}`),
    "",
    "四、检索关键词",
    ...analysis.searchKeywords.map((item) => `- ${item}`),
    "",
    "五、面试追问",
    ...analysis.interviewQuestions.map((item) => `- ${item}`),
    "",
    "六、批量简历筛选",
    buildCandidateBatchReport(candidateBatch),
    "",
    "七、优化后的 JD",
    analysis.improvedJd
  ].join("\n");
}

export function buildCandidateBatchReport(candidates: ReturnType<typeof analyzeCandidateBatch>) {
  if (!candidates.length) return "尚未粘贴候选人简历。";
  return candidates
    .map((candidate, index) =>
      [
        `${index + 1}. ${candidate.name}｜${candidate.score}/100｜${candidate.decision}`,
        `摘要：${candidate.summary}`,
        `匹配点：${candidate.strengths.join("；")}`,
        `风险点：${candidate.risks.join("；")}`,
        `建议追问：${candidate.questions.join("；")}`
      ].join("\n")
    )
    .join("\n\n");
}

export function parseAiSections(text: string) {
  const targets = [
    "一句话结论",
    "为什么不是简单问 AI",
    "现在最该做什么",
    "为什么现在可能不适合",
    "如果坚持这个岗位，先补什么",
    "更适合的岗位和城市",
    "简历和投递打法"
  ];
  const normalized = text.replace(/\r\n/g, "\n");
  const matches: { title: string; index: number; end: number }[] = [];

  for (const title of targets) {
    const patterns = [
      new RegExp(`(?:^|\\n)\\s*(?:[一二三四五六七八九十]+[、.．])?\\s*${escapeRegExp(title)}\\s*[:：]?`, "i"),
      new RegExp(`(?:^|\\n)\\s*#{1,4}\\s*${escapeRegExp(title)}\\s*`, "i")
    ];
    for (const pattern of patterns) {
      const match = pattern.exec(normalized);
      if (match) {
        matches.push({ title, index: match.index, end: match.index + match[0].length });
        break;
      }
    }
  }

  const sorted = matches.sort((a, b) => a.index - b.index);
  if (!sorted.length) {
    return [{ title: "AI 综合分析", content: text.trim() }];
  }

  return sorted.map((section, index) => {
    const next = sorted[index + 1]?.index ?? normalized.length;
    const content = normalized.slice(section.end, next).trim().replace(/\n{3,}/g, "\n\n");
    return { title: section.title, content: content || "AI 未单独展开这一部分，请查看原文。" };
  });
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
