import { buildDecisionPath, calculateMatch } from "./analysis";
import { buildKnowledgeContext } from "./knowledge";
import { formatChoiceText } from "./reports";
import type { CSSProperties } from "react";
import type { AppState } from "./types";

export type PossibilityTone = "good" | "warn" | "risk" | "neutral";
export type PossibilityItem = {
  label: string;
  value: number;
  hint: string;
  tone: PossibilityTone;
  reasons: string[];
  sources: string[];
};

export function PossibilityRing({
  label,
  value,
  hint,
  tone,
  selected,
  onSelect
}: PossibilityItem & { selected: boolean; onSelect: () => void }) {
  return (
    <button className={`possibility-card ${tone}${selected ? " selected" : ""}`} onClick={onSelect} type="button">
      <div className="ring-meter" style={{ "--value": value } as CSSProperties & Record<"--value", number>} aria-label={`${label} ${value}%`}>
        <strong>{value}%</strong>
      </div>
      <div>
        <h3>{label}</h3>
        <p>{hint}</p>
      </div>
    </button>
  );
}

export function PossibilityDetail({ item }: { item: PossibilityItem }) {
  return (
    <article className={`possibility-detail ${item.tone}`}>
      <div className="possibility-detail-head">
        <span>为什么是 {item.value}%</span>
        <h3>{item.label}</h3>
        <p>{item.hint}</p>
      </div>
      <div className="possibility-detail-grid">
        <div>
          <b>主要影响因素</b>
          <ul>
            {item.reasons.map((reason, index) => (
              <li key={`${item.label}-reason-${index}`}>{reason}</li>
            ))}
          </ul>
        </div>
        <div>
          <b>来自哪些表单/判断</b>
          <ul>
            {item.sources.map((source, index) => (
              <li key={`${item.label}-source-${index}`}>{source}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

export function evaluateAiResultQuality(sections: Record<string, string>) {
  const required = ["一句话结论", "现在最该做什么", "如果坚持这个岗位，先补什么", "更适合的岗位和城市", "简历和投递打法"];
  const issues: string[] = [];
  const missing = required.filter((title) => !sections[title]?.trim());
  if (missing.length) {
    issues.push(`缺少关键模块：${missing.join("、")}。`);
  }
  const strengthen = sections["如果坚持这个岗位，先补什么"] || "";
  if (strengthen && !/7 天|7天|14 天|14天|30 天|30天|作品|案例|证据/.test(strengthen)) {
    issues.push("补强计划不够具体，缺少阶段目标、作品/案例或证据要求。");
  }
  const resume = sections["简历和投递打法"] || "";
  if (resume && !/标题|摘要|改写|投递|不能|不要|经历/.test(resume)) {
    issues.push("简历优化不够落地，缺少标题、摘要、经历改写或投递筛选规则。");
  }
  const combined = Object.values(sections).join("\n");
  if (/\d+%|百分之|中位数|排名|90%|80%/.test(combined) && !/本地|参考分数|系统|表单/.test(combined)) {
    issues.push("AI 可能输出了没有来源的市场比例或精确数据，需要谨慎复核。");
  }
  return issues;
}

export function buildAiPossibilities(
  state: AppState,
  match: ReturnType<typeof calculateMatch>,
  decisionPath: ReturnType<typeof buildDecisionPath>,
  knowledge: ReturnType<typeof buildKnowledgeContext>,
  sections: Record<string, string>
) {
  const combinedText = Object.values(sections).join("\n");
  const directPenalty = hasAny(combinedText, ["不建议直接", "暂不推荐", "放弃投递", "不适合", "风险"]) ? 18 : 0;
  const directBoost = hasAny(combinedText, ["直接投递", "推荐直接", "适配"]) ? 8 : 0;
  const directValue = clampPercent(match.total + directBoost - directPenalty);
  const bridgeValue = clampPercent(
    54 +
      Math.round((100 - Math.abs(match.total - 62)) * 0.22) +
      (decisionPath.type === "bridge" ? 14 : 0) +
      (state.careerIntent.transitionOpenness.includes("接受") ? 8 : 0)
  );
  const alternativeValue = clampPercent(
    48 +
      (decisionPath.type === "redirect" || decisionPath.type === "explore" ? 24 : 0) +
      Math.min(decisionPath.alternatives.length * 5, 18) +
      (hasAny(combinedText, ["更适合", "优先考虑", "先走"]) ? 8 : 0)
  );
  const resumeValue = clampPercent(
    42 +
      Math.min(knowledge.evidence.missingEvidence.length * 6, 24) +
      (knowledge.evidence.quantifiedResults.length ? 12 : 0) +
      (hasAny(combinedText, ["简历", "改写", "标题", "投递"]) ? 10 : 0)
  );
  const cityValue = clampPercent(
    35 +
      (state.profile.city && state.targetJob.city && state.profile.city !== state.targetJob.city ? 18 : 0) +
      (knowledge.targetCity ? 14 : 0) +
      (state.profile.canRelocate.includes("接受") ? 12 : state.profile.canRelocate.includes("不") ? -10 : 0) +
      (hasAny(combinedText, ["城市", "迁移", "杭州", "上海", "深圳", "北京"]) ? 8 : 0)
  );
  const riskValue = clampPercent(
    Math.min(match.risks.length * 8, 42) +
      (hasAny(combinedText, ["不建议", "冲突", "风险", "抗压", "带娃", "通勤", "加班", "出差"]) ? 28 : 8) +
      (state.profile.hasCareDuty.includes("有") ? 10 : 0)
  );

  const directTone: PossibilityTone = directValue >= 70 ? "good" : directValue >= 50 ? "warn" : "risk";
  const bridgeTone: PossibilityTone = bridgeValue >= 70 ? "good" : "warn";
  const alternativeTone: PossibilityTone = alternativeValue >= 68 ? "good" : "neutral";
  const resumeTone: PossibilityTone = resumeValue >= 68 ? "good" : "neutral";
  const cityTone: PossibilityTone = cityValue >= 65 ? "warn" : "neutral";
  const riskTone: PossibilityTone = riskValue >= 65 ? "risk" : riskValue >= 45 ? "warn" : "good";

  return [
    {
      label: "目标岗位直投",
      value: directValue,
      tone: directTone,
      hint: directValue >= 70 ? "可以把重点放在简历命中和面试案例。" : "不宜只靠包装简历，需要先看证据和现实约束。",
      reasons: [
        `本地综合适配分为 ${match.total}/100，属于“${match.level}”。`,
        directPenalty ? "AI 结论中出现“不建议/风险/不适合”等信号，所以直投可能性被下调。" : "AI 没有强烈反对直投，直投可能性主要跟随本地适配分。",
        directBoost ? "AI 文本中出现“直接投递/推荐/适配”等信号，所以直投可能性略上调。" : "AI 没有明确强化直投信号。",
        `当前路径判断为“${decisionPath.title}”。`
      ],
      sources: [
        `目标岗位：${state.targetJob.role || "未填写"}｜${state.targetJob.industry || "未填写行业"}`,
        `岗位 JD：${state.targetJob.jd ? "已填写" : "未填写"}`,
        `简历经历：${state.resumeDraft ? "已填写" : "未填写"}`,
        `本地风险：${match.risks.slice(0, 2).join("；") || "暂无明显风险"}`
      ]
    },
    {
      label: "补强后冲刺",
      value: bridgeValue,
      tone: bridgeTone,
      hint: "先补作品、项目案例或数据证据，再小批量投递。",
      reasons: [
        `该值以“中等适配可补强”为中心估算，当前分数距离 62 分越近，越适合先补强后冲刺。`,
        decisionPath.type === "bridge" ? "本地路径已经判断为“可以冲刺，但要先补关键证据”。" : `本地路径当前为“${decisionPath.title}”，不是纯补强路径。`,
        state.careerIntent.transitionOpenness.includes("接受") ? "你表示能接受过渡岗位/补强路径，所以补强冲刺空间上调。" : "你对过渡/补强的接受度不高，执行难度会增加。"
      ],
      sources: [
        `可投入学习/补强时间：${state.careerIntent.learningBudget || "未填写"}`,
        `是否接受过渡岗位：${state.careerIntent.transitionOpenness || "未填写"}`,
        `能力库补强路径：${knowledge.capability.growthPath.slice(0, 2).join("；")}`,
        `下一步建议：${decisionPath.nextSteps.slice(0, 2).join("；")}`
      ]
    },
    {
      label: "过渡/相邻岗位",
      value: alternativeValue,
      tone: alternativeTone,
      hint: `更现实的入口：${decisionPath.alternatives.slice(0, 2).join("、") || "相邻岗位" }。`,
      reasons: [
        decisionPath.type === "redirect" || decisionPath.type === "explore" ? "本地路径倾向“换方向/先探索”，因此过渡岗位可能性明显上调。" : "本地路径没有强制换方向，但仍保留相邻岗位作为低风险入口。",
        `系统识别到 ${decisionPath.alternatives.length} 个可尝试替代方向。`,
        hasAny(combinedText, ["更适合", "优先考虑", "先走"]) ? "AI 文本中出现“更适合/优先考虑/先走”等方向转换信号。" : "AI 没有明显要求换方向。"
      ],
      sources: [
        `替代岗位：${decisionPath.alternatives.slice(0, 4).join("、") || "暂无"}`,
        `目标明确度：${state.careerIntent.clarity || "未填写"}`,
        `明确不想做：${formatChoiceText(state.careerIntent.avoidWork)}`,
        `偏好的工作方式：${formatChoiceText(state.careerIntent.preferredWorkStyle)}`
      ]
    },
    {
      label: "简历优化收益",
      value: resumeValue,
      tone: resumeTone,
      hint: "收益来自第一屏定位、量化成果和缺失证据补齐。",
      reasons: [
        `系统发现 ${knowledge.evidence.missingEvidence.length} 类缺失证据，缺口越明确，简历优化空间越大。`,
        knowledge.evidence.quantifiedResults.length ? "简历里已有量化结果，可以被改写放大为岗位证据。" : "简历暂未发现明显量化结果，需要先补数字和结果。",
        hasAny(combinedText, ["简历", "改写", "标题", "投递"]) ? "AI 对简历标题、改写或投递打法有明确建议。" : "AI 对简历改写展开不足，建议回到本地简历优化模块继续补。"
      ],
      sources: [
        `缺失证据：${knowledge.evidence.missingEvidence.slice(0, 4).join("、") || "暂未发现明显缺失"}`,
        `量化结果：${knowledge.evidence.quantifiedResults.slice(0, 3).join("、") || "未发现"}`,
        `项目/管理/沟通信号：${[...knowledge.evidence.projectSignals, ...knowledge.evidence.managementSignals, ...knowledge.evidence.communicationSignals].slice(0, 3).join("、") || "未发现"}`,
        `简历内容：${state.resumeDraft ? "已填写，可继续逐段改写" : "未填写，优化收益暂时无法兑现"}`
      ]
    },
    {
      label: "城市机会变量",
      value: cityValue,
      tone: cityTone,
      hint: state.targetJob.city ? `${state.profile.city || "当前城市"} -> ${state.targetJob.city} 需要结合机会和成本判断。` : "目标城市不明确时，先用行业和岗位筛城市。",
      reasons: [
        state.profile.city && state.targetJob.city && state.profile.city !== state.targetJob.city ? "当前城市和目标城市不同，城市机会会明显影响求职策略。" : "当前城市和目标城市未形成明显迁移变量。",
        knowledge.targetCity ? `目标城市命中本地城市库：${knowledge.targetCity.city}。` : "目标城市暂未命中本地城市库，需要用招聘软件进一步验证。",
        state.profile.canRelocate.includes("接受") ? "你表示接受跨城市，城市机会变量上调。" : state.profile.canRelocate.includes("不") ? "你不接受跨城市，城市机会变量下调。" : "跨城市接受度不明确。"
      ],
      sources: [
        `当前城市：${state.profile.city || "未填写"}`,
        `目标城市：${state.targetJob.city || "未填写"}`,
        `是否接受跨城市：${state.profile.canRelocate || "未填写"}`,
        `城市倾向：${state.careerIntent.cityPreference || "未填写"}`,
        `城市库提示：${knowledge.targetCity ? knowledge.targetCity.cautions.slice(0, 2).join("、") : "暂无"}`
      ]
    },
    {
      label: "现实风险压力",
      value: riskValue,
      tone: riskTone,
      hint: "风险越高，越要筛掉高强度、远通勤、收入波动大的岗位。",
      reasons: [
        `本地共识别 ${match.risks.length} 条风险，数量越多压力值越高。`,
        hasAny(combinedText, ["不建议", "冲突", "风险", "抗压", "带娃", "通勤", "加班", "出差"]) ? "AI 文本中出现现实约束或风险冲突信号。" : "AI 没有明显强调现实风险。",
        state.profile.hasCareDuty.includes("有") ? "你填写了照护责任，所以高强度、远通勤、频繁出差岗位需要更谨慎。" : "照护责任未形成额外加权。"
      ],
      sources: [
        `真实情况/家庭责任：${state.profile.familyContext || "未填写"}`,
        `照护责任：${state.profile.hasCareDuty || "未填写"}`,
        `通勤限制：${state.profile.commuteLimit || "未填写"}`,
        `加班接受度：${state.profile.overtimeTolerance || "未填写"}`,
        `出差接受度：${state.profile.travelTolerance || "未填写"}`
      ]
    }
  ] satisfies PossibilityItem[];
}

export function toAdviceItems(content = "") {
  const compact = stripMarkdown(content)
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•\d.、\s]+/, "").trim())
    .filter(Boolean);
  if (compact.length >= 2) return compact.slice(0, 7);
  return stripMarkdown(content)
    .split(/[。；;]/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 7);
}

export function stripMarkdown(value: string) {
  return value
    .replace(/\*\*/g, "")
    .replace(/#{1,6}\s*/g, "")
    .replace(/`/g, "")
    .trim();
}

function hasAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function clampPercent(value: number) {
  return Math.max(8, Math.min(96, Math.round(value)));
}
