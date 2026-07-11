import { assessmentQuestions, defaultState } from "./data";
import { extractResumeEvidence, findCityOpportunity, findJobCapability } from "./knowledge";
import type { AppState, Assessment } from "./types";

const clamp = (score: number) => Math.max(0, Math.min(100, Math.round(score)));
const dimensions = ["communication", "stability", "pressure", "detail", "learning", "result"] as const;
type Dimension = (typeof dimensions)[number];

const dimensionLabel: Record<Dimension, string> = {
  communication: "沟通协作",
  stability: "稳定执行",
  pressure: "抗压推进",
  detail: "细节质量",
  learning: "学习成长",
  result: "结果导向"
};

const keywordGroups = {
  communication: ["沟通", "协作", "客户", "用户", "跨部门", "谈判", "服务"],
  data: ["数据", "分析", "指标", "复盘", "报表", "转化", "增长"],
  execution: ["执行", "推进", "落地", "跟进", "项目", "活动"],
  sales: ["销售", "客户", "成交", "渠道", "商务", "业绩"],
  tech: ["开发", "测试", "系统", "代码", "数据库", "算法", "接口"],
  management: ["管理", "团队", "统筹", "负责人", "主管", "带人", "培训", "绩效"],
  intensity: ["加班", "出差", "抗压", "高压", "倒班", "驻场", "外派", "强执行"]
};

function textScore(source: string, words: string[]) {
  return words.reduce((sum, word) => sum + (source.includes(word) ? 1 : 0), 0);
}

function parseExperienceYears(value: string) {
  if (value.includes("无经验") || value.includes("应届")) return 0;
  if (value.includes("1年以内")) return 0.5;
  const numbers = value.match(/\d+/g)?.map(Number) || [];
  if (numbers.length >= 2) return (numbers[0] + numbers[1]) / 2;
  return numbers[0] || Number.parseFloat(value) || 0;
}

function splitChoices(value: string) {
  return value.split("||").map((item) => item.trim()).filter(Boolean);
}

function targetIsUnclear(state: AppState) {
  return (
    !state.targetJob.role ||
    state.targetJob.role.includes("不确定") ||
    state.careerIntent.clarity.includes("还不明确") ||
    state.careerIntent.clarity.includes("犹豫")
  );
}

function learningPlanLabel(value: string) {
  if (value.includes("2小时") || value.includes("集中") || value.includes("脱产")) return "可走作品/证书/项目补强路线";
  if (value.includes("1小时")) return "适合每天 1 小时做小作品和案例复盘";
  if (value.includes("30分钟") || value.includes("几乎")) return "补强要压缩到最关键证据，不建议跨度太大";
  return "先用小任务验证学习投入，再决定是否冲刺";
}

