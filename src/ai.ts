import { buildDecisionPath, calculateMatch } from "./analysis";
import { invoke } from "@tauri-apps/api/core";
import { buildKnowledgeContext } from "./knowledge";
import type { AppState, ResumeImportPreview } from "./types";

const isTauri = () => "__TAURI_INTERNALS__" in window;

function normalizeAiBaseUrl(baseUrl: string) {
  let trimmed = baseUrl.trim().replace(/\/+$/, "");
  if (!trimmed) return "https://api.openai.com/v1";
  trimmed = trimmed.replace(/\/chat\/completions$/i, "");
  if (trimmed === "https://api.openai.com") return "https://api.openai.com/v1";
  return trimmed;
}

function getBrowserEndpoint(baseUrl: string) {
  const normalized = normalizeAiBaseUrl(baseUrl);
  if (normalized === "https://api.openai.com/v1") {
    return "/openai/v1/chat/completions";
  }
  return `${normalized}/chat/completions`;
}

function explainNetworkError(error: unknown) {
  if (error instanceof TypeError && error.message.toLowerCase().includes("fetch")) {
    return "AI 服务连接失败：浏览器预览模式下可能被跨域或网络拦截。默认 OpenAI 地址已走本地代理；如果你使用的是第三方 Base URL，请确认该服务允许浏览器跨域访问，或用 Tauri 桌面版运行。";
  }
  if (error instanceof Error && /timeout|ETIMEDOUT/i.test(error.message)) {
    return "AI 服务连接超时：上游服务当前不可达或响应过慢。请检查网络、Base URL，或稍后重试。浏览器预览模式下默认 OpenAI 已改走本地代理，如果仍超时，多半是网络问题而不是页面逻辑错误。";
  }
  return error instanceof Error ? error.message : "AI 分析失败，请检查 API Key、Base URL、模型名称和网络连接。";
}

function compactProviderMessage(value: string) {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/g, "Bearer ***")
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, "sk-***")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

async function readProviderError(response: Response) {
  const text = await response.text();
  if (!text.trim()) return "";
  try {
    const data = JSON.parse(text);
    const message = data?.error?.message || data?.message || data?.detail || text;
    return compactProviderMessage(String(message));
  } catch {
    return compactProviderMessage(text);
  }
}

function withProviderDetail(message: string, detail: string) {
  return detail ? `${message} 服务商提示：${detail}` : message;
}

function choiceText(value: string) {
  return value ? value.split("||").filter(Boolean).join("、") : "未填写";
}