export function buildDiagnosticInsights(state: AppState, match = calculateMatch(state)) {
  const capability = findJobCapability(targetIsUnclear(state) ? match.alternativeRoles[0] || state.targetJob.industry : state.targetJob.role);
  const evidence = extractResumeEvidence(state, capability);
  const currentCity = findCityOpportunity(state.profile.city);
  const targetCity = findCityOpportunity(state.targetJob.city);
  const intent = `${state.careerIntent.mainGoal} ${state.careerIntent.bottomLine} ${state.careerIntent.preferredWorkStyle} ${state.careerIntent.jobSearchObstacle}`;
  const careOrFamily = /带娃|孩子|老人|照顾|家庭|单亲|接送|离异/.test(`${state.profile.familyContext} ${state.profile.hasCareDuty}`);
  const cityBlocked = state.profile.canRelocate.includes("不") || state.careerIntent.cityPreference.includes("只留当前");
  const managementRisk = (state.targetJob.managementLevel.includes("管理") || state.profile.wantsManagement.includes("管理")) && match.assessment.communication < 60;
  const needsEvidence = evidence.missingEvidence.length > 0 || evidence.quantifiedResults.length === 0;
  const targetUnclear = targetIsUnclear(state);
  const targetRole = targetUnclear ? capability.role : state.targetJob.role;

  const possibilities = [
    {
      id: "target-fit",
      label: targetUnclear ? "先定方向可能性" : "目标岗位胜任可能性",
      score: match.total,
      tone: match.total >= 78 ? "good" : match.total >= 60 ? "warn" : "risk",
      summary: targetUnclear ? "目标还没锁死，分数代表当前信息能否收敛出可行方向。" : `围绕 ${targetRole} 的综合可投递概率。`,
      influencedBy: [
        `岗位/目标：${targetUnclear ? "目标不明确，按方向探索处理" : targetRole}`,
        `经历证据：${evidence.quantifiedResults.length ? evidence.quantifiedResults.slice(0, 2).join("、") : "缺少可量化结果"}`,
        `工作风格：${match.personality.type}，沟通${match.assessment.communication}，结果${match.assessment.result}`,
        `现实约束：${careOrFamily ? "有家庭/照护约束" : "未发现强家庭约束"}`
      ],
      why: [
        match.level,
        match.risks[0],
        needsEvidence ? "关键问题不是会不会做，而是简历能不能证明你做过相邻事情。" : "已有证据可以支撑投递，重点是把表达贴近 JD。"
      ],
      doNext: match.total >= 70 ? ["先优化简历第一屏", "投递同类岗位 10-20 个验证反馈", "准备 2 个岗位相关案例"] : ["先补 1 个关键证据", "从相邻/过渡岗位小批量投递", "用招聘软件对比 5 个 JD 再决定是否硬冲"]
    },
    {
      id: "resume-proof",
      label: "简历证据可信度",
      score: match.parts.find((item) => item.label === "简历表达")?.score || 0,
      tone: evidence.quantifiedResults.length >= 2 ? "good" : evidence.quantifiedResults.length ? "warn" : "risk",
      summary: "判断简历是否能让面试官相信你不是只写职责。",
      influencedBy: [
        evidence.quantifiedResults.length ? `量化结果：${evidence.quantifiedResults.slice(0, 3).join("、")}` : "没有识别到量化结果",
        evidence.projectSignals.length ? `项目/交付信号：${evidence.projectSignals.slice(0, 4).join("、")}` : "项目/交付信号不足",
        evidence.dataSignals.length ? `数据复盘信号：${evidence.dataSignals.slice(0, 4).join("、")}` : "数据复盘信号不足",
        `缺失证据：${evidence.missingEvidence.slice(0, 3).join("、") || "暂无明显缺失"}`
      ],
      why: [
        needsEvidence ? "简历还像经历罗列，缺少能被追问的证据。" : "简历已经有可用素材，可以进入定向改写。",
        "本项主要受简历文本、量化结果、项目案例、岗位关键词影响。",
        "如果这一项低，优先改简历，不要先怀疑自己完全不适合。"
      ],
      doNext: [
        `补一个${capability.proofExamples[0] || "岗位相关"}案例`,
        "每段经历补规模、周期、动作、结果四个要素",
        "把参与/协助改成个人动作边界，避免夸大"
      ]
    },
    {
      id: "style-reality",
      label: "性格与现实稳定性",
      score: match.parts.find((item) => item.label === "现实约束")?.score || 0,
      tone: match.risks.some((item) => /家庭|加班|出差|跨城市|收入/.test(item)) ? "warn" : "good",
      summary: "判断这个岗位长期做下去会不会和性格、家庭、通勤、强度冲突。",
      influencedBy: [
        `沟通协作：${match.assessment.communication}`,
        `抗压推进：${match.assessment.pressure}`,
        `家庭/照护：${state.profile.familyContext || state.profile.hasCareDuty}`,
        `底线条件：${splitChoices(state.careerIntent.bottomLine).slice(0, 3).join("、") || "未填写"}`
      ],
      why: [
        managementRisk ? "你想管人或岗位偏管理，但沟通协作分偏低，直接上管理岗风险大。" : "管理/沟通目前不是最强硬冲突。",
        careOrFamily ? "有照护或家庭责任时，高强度、长通勤、频繁出差要提前排除。" : "暂未发现强现实约束，但仍要确认加班、通勤和薪资结构。",
        intent.includes("稳定") || intent.includes("通勤") ? "你填的主要目标偏稳定/通勤友好，岗位选择要比薪资上限更重要。" : "当前诉求没有只偏稳定，可以保留一定冲刺空间。"
      ],
      doNext: [
        "投递前先看作息、通勤、出差、薪资结构",
        "面试中直接确认试用期强度和汇报方式",
        managementRisk ? "先从项目协调/资深执行切入，再补带人证据" : "准备一个沟通协作案例证明风格匹配"
      ]
    },
    {
      id: "city-path",
      label: "城市机会判断",
      score: match.parts.find((item) => item.label === "岗位方向")?.score || 0,
      tone: cityBlocked && state.targetJob.city && state.targetJob.city !== state.profile.city ? "risk" : targetCity ? "good" : "neutral",
      summary: "判断是否值得换城市，以及更适合在哪类城市找哪类岗位。",
      influencedBy: [
        `当前城市：${state.profile.city || "未填写"}`,
        `目标城市：${state.targetJob.city || "未填写"}`,
        currentCity ? `当前城市适合：${currentCity.suitableRoles.slice(0, 4).join("、")}` : "当前城市暂无本地库数据",
        targetCity ? `目标城市适合：${targetCity.suitableRoles.slice(0, 4).join("、")}` : "目标城市暂无本地库数据"
      ],
      why: [
        cityBlocked && state.targetJob.city && state.targetJob.city !== state.profile.city ? "你当前不太能跨城市，目标城市再好也不能直接作为主路线。" : "城市选择仍有弹性，可以用岗位机会和生活成本一起判断。",
        currentCity ? `${currentCity.city} 更适合先验证这些方向：${currentCity.suitableRoles.slice(0, 3).join("、")}。` : "缺少当前城市库数据，建议用招聘软件按关键词验证。",
        targetCity ? `${targetCity.city} 的注意点：${targetCity.cautions.slice(0, 2).join("、")}。` : "目标城市不明确时，不建议先为了城市迁移。"
      ],
      doNext: [
        "在招聘软件分别搜索当前城市和目标城市的同一岗位",
        "只对比真实 JD、薪资、通勤和加班，不看城市想象",
        cityBlocked ? "优先当前城市/远程/同城过渡岗位" : "如果目标城市岗位质量明显更高，再考虑迁移"
      ]
    },
    {
      id: "growth-path",
      label: "30天补强可行性",
      score: Math.min(100, Math.max(35, Math.round((match.assessment.learning + match.assessment.result + (needsEvidence ? 45 : 70)) / 3))),
      tone: match.assessment.learning >= 75 ? "good" : match.assessment.learning >= 55 ? "warn" : "risk",
      summary: "判断你能不能通过短期补作品、案例、证书或试岗任务靠近岗位。",
      influencedBy: [
        `学习成长：${match.assessment.learning}`,
        `结果导向：${match.assessment.result}`,
        `学习时间：${state.careerIntent.learningBudget}`,
        `岗位能力：${capability.coreSkills.slice(0, 4).join("、")}`
      ],
      why: [
        learningPlanLabel(state.careerIntent.learningBudget),
        `目标岗位最该补：${capability.growthPath.slice(0, 2).join("；")}`,
        needsEvidence ? "短期补强要以能放进简历的证据为准，不是泛泛学习。" : "已有证据时，补强重点是面试表达和岗位关键词。"
      ],
      doNext: [
        "7天：拆 5 个真实 JD，整理关键词和缺口",
        `14天：完成一个${capability.proofExamples[0] || "岗位相关"}小作品或复盘`,
        "30天：形成一版目标岗位简历 + 两个面试案例"
      ]
    }
  ];

  return {
    possibilities,
    evidence,
    capability,
    city: { currentCity, targetCity },
    confidenceWarnings: [
      match.confidence !== "较高" ? `当前置信度${match.confidence}，建议补充简历证据、JD 或真实限制后再做最终判断。` : "",
      !state.targetJob.jd && !targetUnclear ? "没有粘贴具体 JD，岗位匹配只能按岗位名和行业粗判。" : "",
      evidence.quantifiedResults.length === 0 ? "简历缺少数字结果，系统会更保守地判断适配度。" : ""
    ].filter(Boolean)
  };
}

export function buildActionPlan(state: AppState, match = calculateMatch(state)) {
  const capability = findJobCapability(targetIsUnclear(state) ? match.alternativeRoles[0] || state.targetJob.industry : state.targetJob.role);
  const evidence = extractResumeEvidence(state, capability);
  return {
    today: [
      "把目标拆成 2-3 个可验证方向，不要只写一个模糊岗位名。",
      `用招聘软件搜索：${[state.targetJob.role, ...match.alternativeRoles].filter(Boolean).slice(0, 4).join(" / ")}。`,
      evidence.quantifiedResults.length ? "把现有数字结果放到简历第一屏和最近一段经历里。" : "先补一个真实数字：人数、金额、周期、效率、转化率或满意度。"
    ],
    week: [
      `完成一个${capability.proofExamples[0] || "岗位相关"}案例，按背景、目标、动作、结果、复盘写清楚。`,
      `把简历改成两版：${targetIsUnclear(state) ? "方向探索版" : state.targetJob.role + "目标岗位版"} + ${match.alternativeRoles[0] || capability.starterRoles[0]}过渡版。`,
      "投递前筛掉违反底线的岗位，例如长期高强度、频繁出差、通勤过长或收入波动过大。"
    ],
    month: [
      `补齐能力链：${capability.growthPath.join("；")}。`,
      "用 20-30 个真实岗位反馈修正方向，而不是只凭一次分析决定职业路线。",
      "沉淀 3 个面试故事：成功案例、压力/失败案例、学习补强案例。"
    ],
    stopRules: [
      "如果连续看 10 个 JD 都要求你完全没有的核心能力，先走过渡岗位。",
      "如果岗位强度正好踩中家庭、通勤、加班、出差底线，不要只靠改简历硬投。",
      "如果补不出任何真实证据，不要把简历包装成已经胜任。"
    ]
  };
}

export function deriveAssessment(state: AppState): Assessment {
  const scores = Object.fromEntries(dimensions.map((key) => [key, [] as number[]])) as Record<Dimension, number[]>;
  for (const question of assessmentQuestions) {
    const value = state.assessmentAnswers?.[question.id] || 3;
    scores[question.dimension as Dimension].push(value);
  }
  const read = (key: Dimension) => {
    const values = scores[key];
    const avg = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 3;
    return clamp(avg * 20);
  };
  return {
    communication: read("communication"),
    stability: read("stability"),
    pressure: read("pressure"),
    detail: read("detail"),
    learning: read("learning"),
    result: read("result")
  };
}

export function personalitySummary(assessment: Assessment) {
  const ranked = dimensions
    .map((key) => ({ key, label: dimensionLabel[key], score: assessment[key] }))
    .sort((a, b) => b.score - a.score);
  const top = ranked.slice(0, 2);
  const low = ranked.slice(-2);
  const type =
    top.some((item) => item.key === "communication") && top.some((item) => item.key === "result")
      ? "目标推进型"
      : top.some((item) => item.key === "detail") && top.some((item) => item.key === "stability")
        ? "稳定交付型"
        : top.some((item) => item.key === "learning")
          ? "学习转化型"
          : "均衡执行型";

  return {
    type,
    top,
    low,
    description: `工作风格更接近“${type}”。优势集中在${top.map((item) => item.label).join("、")}，需要留意${low.map((item) => item.label).join("、")}是否会成为目标岗位短板。`
  };
}