export function buildCareerPrompt(state: AppState) {
  const match = calculateMatch(state);
  const decisionPath = buildDecisionPath(state, match);
  const assessment = match.assessment;
  const cityChanged = state.profile.city && state.targetJob.city && state.profile.city !== state.targetJob.city;
  const knowledge = buildKnowledgeContext(state);
  const targetUnclear = !state.targetJob.role || state.targetJob.role.includes("不确定") || state.careerIntent.clarity.includes("还不明确") || state.careerIntent.clarity.includes("犹豫");

  return `你不是“聊天机器人外壳”，而是这款求职软件里的职业决策引擎。你要基于软件已经收集到的结构化信息，给用户一个有取舍、有优先级、能直接照做的求职决策。

产品目标：
- 用户看完后必须知道：现在该不该投这个岗位、为什么、先补什么、更适合做什么、去哪个城市更现实、简历第一屏怎么改。
- 输出要像资深职业顾问当面诊断，不要像模板报告。允许直接、克制、甚至有点“戳破幻想”，但必须尊重用户，不得歧视。
- 不要复述用户填了什么，不要泛泛说“提升沟通能力/增强竞争力”。每条建议都要落到证据、动作、岗位、城市或简历表达。
- 分数只是参考。你需要挑战分数：如果分数高但现实约束冲突大，要降级建议；如果分数低但可迁移能力强，要给过渡打法。
- 敏感信息只能用于求职策略判断，例如通勤、加班、出差、稳定收入、照护安排，不能作为价值判断。
- 不得编造精确市场数据、比例、薪资中位数、公司招聘事实或城市岗位占比。除非输入资料或本地城市库明确提供，否则只能用“可能、通常、相对更多/更少、需要用招聘软件验证”这类谨慎表达。

软件本地初判：
- 参考分数：${match.total}/100，${match.level}
- 推荐路径：${decisionPath.title}
- 本地判断：${decisionPath.verdict}
- 本地下一步：${decisionPath.nextSteps.join("；")}
- 本地风险：${match.risks.join("；")}

输出规则：
1. 必须使用下面 7 个标题，标题文字不要改。
2. 每个标题下用短段落 + 要点，少写空话，多写判断。
3. 如果目标不明确，第一部分直接告诉用户“先不要锁死岗位”，并给方向排序。
4. 如果用户坚持目标岗位，也要给“硬冲刺路线”；如果更适合别的岗位，要明确说。
5. 城市建议不能只说一线城市好，要结合当前城市、目标城市、行业机会、家庭/通勤/收入约束。
6. 简历建议要写成可复制的表达方向，但不要编造不存在的经历。
7. 不要输出没有来源的百分比、排名、薪资中位数、公司名单结论；如果需要市场验证，直接告诉用户去招聘软件用哪些关键词筛选。
8. “补强”和“简历优化”必须写细：不能只写“学习数据分析/优化简历”，要写清楚做什么作品、补什么证据、多少天内做到什么程度、简历哪一段怎么改。

一句话结论
- 用 2-3 句话讲清楚：现在最建议走哪条路，是否建议直接投目标岗位。
- 必须出现一个明确标签：直接投递 / 谨慎冲刺 / 先走过渡岗位 / 方向探索 / 暂不推荐。

为什么不是简单问 AI
- 用软件视角解释这次判断来自哪些结构化证据：岗位、简历、性格/工作风格、真实情况、城市机会。
- 明确指出一个普通聊天式回答最容易忽略的风险。

现在最该做什么
- 给 3 个优先级最高的动作，按“今天 / 本周 / 两周内”写。
- 每个动作都要说明完成标准，例如补一段项目案例、筛掉某类公司、投递某类岗位。

为什么现在可能不适合
- 写最关键的 3-5 个不适合或风险点。
- 必须把性格/工作风格、家庭照护/通勤/加班/出差、城市机会、简历证据缺口放进判断里。
- 如果没有明显冲突，也要说“主要风险不是岗位不适合，而是简历证据不足/投递策略不清”。

如果坚持这个岗位，先补什么
- 按“能力证据 / 作品或案例 / 面试故事 / 简历第一屏”拆解。
- 每一项都要写具体怎么补，不要只写能力名。
- 必须给 7 天、14 天、30 天三个阶段的补强目标。
- 必须说明哪些证据如果补不出来，就不建议硬投这个岗位。

更适合的岗位和城市
- 给 3-5 个更现实方向，按优先级排序。
- 每个方向包含：岗位名、适合原因、先投哪类公司、城市建议、薪资策略。
- 如果当前城市机会够用，说明不必盲目迁移；如果目标城市更好，说明什么条件下值得去。

简历和投递打法
- 给一个简历标题。
- 给 3 条经历改写方向。
- 给 5 条投递筛选规则，帮助用户避开不适合的公司/岗位。
- 明确哪些内容不能夸大或编造。
- 如果用户粘贴的是模板或原始简历，要先识别其中已有证据和缺失证据，再给改写方案。
- 给一段可复制的“个人优势摘要”示例，但不能虚构用户没有提供的经历。

用户资料：
目标明确度：${state.careerIntent.clarity}
本次换工作最想解决：${choiceText(state.careerIntent.mainGoal)}
期望/最低收入：${state.careerIntent.expectedIncome}
不能接受的工作条件：${choiceText(state.careerIntent.bottomLine)}
偏好的工作方式：${choiceText(state.careerIntent.preferredWorkStyle)}
明确不想做：${choiceText(state.careerIntent.avoidWork)}
自认为优势：${choiceText(state.careerIntent.strengths)}
担心短板：${choiceText(state.careerIntent.weakPoints)}
偏好公司类型：${choiceText(state.careerIntent.companyPreference)}
能接受的岗位层级：${state.careerIntent.roleLevelPreference}
可投入学习/补强时间：${state.careerIntent.learningBudget}
当前求职卡点：${choiceText(state.careerIntent.jobSearchObstacle)}
城市和通勤倾向：${state.careerIntent.cityPreference}
是否接受过渡岗位：${state.careerIntent.transitionOpenness}
招聘软件市场验证：${state.careerIntent.marketValidation || state.targetJob.marketValidation || "未填写"}
是否目标不明确：${targetUnclear ? "是" : "否"}
城市：${state.profile.city}
当前区域/商圈：${state.profile.cityArea || "未填写"}
学历：${state.profile.education}
工作年限：${state.profile.years}
求职状态：${state.profile.status}
期望薪资：${state.profile.targetSalary}
求职紧急度：${state.profile.urgency}
真实情况/家庭责任：${state.profile.familyContext || "未填写"}
可接受条件：${state.profile.flexibility.join("、") || "未填写"}
是否想管理/带人：${state.profile.wantsManagement}
是否有照护责任：${state.profile.hasCareDuty}
是否接受跨城市：${state.profile.canRelocate}
通勤限制：${state.profile.commuteLimit}
加班接受度：${state.profile.overtimeTolerance}
出差接受度：${state.profile.travelTolerance}

目标岗位：
行业：${state.targetJob.industry}
岗位：${state.targetJob.role}
目标城市：${state.targetJob.city}
目标区域/商圈：${state.targetJob.cityArea || "未填写"}
是否跨城市：${cityChanged ? "是" : "否"}
岗位管理要求：${state.targetJob.managementLevel}
岗位工作强度：${state.targetJob.workIntensity}
岗位出差要求：${state.targetJob.travelRequirement}
目标城市机会：${state.targetJob.cityOpportunity}
岗位收入稳定性：${state.targetJob.incomeStability}
目标岗位市场验证：${state.targetJob.marketValidation || "未填写"}
岗位 JD：${state.targetJob.jd}

简历/经历：
${state.resumeDraft}

工作风格问卷结果：
${match.personality.description}
沟通协作：${assessment.communication}
稳定执行：${assessment.stability}
抗压推进：${assessment.pressure}
细节质量：${assessment.detail}
学习成长：${assessment.learning}
结果导向：${assessment.result}

参考分数：
总分：${match.total}/100
分项：${match.parts.map((item) => `${item.label}${item.score}`).join("，")}

本地初步风险提示：
${match.risks.map((item) => `- ${item}`).join("\n")}

岗位能力库参考：
匹配到的岗位模型：${knowledge.capability.role}
必备能力：${knowledge.capability.coreSkills.join("、")}
加分能力：${knowledge.capability.bonusSkills.join("、")}
岗位需要的证据：${knowledge.capability.proofExamples.join("、")}
常见风险：${knowledge.capability.risks.join("、")}
更稳妥的过渡岗位：${knowledge.capability.starterRoles.join("、")}
补强路径：${knowledge.capability.growthPath.join("；")}

城市机会库参考：
当前城市机会：${
    knowledge.currentCity
      ? `${knowledge.currentCity.city}，优势行业：${knowledge.currentCity.strongIndustries.join("、")}；适合岗位：${knowledge.currentCity.suitableRoles.join("、")}；注意：${knowledge.currentCity.cautions.join("、")}`
      : "暂无本地城市库数据，请基于用户资料谨慎判断"
  }
目标城市机会：${
    knowledge.targetCity
      ? `${knowledge.targetCity.city}，优势行业：${knowledge.targetCity.strongIndustries.join("、")}；适合岗位：${knowledge.targetCity.suitableRoles.join("、")}；注意：${knowledge.targetCity.cautions.join("、")}`
      : "暂无目标城市库数据，请基于 JD、行业和常识谨慎判断"
  }

简历证据提取：
量化结果：${knowledge.evidence.quantifiedResults.join("、") || "未发现"}
项目信号：${knowledge.evidence.projectSignals.join("、") || "未发现"}
管理信号：${knowledge.evidence.managementSignals.join("、") || "未发现"}
沟通信号：${knowledge.evidence.communicationSignals.join("、") || "未发现"}
数据信号：${knowledge.evidence.dataSignals.join("、") || "未发现"}
缺失证据：${knowledge.evidence.missingEvidence.join("、") || "暂未发现明显缺失"}

信息不足时优先追问：
${knowledge.questions.map((item) => `- ${item}`).join("\n") || "- 当前信息足够生成初步分析"}
`;
}