export function calculateMatch(input: AppState) {
  const state: AppState = {
    ...defaultState,
    ...input,
    careerIntent: { ...defaultState.careerIntent, ...input.careerIntent },
    profile: { ...defaultState.profile, ...input.profile, flexibility: input.profile?.flexibility || defaultState.profile.flexibility },
    targetJob: { ...defaultState.targetJob, ...input.targetJob },
    experiences: input.experiences || defaultState.experiences,
    assessmentAnswers: input.assessmentAnswers || defaultState.assessmentAnswers
  };
  const assessment = deriveAssessment(state);
  const experience = parseExperienceYears(state.profile.years);
  const intentText = `${state.careerIntent?.clarity || ""} ${state.careerIntent?.mainGoal || ""} ${state.careerIntent?.bottomLine || ""} ${state.careerIntent?.preferredWorkStyle || ""} ${state.careerIntent?.avoidWork || ""} ${state.careerIntent?.cityPreference || ""}`.toLowerCase();
  const targetUnclear =
    !state.targetJob.role ||
    state.targetJob.role.includes("不确定") ||
    state.careerIntent?.clarity?.includes("还不明确") ||
    state.careerIntent?.clarity?.includes("犹豫");
  const jd = `${state.targetJob.jd} ${targetUnclear ? intentText : ""}`.toLowerCase();
  const resume = `${state.resumeDraft} ${state.experiences.map((item) => item.highlights).join(" ")}`.toLowerCase();
  const allKeywords = Object.values(keywordGroups).flat();
  const jdKeywordCount = allKeywords.filter((word) => jd.includes(word)).length;
  const resumeKeywordCount = allKeywords.filter((word) => resume.includes(word)).length;
  const overlap = allKeywords.filter((word) => jd.includes(word) && resume.includes(word)).length;

  const wantsManagement =
    textScore(`${jd} ${state.targetJob.role}`, keywordGroups.management) > 0 ||
    state.targetJob.managementLevel.includes("带新人") ||
    state.targetJob.managementLevel.includes("管理");
  const needsHighIntensity =
    textScore(jd, keywordGroups.intensity) > 0 ||
    state.targetJob.workIntensity.includes("高强度") ||
    state.targetJob.workIntensity.includes("强销售") ||
    state.targetJob.travelRequirement.includes("频繁") ||
    state.targetJob.travelRequirement.includes("外派");
  const hasFamilyConstraint = /带娃|孩子|老人|照顾|家庭|单亲|接送|离异/.test(state.profile.familyContext);
  const explicitCareDuty = !state.profile.hasCareDuty.includes("无");
  const wantsManage = !state.profile.wantsManagement.includes("不") && !state.profile.wantsManagement.includes("暂时不");
  const cannotRelocate = state.profile.canRelocate.includes("不") || state.profile.canRelocate.includes("暂不");
  const lowOvertime = state.profile.overtimeTolerance.includes("不接受") || state.profile.overtimeTolerance.includes("低");
  const lowTravel = state.profile.travelTolerance.includes("不接受");
  const unstableIncome =
    state.targetJob.incomeStability.includes("波动") ||
    state.targetJob.incomeStability.includes("底薪低") ||
    state.targetJob.incomeStability.includes("降薪");
  const crossCity = Boolean(state.profile.city && state.targetJob.city && state.profile.city !== state.targetJob.city);

  const experienceScore = clamp(45 + Math.min(experience, 8) * 7 + (resume.length > 80 ? 8 : 0));
  const skillScore = clamp(35 + overlap * 7 + resumeKeywordCount * 2);
  const industryScore = clamp(targetUnclear ? 55 : state.targetJob.industry && state.targetJob.role ? 72 : 45);
  const styleNeed = wantsManagement || wantsManage
    ? (assessment.communication + assessment.pressure + assessment.result) / 3
    : textScore(jd, keywordGroups.communication) > 1
      ? assessment.communication
      : textScore(jd, keywordGroups.data) > 1
        ? (assessment.detail + assessment.result) / 2
        : textScore(jd, keywordGroups.execution) > 1
          ? (assessment.stability + assessment.result) / 2
          : (assessment.learning + assessment.stability) / 2;
  const styleScore = clamp(styleNeed);
  const realityScore = clamp(
    78 -
      (state.profile.urgency.includes("尽快") || state.profile.urgency.includes("马上") ? 8 : 0) -
      ((hasFamilyConstraint || explicitCareDuty) && needsHighIntensity ? 18 : 0) -
      (crossCity && (hasFamilyConstraint || explicitCareDuty || cannotRelocate) ? 12 : 0) -
      (needsHighIntensity && (lowOvertime || lowTravel) ? 12 : 0) +
      (state.profile.flexibility.length >= 2 ? 6 : 0)
  );
  const resumeScore = clamp(35 + Math.min(state.resumeDraft.length / 5, 35) + overlap * 4);
  const evidenceCompleteness = clamp(
    (state.resumeDraft.length > 80 ? 22 : 8) +
      (state.careerIntent.mainGoal ? 12 : 0) +
      (state.careerIntent.bottomLine ? 12 : 0) +
      (state.careerIntent.strengths ? 10 : 0) +
      (state.careerIntent.weakPoints ? 10 : 0) +
      (state.targetJob.jd ? 16 : targetUnclear ? 8 : 0) +
      (Object.keys(state.assessmentAnswers || {}).length >= 12 ? 18 : 8)
  );
  let total = clamp(
    experienceScore * 0.24 + skillScore * 0.24 + industryScore * 0.12 + styleScore * 0.16 + realityScore * 0.1 + resumeScore * 0.14
  );
  if (evidenceCompleteness < 45) total = clamp(total * 0.85);
  else if (evidenceCompleteness < 65) total = clamp(total * 0.93);
  const hardConflictCount = [
    (wantsManagement || wantsManage) && assessment.communication < 60,
    (hasFamilyConstraint || explicitCareDuty) && needsHighIntensity,
    crossCity && cannotRelocate,
    needsHighIntensity && lowOvertime,
    needsHighIntensity && lowTravel,
    unstableIncome && (hasFamilyConstraint || explicitCareDuty)
  ].filter(Boolean).length;
  if (hardConflictCount >= 3) total = Math.min(total, 52);
  else if (hardConflictCount === 2) total = Math.min(total, 58);
  else if (hardConflictCount === 1) total = Math.min(total, 64);

  const missingKeywords = allKeywords.filter((word) => jd.includes(word) && !resume.includes(word)).slice(0, 6);
  const alternativeRoles =
    intentText.includes("稳定") || intentText.includes("通勤") || intentText.includes("不加班")
      ? ["行政运营", "客服运营", "教务/班主任", "资料/文员", "门店运营"]
      : intentText.includes("涨薪") || intentText.includes("收入") || intentText.includes("高薪")
        ? ["客户成功", "销售运营", "渠道销售", "电商运营", "项目执行"]
        : state.targetJob.industry === "运营/客服"
      ? ["用户运营助理", "社群运营", "客服运营", "内容运营"]
      : state.targetJob.industry === "销售/市场"
        ? ["销售助理", "渠道销售", "客服转销售", "市场执行"]
        : ["岗位助理", "实施支持", "项目助理", "运营支持"];

  const risks = [
    targetUnclear
      ? "当前目标岗位还不明确，本次更适合先判断可行方向、底线条件和过渡岗位，不建议只围绕单一岗位改简历。"
      : missingKeywords.length
        ? `JD 提到但简历没有体现：${missingKeywords.join("、")}。`
        : "岗位关键词覆盖较好，下一步看案例深度。",
    (wantsManagement || wantsManage) && assessment.communication < 60
      ? "目标岗位包含管理/带人要求，但问卷显示沟通协作偏低，直接做管理岗风险较高。"
      : "工作风格与岗位没有出现明显硬冲突。",
    (hasFamilyConstraint || explicitCareDuty) && needsHighIntensity
      ? "真实情况中存在家庭照顾责任，而 JD 暗示高强度、出差或加班，建议谨慎投递。"
      : hasFamilyConstraint || explicitCareDuty
        ? "存在家庭责任，建议优先筛选通勤、稳定性和工作强度更可控的岗位。"
        : "现实约束信息较少，建议补充后再判断岗位风险。",
    crossCity
      ? cannotRelocate
        ? `目标城市是${state.targetJob.city}，当前城市是${state.profile.city}，但用户暂不考虑跨城市，需要优先评估远程、同城或过渡岗位。`
        : `目标城市是${state.targetJob.city}，当前城市是${state.profile.city}，需要单独评估城市机会、迁移成本和家庭安排。`
      : "当前城市与目标城市一致，城市迁移风险较低。",
    needsHighIntensity && lowOvertime ? "岗位可能存在高强度要求，但用户不接受长期高强度加班，存在明显冲突。" : "加班强度暂未形成明确冲突。",
    needsHighIntensity && lowTravel ? "岗位可能涉及出差或外派，但用户不接受出差，需谨慎。" : "出差要求暂未形成明确冲突。",
    unstableIncome && (hasFamilyConstraint || explicitCareDuty)
      ? "岗位收入稳定性较弱，而用户存在现实责任，建议谨慎选择高波动收入岗位。"
      : "收入稳定性暂未形成明显冲突。",
    state.targetJob.cityOpportunity.includes("核心") || state.targetJob.cityOpportunity.includes("更好")
      ? `系统记录：${state.targetJob.city} 的机会可能更好，AI 需要评估是否值得迁移或远程尝试。`
      : "城市机会暂未提示明显迁移收益。",
    jdKeywordCount > resumeKeywordCount + 3 ? "岗位要求比简历呈现更复杂，可能面试时被追问细节。" : "岗位要求和简历复杂度基本接近。"
  ];

  return {
    total,
    level:
      targetUnclear
        ? "参考：先做方向探索"
        : hardConflictCount >= 3
        ? "参考：暂不推荐"
        : hardConflictCount > 0
          ? "参考：谨慎投递"
          : total >= 82
            ? "参考：高适配"
            : total >= 65
              ? "参考：可冲刺"
              : total >= 48
                ? "参考：需要补强"
                : "参考：不建议直接投递",
    action: targetUnclear
      ? "你还不需要先确定唯一目标。系统会先根据收入诉求、简历经历、工作风格和现实约束，推荐更现实的岗位方向。"
      : "该分数只作为参考，不能代替 AI 对岗位、简历、性格、真实情况和城市机会的综合判断。",
    personality: personalitySummary(assessment),
    assessment,
    parts: [
      { label: "经历证据", score: experienceScore },
      { label: "技能关键词", score: skillScore },
      { label: "岗位方向", score: industryScore },
      { label: "工作风格", score: styleScore },
      { label: "现实约束", score: realityScore },
      { label: "简历表达", score: resumeScore },
      { label: "信息完整", score: evidenceCompleteness }
    ],
    confidence: evidenceCompleteness >= 75 ? "较高" : evidenceCompleteness >= 55 ? "中等" : "偏低",
    strengths: [
      overlap > 2 ? "简历和 JD 有直接重合的能力词，可以围绕这些词做定向投递。" : "已有经历可以转化，但需要更明确地证明和目标岗位有关。",
      assessment.learning >= 75 ? "学习意愿较高，适合通过短项目、作品或证书快速补证据。" : "学习维度中等，建议选择和既有经历更近的岗位，降低转岗成本。",
      assessment.result >= 75 ? "结果导向较强，简历适合用指标、案例和复盘方式呈现。" : "结果表达不足，简历需要补充量化结果。"
    ],
    risks,
    nextSteps:
      targetUnclear
        ? ["先选 2-3 个可行岗位方向做对比，不要只凭感觉定方向", "把简历改成通用能力版：经历、成果、工具、可迁移能力", "用薪资、通勤、强度、稳定性筛掉明显不合适岗位"]
        : total >= 65
        ? ["把简历第一屏改成目标岗位相关能力", "每段经历补 1 个数字结果", "准备 2 个可复述的项目案例"]
        : ["选择一个过渡岗位先投递", "用 2 周补齐一个岗位关键词能力", "做一个小项目或作品来证明能力"],
    alternativeRoles
  };
}