export async function runCareerAiAnalysis(state: AppState) {
  const { apiKey, baseUrl, model } = state.aiConfig;
  if (!apiKey.trim()) {
    throw new Error("请先在设置里填写 AI API Key。");
  }

  const messages = [
    {
      role: "system",
      content:
        "你是求职决策产品里的职业诊断引擎，不是通用聊天助手。输出要有判断、有取舍、有行动标准。你可以明确不推荐某岗位，但必须给出非歧视性的原因、替代路径和可执行补强动作。"
    },
    {
      role: "user",
      content: buildCareerPrompt(state)
    }
  ];

  if (isTauri()) {
    return invoke<string>("chat_completion", {
      request: {
        api_key: apiKey.trim(),
        base_url: normalizeAiBaseUrl(baseUrl),
        model: model || "gpt-4.1-mini",
        temperature: 0.35,
        messages
      }
    });
  }

  const normalizedBaseUrl = normalizeAiBaseUrl(baseUrl);
  if (normalizedBaseUrl !== "https://api.openai.com/v1" && !isTauri()) {
    throw new Error("浏览器预览模式目前只建议使用默认 OpenAI 地址。若要接第三方 Base URL，请切换到桌面版运行。");
  }

  let response: Response;
  try {
    response = await fetch(getBrowserEndpoint(baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: model || "gpt-4.1-mini",
        temperature: 0.35,
        messages
      })
    });
  } catch (error) {
    throw new Error(explainNetworkError(error));
  }

  if (!response.ok) {
    const detail = await readProviderError(response);
    if (response.status === 401) {
      throw new Error(withProviderDetail("AI 请求失败：API Key 无效或没有权限，请检查设置里的 Key。", detail));
    }
    if (response.status === 404) {
      throw new Error(withProviderDetail("AI 请求失败：Base URL 或模型名称不正确，请检查设置。", detail));
    }
    if (response.status === 429) {
      throw new Error(withProviderDetail("AI 请求失败：额度不足或请求过快，请稍后再试或更换 Key。", detail));
    }
    throw new Error(withProviderDetail(`AI 请求失败：HTTP ${response.status}。`, detail));
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "AI 没有返回有效内容，请检查模型名称或服务商响应格式。";
}

function parseResumeImportPreviewFromText(text: string): ResumeImportPreview {
  const cleaned = text
    .replace(/\r\n/g, "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const fields = [
    { label: "姓名", value: extractFieldValue(text, ["姓名", "昵称", "name"]) },
    { label: "当前城市", value: extractFieldValue(text, ["当前城市", "城市", "现居", "location"]) },
    { label: "目标岗位", value: extractFieldValue(text, ["目标岗位", "求职目标", "应聘", "岗位", "position"]) },
    { label: "期望薪资", value: extractFieldValue(text, ["期望薪资", "薪资", "工资", "salary"]) },
    { label: "工作年限", value: extractFieldValue(text, ["工作年限", "年限", "经验", "years"]) },
    { label: "学历", value: extractFieldValue(text, ["学历", "education", "学位"]) }
  ].filter((item) => item.value);
  const sections: ResumeImportPreview["sections"] = [];
  const addSection = (title: string, keywords: string[]) => {
    const items = cleaned.filter((line) => keywords.some((keyword) => line.includes(keyword))).slice(0, 4);
    if (items.length) sections.push({ title, items });
  };
  addSection("基本信息", ["姓名", "城市", "学历", "年限", "电话", "邮箱"]);
  addSection("求职目标", ["目标岗位", "求职", "薪资", "城市", "期望"]);
  addSection("工作经历", ["负责", "运营", "客服", "项目", "数据", "销售", "活动", "管理"]);
  addSection("量化结果", ["提升", "降低", "完成", "转化", "增长", "人数", "金额", "效率", "满意度"]);
  addSection("项目/作品", ["项目", "作品", "证书", "课程", "复盘", "案例"]);
  const missing = [
    !/目标岗位|求职目标|想做|应聘/.test(text) ? "缺少明确求职目标" : "",
    !/\d|%|万|千|人|次|个|k|K/.test(text) ? "缺少量化结果" : "",
    !/项目|作品|案例|复盘|证书/.test(text) ? "缺少项目/作品/证据" : "",
    !/城市|通勤|加班|出差|薪资|底线/.test(text) ? "缺少真实限制和求职边界" : ""
  ].filter(Boolean);
  return {
    summary: sections.length ? `已识别出 ${sections.length} 个主要模块，适合继续补强和改写。` : "未识别出明显结构，建议使用模板或更完整的文本简历。",
    fields,
    sections: sections.length ? sections : [{ title: "原始简历", items: cleaned.slice(0, 8) }],
    missing
  };
}