export function buildDecisionPath(state: AppState, match = calculateMatch(state)) {
  const targetUnclear =
    !state.targetJob.role ||
    state.targetJob.role.includes("不确定") ||
    state.careerIntent.clarity.includes("还不明确") ||
    state.careerIntent.clarity.includes("犹豫");
  const hardRisks = match.risks.filter((item) => /明显冲突|谨慎|暂不|不接受|高强度|频繁|收入稳定性较弱|风险较高/.test(item));
  const targetName = targetUnclear ? "目标岗位" : state.targetJob.role;

  if (targetUnclear) {
    return {
      type: "explore" as const,
      title: "先做方向探索，不急着锁死岗位",
      verdict: "你现在最需要的不是马上优化某一个岗位的简历，而是先从收入、城市、强度、优势和底线里筛出 2-3 个现实方向。",
      primaryAction: "先选方向，再做简历版本",
      resumeStrategy: "简历先做成“可迁移能力版”，突出过往经历、量化结果、工具方法和可迁移能力，不要强行包装成某个岗位。",
      ifInsist: [
        "从推荐方向里选一个最想尝试的岗位，再补一份具体 JD 做二次分析。",
        "用 3-5 个真实招聘岗位对比薪资、强度、城市和能力要求。",
        "先投递低风险过渡岗位，观察市场反馈后再收窄目标。"
      ],
      alternatives: match.alternativeRoles,
      advantages: match.strengths,
      risks: hardRisks.length ? hardRisks : match.risks.slice(0, 4),
      nextSteps: match.nextSteps,
      resumeFocus: ["通用能力摘要", "过往成果数字", "可迁移项目案例", "不夸大目标岗位经验"]
    };
  }

  if (match.total >= 78 && hardRisks.length === 0) {
    return {
      type: "direct" as const,
      title: "适配度较高，可以直接投递",
      verdict: `你和“${targetName}”的匹配度较高，当前重点不是换方向，而是把简历改得更像这个岗位需要的人。`,
      primaryAction: "优先优化简历并开始投递",
      resumeStrategy: "简历直接做目标岗位版本：第一屏写目标岗位、核心能力、量化成果，每段经历都贴近 JD 关键词。",
      ifInsist: ["不需要大幅转向，先投 10-20 个同类岗位验证市场反馈。", "面试前准备 3 个和岗位高度相关的案例。", "如果 2 周无回应，再回头补关键词和项目证据。"],
      alternatives: match.alternativeRoles.slice(0, 3),
      advantages: match.strengths,
      risks: match.risks.slice(0, 4),
      nextSteps: ["优化简历第一屏", "把经历改成结果导向表达", "准备目标岗位面试案例"],
      resumeFocus: ["目标岗位标题", "JD 关键词", "量化成果", "面试案例"]
    };
  }

  if (match.total >= 60 && hardRisks.length <= 2) {
    return {
      type: "bridge" as const,
      title: "可以冲刺，但要先补关键证据",
      verdict: `你不是完全不适合“${targetName}”，但现在直接投递容易卡在简历证据、面试案例或现实约束上。`,
      primaryAction: "一边补证据，一边小批量投递",
      resumeStrategy: "简历可以做目标岗位版本，但要诚实呈现可迁移经验；缺的能力用作品、复盘、试岗任务补，不要硬包装。",
      ifInsist: [
        "用 2 周补一个最关键的能力证据。",
        "准备一个能讲清目标、动作、结果、复盘的案例。",
        "先投初级/相邻岗位，别一开始就只投高要求岗位。"
      ],
      alternatives: match.alternativeRoles,
      advantages: match.strengths,
      risks: hardRisks.length ? hardRisks : match.risks.slice(0, 4),
      nextSteps: match.nextSteps,
      resumeFocus: ["可迁移经验", "补证据任务", "过渡岗位关键词", "真实边界"]
    };
  }

  return {
    type: "redirect" as const,
    title: "暂不建议硬投这个岗位",
    verdict: `现在硬投“${targetName}”的成功率和稳定性都偏低，更适合先走过渡岗位或相邻方向。`,
    primaryAction: "先换更稳方向，再逐步靠近目标",
    resumeStrategy: "不要把简历强行包装成目标岗位版本。先做过渡岗位版本，把已有经历转成更容易拿面试的方向。",
    ifInsist: [
      "先补岗位最核心的 1-2 个能力证据，再投递。",
      "接受低一级或相邻岗位切入，降低试错成本。",
      "如果存在城市、加班、出差或收入冲突，先换岗位条件，不要只改简历。"
    ],
    alternatives: match.alternativeRoles,
    advantages: match.strengths,
    risks: hardRisks.length ? hardRisks : match.risks.slice(0, 5),
    nextSteps: match.nextSteps,
    resumeFocus: ["过渡岗位定位", "已有经历复用", "风险规避", "能力补强计划"]
  };
}

export function optimizeResume(state: AppState) {
  const match = calculateMatch(state);
  const title = !state.targetJob.role || state.targetJob.role.includes("不确定") ? "待确定求职方向" : state.targetJob.role;
  const decision = buildDecisionPath(state, match);
  const capability = findJobCapability(title);
  const evidence = extractResumeEvidence(state, capability);
  const core = capability.coreSkills.slice(0, 4).join("、");
  const proofGap = evidence.missingEvidence.length ? evidence.missingEvidence.join("、") : "关键能力证据";
  return [
    `求职目标：${title}`,
    "",
    "要胜任这个岗位，先补齐：",
    `- 核心能力：${capability.coreSkills.slice(0, 5).join("、")}。`,
    `- 证明材料：${capability.proofExamples.slice(0, 5).join("、")}。`,
    `- 过渡入口：${capability.starterRoles.slice(0, 4).join("、")}。`,
    `- 30 天补强：${capability.growthPath.join("；")}。`,
    "",
    "推荐简历标题：",
    `- ${title}｜${state.profile.years || "有"}年${state.targetJob.industry}相关经验｜${state.targetJob.city || state.profile.city}`,
    "",
    "可复制的首屏摘要：",
    `- ${state.profile.years || "相关"}年${state.targetJob.industry || "相关"}经验，过往经历覆盖${core || "执行、协作、复盘"}，希望转向/深耕 ${title}。`,
    `- 能提供的证据：${evidence.quantifiedResults.slice(0, 3).join("、") || "需要补充量化结果、项目交付物或作品链接"}。`,
    `- 当前求职边界：${state.careerIntent.bottomLine || state.profile.commuteLimit || "建议补充通勤、强度和薪资底线"}。`,
    "",
    "个人优势摘要：",
    `- 具备${core}相关经验，能够围绕业务目标完成执行、协作和复盘。`,
    `- 过往经历中${evidence.quantifiedResults.length ? `已有量化结果：${evidence.quantifiedResults.join("、")}` : "量化结果呈现不足，需要补充提升率、人数、金额、周期或效率数据"}。`,
    `- 适合先投递${match.alternativeRoles.slice(0, 2).join("、")}，再冲刺${title}。`,
    "",
    "简历定位建议：",
    `- 当前路径：${decision.title}`,
    `- ${decision.resumeStrategy}`,
    `- 把自己定位为“${state.targetJob.industry}方向，具备执行、复盘和学习转化能力的候选人”。`,
    "- 每段经历优先写结果，再写动作，最后补工具和方法。",
    "",
    "经历改写模板：",
    `- 原表达：负责相关工作，完成日常任务。`,
    `- 改写为：围绕【目标】负责【动作】，使用【工具/方法】推进【过程】，最终带来【数字结果】。`,
    `- 针对 ${title}，每段经历至少补一个与${proofGap}有关的证据。`,
    `- 如果没有真实数字，先写可核实规模：服务人数、处理量、周期、频次、交付物、协作对象。`,
    "",
    "三份投递版本：",
    `- 目标岗位版：直接围绕 ${title} 写关键词、项目和结果。`,
    `- 过渡岗位版：优先投 ${match.alternativeRoles.slice(0, 3).join("、") || capability.starterRoles.slice(0, 3).join("、")}，强调可迁移经验。`,
    "- 方向探索版：目标不明确时突出通用能力、真实成果、稳定性和工作偏好。",
    "",
    "面试案例准备：",
    "- 准备一个最完整的项目/活动/客户案例，按背景、目标、动作、结果、复盘讲清楚。",
    "- 准备一个失败或压力案例，重点讲如何调整，而不是只解释原因。",
    "- 准备一个学习补强案例，证明你能在 2-4 周内补齐岗位短板。",
    "",
    "不要夸大或编造：",
    "- 不要把参与写成负责，不要把团队结果写成个人结果。",
    "- 不要虚构管理人数、销售金额、数据提升。",
    "- 如果证据不足，用作品、复盘、试岗任务补，不要硬包装。",
    "",
    "投递前必须补强：",
    ...match.nextSteps.map((item) => `- ${item}`),
  ].join("\n");
}

export function buildResumeRewritePlan(state: AppState) {
  const targetTitle = !state.targetJob.role || state.targetJob.role.includes("不确定") ? state.targetJob.industry || "可迁移岗位" : state.targetJob.role;
  const capability = findJobCapability(targetTitle);
  const resume = state.resumeDraft.trim();
  if (!resume) return [];

  const segments = resume
    .split(/\n+|。|；|;/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 8)
    .slice(0, 8);

  const targetWords = [...capability.coreSkills, ...capability.proofExamples, ...Object.values(keywordGroups).flat()];
  return segments.map((segment, index) => {
    const hasNumber = /\d|%|万|千|人|次|个|k|K/.test(segment);
    const matchedWords = targetWords.filter((word) => segment.includes(word)).slice(0, 5);
    const lacksTarget = matchedWords.length === 0;
    const problem = [
      hasNumber ? "" : "缺少数字结果，面试官难判断贡献大小。",
      lacksTarget ? `和“${targetTitle}”的关键能力连接不够直接。` : "",
      /负责|参与|协助/.test(segment) && !/提升|降低|完成|转化|增长|成交|交付|优化/.test(segment)
        ? "动作词偏泛，像职责描述，不像成果证明。"
        : ""
    ].filter(Boolean);

    return {
      id: `rewrite-${index + 1}`,
      original: segment,
      problem: problem.length ? problem.join(" ") : "这一段有可用信息，下一步要把结果、动作和证据说得更明确。",
      rewrite: `建议改成：为支持【${targetTitle}】相关目标，负责【${extractActionHint(segment)}】，使用【工具/方法/SOP】推进【关键动作】，产出【${hasNumber ? "保留并解释现有数字结果" : "补充人数/金额/周期/效率/转化率/满意度"}】。可突出：${matchedWords.join("、") || capability.coreSkills.slice(0, 3).join("、")}。`,
      missingEvidence: hasNumber
        ? `补充你在这件事中的个人角色、协作对象、工具方法和复盘结论，避免只写团队成果。`
        : `补一个可信数字：服务/触达人群、处理数量、金额、周期、效率、转化率、满意度或交付数量。`
    };
  });
}

function extractActionHint(segment: string) {
  const cleaned = segment.replace(/[【】]/g, "").trim();
  if (cleaned.length <= 18) return "具体任务/对象";
  return cleaned.slice(0, 28);
}

export function buildResumeVariants(state: AppState, match = calculateMatch(state), decision = buildDecisionPath(state, match)) {
  const targetTitle = !state.targetJob.role || state.targetJob.role.includes("不确定") ? decision.alternatives[0] || "目标岗位" : state.targetJob.role;
  const bridgeTitle = decision.alternatives[0] || "过渡岗位";
  const years = state.profile.years || "相关";
  const city = state.targetJob.city || state.profile.city || "目标城市";
  const evidence = extractResumeEvidence(state, findJobCapability(targetTitle));
  const resultLine = evidence.quantifiedResults.length
    ? `过往经历已有量化成果：${evidence.quantifiedResults.slice(0, 3).join("、")}。`
    : "过往成果需要补充数字证据，例如人数、金额、周期、效率、转化率或满意度。";
  const baseExperience = state.resumeDraft || "请补充真实经历后生成更贴近的简历内容。";

  const make = (title: string, positioning: string, focus: string[]) => [
    `简历标题：${title}｜${years}经验｜${city}`,
    "",
    "个人定位：",
    positioning,
    "",
    "核心优势：",
    `- ${decision.advantages[0] || "具备可迁移经验，需要进一步明确证据。"}`,
    `- ${resultLine}`,
    `- 适合突出：${focus.join("、")}。`,
    "",
    "经历改写方向：",
    `- 围绕【目标/任务】说明你负责什么，不只写日常职责。`,
    `- 围绕【动作/工具】说明你怎么做，体现方法和执行过程。`,
    `- 围绕【结果/复盘】补充数字、反馈、效率或交付物。`,
    "",
    "可改写素材：",
    baseExperience,
    "",
    "投递提醒：",
    `- ${decision.resumeStrategy}`,
    ...decision.risks.slice(0, 3).map((item) => `- 注意：${item}`)
  ].join("\n");

  return {
    target: make(targetTitle, `定位为“能围绕 ${targetTitle} 交付结果的候选人”，简历第一屏直接贴近目标岗位关键词。`, decision.resumeFocus),
    bridge: make(bridgeTitle, `定位为“从既有经历切入 ${bridgeTitle} 的稳妥候选人”，先降低岗位跨度，提高面试机会。`, ["可迁移经验", "稳定交付", "真实成果", "岗位相邻能力"]),
    explore: make("方向探索型候选人", "先不锁死单一岗位，突出通用能力、过往成果和现实约束，方便对比多个方向。", ["通用能力", "量化成果", "可迁移项目", "工作偏好"])
  };
}