function extractFieldValue(text: string, keys: string[]) {
  for (const key of keys) {
    const pattern = new RegExp(`(?:${escapeRegExp(key)})[:：\\s\\-]*([^\\n]{1,48})`, "i");
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function runResumeImportAnalysis(rawResume: string, aiConfig?: AppState["aiConfig"]): Promise<ResumeImportPreview> {
  const trimmed = rawResume.trim();
  if (!trimmed) {
    throw new Error("请先粘贴或导入简历文本。");
  }

  const localPreview = parseResumeImportPreviewFromText(trimmed);
  if (!aiConfig?.apiKey.trim() || !aiConfig.allowSensitiveAi) {
    return localPreview;
  }
  const messages = [
    {
      role: "system",
      content: "你是简历结构识别助手。请把输入简历整理成结构化摘要，输出简短、准确、可用于后续优化的结果。"
    },
    {
      role: "user",
      content: `请从下面简历中识别：基本信息、求职目标、工作经历、项目/作品、量化结果、缺失证据，并给出一段简短总结。\n\n简历内容：\n${trimmed}`
    }
  ];

  try {
    if (isTauri()) {
      const text = await invoke<string>("chat_completion", {
        request: {
          api_key: aiConfig.apiKey.trim(),
          base_url: normalizeAiBaseUrl(aiConfig.baseUrl || "https://api.openai.com/v1"),
          model: aiConfig.model || "gpt-4.1-mini",
          temperature: 0.2,
          messages
        }
      });
      return {
        summary: text.slice(0, 120),
        fields: localPreview.fields,
        sections: localPreview.sections,
        missing: localPreview.missing
      };
    }
  } catch {
    return localPreview;
  }

  return localPreview;
}

export async function testAiConnection(state: AppState) {
  const { apiKey, baseUrl, model } = state.aiConfig;
  if (!apiKey.trim()) {
    throw new Error("请先填写 AI API Key。");
  }
  if (!normalizeAiBaseUrl(baseUrl).startsWith("http")) {
    throw new Error("Base URL 需要以 http:// 或 https:// 开头。示例：https://api.openai.com/v1");
  }
  const messages = [
    { role: "system", content: "你是一个连接测试助手。" },
    { role: "user", content: "请只回复 OK，用于测试连接。" }
  ];

  if (isTauri()) {
    await invoke<string>("chat_completion", {
      request: {
        api_key: apiKey.trim(),
        base_url: normalizeAiBaseUrl(baseUrl),
        model: model || "gpt-4.1-mini",
        temperature: 0,
        messages
      }
    });
    return "连接成功，模型可以正常响应。";
  }

  const normalizedBaseUrl = normalizeAiBaseUrl(baseUrl);
  if (normalizedBaseUrl !== "https://api.openai.com/v1") {
    throw new Error("浏览器预览模式目前只建议测试默认 OpenAI 地址；第三方 Base URL 请用桌面版测试。");
  }

  let response: Response;
  try {
    response = await fetch(getBrowserEndpoint(baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: model || "gpt-4.1-mini",
        temperature: 0,
        messages
      })
    });
  } catch (error) {
    throw new Error(explainNetworkError(error));
  }

  if (!response.ok) {
    const detail = await readProviderError(response);
    throw new Error(withProviderDetail(`AI 连接测试失败：HTTP ${response.status}。`, detail));
  }
  return "连接成功，模型可以正常响应。";
}