export function analyzeRecruiterJob(state: AppState) {
  const job = { ...defaultState.recruiterJob, ...state.recruiterJob };
  const jd = `${job.jd} ${job.coreTasks} ${job.successMetrics} ${job.mustHave} ${job.softSkills}`;
  const needsData = jd.includes("数据") || jd.includes("复盘") || jd.includes("指标");
  const needsCommunication = jd.includes("沟通") || jd.includes("协作") || jd.includes("客户") || jd.includes("用户");
  const needsPressure = /高强度|加班|出差|外勤|业绩|增长|转化|销售/.test(`${job.workMode} ${jd}`);
  const mustHave = job.mustHave
    .split(/[、，,；;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const softSkills = job.softSkills
    .split(/[、，,；;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const dealBreakers = job.dealBreakers
    .split(/[、，,；;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const redFlags = job.redFlags
    .split(/[、，,；;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const keywords = job.searchKeywords
    .split(/\s+|[、，,；;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return {
    mustHave: [
      ...mustHave.slice(0, 4),
      job.hiringReason.includes("定位还不清晰") ? "需要先明确岗位目标，否则不建议直接发布招聘。" : `能解决本次招聘目的：${job.hiringReason}。`,
      job.coreTasks ? `能承担核心任务：${job.coreTasks.split(/[；;\n]/).filter(Boolean).slice(0, 2).join("；")}。` : "能说清楚过往经历中的目标、动作和结果。",
      job.successMetrics ? `能对齐试用期指标：${job.successMetrics.split(/[；;\n]/).filter(Boolean).slice(0, 2).join("；")}。` : "能说清楚过往经历中的目标、动作和结果。",
      needsCommunication ? "具备真实沟通、协调或客户/用户处理经验。" : "具备稳定执行和按时交付能力。",
      needsData ? "能使用基础数据指标判断工作效果。" : "能按流程完成任务并及时反馈问题。"
    ],
    niceToHave: [...softSkills.slice(0, 4), "有同类行业经验", "能沉淀 SOP 或复盘方法", "过往经历中有可量化结果"].filter(Boolean),
    risks: [
      ...dealBreakers.slice(0, 4),
      ...redFlags.slice(0, 4),
      needsPressure ? "岗位强度或业绩压力较明显，JD 需要提前讲清楚真实节奏，避免入职后流失。" : "岗位强度暂未显示明显风险。",
      job.successMetrics ? "试用期指标已经有方向，建议在面试中让候选人复述如何达成。" : "缺少试用期衡量标准，容易导致面试和转正判断主观化。",
      "JD 如果只写职责不写目标，会吸引大量泛匹配候选人。",
      "建议明确薪资、工作强度、汇报关系和试用期考核标准。"
    ],
    searchKeywords: keywords.length ? keywords : [job.title, "项目", "数据", "复盘", "协作"].filter(Boolean),
    interviewQuestions: [
      "请讲一个最能代表你能力的项目，按目标、动作、结果说明。",
      needsData ? "你当时看了哪些指标，如何判断动作有效？" : "你如何保证重复任务稳定交付？",
      job.successMetrics ? `如果试用期按“${job.successMetrics.split(/[；;\n]/)[0]}”考核，你会怎么拆前两周动作？` : "如果试用期只给你一个核心目标，你会如何拆解前两周动作？",
      "遇到跨部门不配合或目标变化时，你怎么推进？",
      job.workMode ? `你是否能接受这个工作方式：${job.workMode}？请举例说明过往类似节奏。` : "你不能接受哪些工作强度或协作方式？"
    ],
    improvedJd: `${job.title}｜${job.salary}\n\n招聘背景：\n${job.hiringReason || "补充团队岗位需求。"}\n\n岗位亮点：\n${job.sellingPoints || "团队目标清晰，岗位成长路径明确。"}\n\n工作方式：\n${job.workMode || "请补充工作地点、作息、加班、出差或排班情况。"}\n\n汇报与协作：\n${job.teamStructure || "请补充汇报对象、协作部门和是否带团队。"}\n\n岗位目标：\n围绕业务目标完成核心任务，并用数据或交付物证明结果。\n\n核心职责：\n${job.coreTasks || "1. 负责核心业务动作的执行、跟进和复盘。\n2. 与相关部门协作，推动问题闭环。\n3. 沉淀可复用流程，提高执行效率。"}\n\n试用期/转正标准：\n${job.successMetrics || "请明确 1-3 个可衡量标准，例如转化率、交付周期、满意度、到岗人数、GMV 或回款。"}\n\n任职要求：\n1. ${job.mustHave || "有相关岗位经验，能提供具体项目或成果案例。"}\n2. ${job.softSkills || "具备良好的沟通、执行和学习能力。"}\n3. 对结果负责，能接受清晰的目标考核。\n\n不适合情况：\n${job.dealBreakers || job.redFlags || "只想做机械执行、不愿复盘、不接受岗位真实工作强度。"}`
  };
}

export function analyzeCandidateFit(state: AppState) {
  const job = { ...defaultState.recruiterJob, ...state.recruiterJob };
  const resume = job.candidateResume.trim();
  const jdText = `${job.title} ${job.jd} ${job.mustHave} ${job.searchKeywords}`;
  const mustItems = job.mustHave
    .split(/[、，,；;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const keywords = job.searchKeywords
    .split(/\s+|[、，,；;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const keywordHits = keywords.filter((word) => resume.includes(word));
  const mustHits = mustItems.filter((item) => resume.includes(item) || item.split(/[、，,；;]/).some((word) => word.length > 1 && resume.includes(word)));
  const hasNumbers = /\d|%|万|千|人|次|个|k|K/.test(resume);
  const hasProject = /项目|活动|客户|用户|系统|交付|上线|复盘|成交|转化|增长/.test(resume);
  const score = clamp(38 + keywordHits.length * 8 + mustHits.length * 10 + (hasNumbers ? 12 : 0) + (hasProject ? 10 : 0));
  const recommendation = score >= 78 ? "建议进入面试" : score >= 58 ? "可电话初筛后再决定" : "暂不建议直接面试";

  return {
    score,
    recommendation,
    strengths: [
      keywordHits.length ? `简历命中关键词：${keywordHits.slice(0, 6).join("、")}。` : "暂未明显命中检索关键词，需要确认是否投错方向或简历表达过泛。",
      mustHits.length ? `与硬性门槛有交集：${mustHits.slice(0, 3).join("、")}。` : "硬性门槛证据不足，建议先电话确认真实经验。",
      hasProject ? "简历中有项目/业务场景信号，可以继续追问其个人贡献。" : "缺少项目或业务场景，较难判断是否能独立上手。"
    ],
    risks: [
      hasNumbers ? "已有数字线索，但仍要确认数字是否由候选人本人推动。" : "缺少量化结果，面试中必须追问规模、周期、转化、金额或效率。",
      jdText.includes("沟通") && !/沟通|协作|客户|用户|跨部门/.test(resume) ? "岗位要求沟通协作，但简历没有明显沟通信号。" : "沟通协作风险暂未明显暴露。",
      jdText.includes("数据") && !/数据|指标|报表|复盘|分析/.test(resume) ? "岗位要求数据复盘，但简历数据能力证据不足。" : "数据/复盘证据可继续追问深度。"
    ],
    interviewQuestions: [
      `请候选人讲一个最接近“${job.title || "目标岗位"}”的完整案例：目标是什么、自己做了什么、结果是多少。`,
      "简历里的结果是个人直接负责、团队共同完成，还是只参与其中一环？",
      "如果入职后前两周只给一个核心目标，候选人会怎么拆动作、看哪些指标？",
      "候选人不能接受哪些工作强度、协作方式或考核方式？"
    ]
  };
}

function splitCandidateResumes(raw: string) {
  return raw
    .split(/\n\s*-{3,}\s*\n|候选人(?=[A-Z甲乙丙丁一二三四五六七八九十\d])|简历(?=\d)|\n\s*\n(?=.{0,20}(?:候选|姓名|求职|应聘))/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 15)
    .slice(0, 30);
}

function candidateName(text: string, index: number) {
  const firstLine = text.split(/\n/)[0]?.trim() || "";
  const explicit = text.match(/(?:姓名|候选人)[:：\s]*([\u4e00-\u9fa5A-Za-z0-9_-]{1,12})/)?.[1];
  if (explicit) return explicit;
  if (firstLine.length <= 24) return firstLine.replace(/[｜|].*/, "") || `候选人${index + 1}`;
  return `候选人${index + 1}`;
}

export function analyzeCandidateBatch(state: AppState) {
  const job = { ...defaultState.recruiterJob, ...state.recruiterJob };
  const resumes = splitCandidateResumes(job.candidateResume);
  const mustItems = job.mustHave.split(/[、，,；;\n]/).map((item) => item.trim()).filter(Boolean);
  const keywords = job.searchKeywords.split(/\s+|[、，,；;\n]/).map((item) => item.trim()).filter(Boolean);
  const redFlags = `${job.redFlags} ${job.dealBreakers}`.split(/[、，,；;\n]/).map((item) => item.trim()).filter(Boolean);

  return resumes.map((resume, index) => {
    const keywordHits = keywords.filter((word) => word && resume.includes(word));
    const mustHits = mustItems.filter((item) => item && (resume.includes(item) || item.split(/\s+/).some((word) => word.length > 1 && resume.includes(word))));
    const riskHits = redFlags.filter((item) => item && resume.includes(item)).slice(0, 4);
    const hasNumbers = /\d|%|万|千|人|次|个|k|K/.test(resume);
    const hasProject = /项目|活动|客户|用户|系统|交付|上线|复盘|成交|转化|增长|负责/.test(resume);
    const priorityBonus =
      job.screeningPriority.includes("量化") && hasNumbers
        ? 8
        : job.screeningPriority.includes("同岗位") && keywordHits.length >= 2
          ? 8
          : job.screeningPriority.includes("稳定") && !/频繁跳槽|空窗|短期/.test(resume)
            ? 6
            : 0;
    const score = clamp(35 + mustHits.length * 11 + keywordHits.length * 7 + (hasNumbers ? 12 : 0) + (hasProject ? 8 : 0) + priorityBonus - riskHits.length * 10);
    const decision = score >= 80 ? "优先约面" : score >= 65 ? "建议初筛" : score >= 50 ? "备选观察" : "暂不推荐";
    return {
      id: `candidate-${index + 1}`,
      name: candidateName(resume, index),
      score,
      decision,
      summary: resume.slice(0, 120),
      strengths: [
        keywordHits.length ? `命中关键词：${keywordHits.slice(0, 6).join("、")}` : "关键词命中不足",
        mustHits.length ? `匹配硬门槛：${mustHits.slice(0, 4).join("、")}` : "硬性门槛证据不足",
        hasNumbers ? "有量化结果线索" : "缺少量化成果"
      ],
      risks: riskHits.length ? riskHits.map((item) => `疑似风险：${item}`) : ["暂无明显淘汰项，但仍需电话确认真实性"],
      questions: [
        "请候选人讲一个最接近岗位要求的完整案例：目标、动作、结果分别是什么？",
        hasNumbers ? "简历里的数字由候选人本人推动还是团队结果？" : "请补充规模、周期、转化、金额或效率等数字证据。",
        "能否接受岗位真实工作方式、强度、薪资结构和试用期目标？"
      ]
    };
  }).sort((a, b) => b.score - a.score);
}

export function buildSampleAuditSummary() {
  const samples: { name: string; patch: Partial<AppState> }[] = [
    {
      name: "离职急找，优先稳定",
      patch: { careerIntent: { ...defaultState.careerIntent, clarity: "还不明确，只知道想要更合适的工作", mainGoal: "尽快就业||工作更稳定", bottomLine: "收入波动大||长期高强度加班" }, profile: { ...defaultState.profile, urgency: "马上需要工作，经济压力较大" } }
    },
    {
      name: "带娃求稳，限制通勤",
      patch: { careerIntent: { ...defaultState.careerIntent, mainGoal: "兼顾家庭/带娃||离家近/通勤短", bottomLine: "通勤超过60分钟||频繁出差||长期高强度加班" }, profile: { ...defaultState.profile, hasCareDuty: "需要接送孩子/带娃", familyContext: "需要接送孩子/带娃", commuteLimit: "单程 30 分钟以内" } }
    },
    {
      name: "想转管理但沟通偏弱",
      patch: { careerIntent: { ...defaultState.careerIntent, clarity: "有明确岗位，但不确定能不能做" }, targetJob: { ...defaultState.targetJob, role: "项目经理", managementLevel: "明确管理岗/主管岗" }, assessmentAnswers: { ...defaultState.assessmentAnswers, q1: 2, q2: 2, q13: 2, q14: 2 } }
    },
    {
      name: "目标清晰，高适配投递",
      patch: { careerIntent: { ...defaultState.careerIntent, clarity: "只想优化某个岗位的简历" }, resumeDraft: `${defaultState.resumeDraft} 负责活动复盘，活动参与率提升27%，用户留存提升12%。` }
    }
  ];

  return samples.map((sample) => {
    const state = { ...defaultState, ...sample.patch } as AppState;
    const match = calculateMatch(state);
    const decision = buildDecisionPath(state, match);
    return `${sample.name}：${decision.title}｜${match.total}/100｜置信度${match.confidence}`;
  });
}
