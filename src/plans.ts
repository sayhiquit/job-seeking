import { buildDecisionPath } from "./analysis";
import { buildKnowledgeContext } from "./knowledge";
import type { AppState } from "./types";

export function buildCapabilityPlanItems(
  state: AppState,
  decisionPath: ReturnType<typeof buildDecisionPath>,
  knowledge: ReturnType<typeof buildKnowledgeContext>
) {
  const target = state.targetJob.role && !state.targetJob.role.includes("不确定") ? state.targetJob.role : decisionPath.alternatives[0] || "目标岗位";
  const proof = knowledge.capability.proofExamples.slice(0, 4);
  const core = knowledge.capability.coreSkills.slice(0, 4);
  return [
    `能力补强：围绕 ${target} 先补 ${core.join("、") || "岗位核心能力"}，不要同时学太多。`,
    `证据补强：至少准备 ${proof.join("、") || "一个完整项目案例"} 中的 1-2 个证据。`,
    `作品/案例：做一份和 ${target} 相关的复盘或作品，写清背景、目标、动作、结果、复盘。`,
    "面试故事：准备 3 个故事，分别证明执行结果、沟通协作、学习补强。",
    `时间安排：按你填写的“${state.careerIntent.learningBudget || "未填写学习时间"}”拆成 7 天补证据、14 天做作品、30 天投递验证。`,
    `边界提醒：${decisionPath.risks[0] || "不要把没有做过的经历硬包装成目标岗位经验。"}`
  ];
}

export function buildResumeExecutionItems(
  state: AppState,
  decisionPath: ReturnType<typeof buildDecisionPath>,
  knowledge: ReturnType<typeof buildKnowledgeContext>
) {
  const target = state.targetJob.role && !state.targetJob.role.includes("不确定") ? state.targetJob.role : decisionPath.alternatives[0] || "目标岗位";
  const missing = knowledge.evidence.missingEvidence.slice(0, 3);
  const quantified = knowledge.evidence.quantifiedResults.slice(0, 3);
  return [
    `简历标题：改成“${target}｜${state.profile.years || "相关"}经验｜${state.targetJob.city || state.profile.city || "目标城市"}”，第一眼对齐岗位。`,
    "第一屏摘要：用 3 行写清楚目标岗位、可迁移能力、最强结果，不要只写性格评价。",
    quantified.length ? `已有数字要前置：${quantified.join("、")}，放进经历开头或个人优势摘要。` : "必须补数字：人数、金额、周期、效率、转化率、满意度、交付数量至少补 2 类。",
    missing.length ? `缺失证据要补：${missing.join("、")}。补不出来就先投过渡岗位，不要硬冲高要求岗位。` : "当前缺失证据不明显，重点把每段经历改成“目标-动作-结果-复盘”。",
    "经历改写：每段按“为了【目标】，我负责【动作】，使用【工具/方法】，带来【结果】”重写。",
    "投递版本：保留目标岗位版、过渡岗位版、方向探索版 3 份简历，不同岗位不要用同一份。"
  ];
}

export function buildStudentPlanItems(state: AppState, decisionPath: ReturnType<typeof buildDecisionPath>) {
  const student = state.studentProfile;
  const major = student.major;
  const evidenceText = [
    student.courseProjects,
    student.campusExperience,
    student.competitions,
    student.partTimeExperience,
    student.portfolio
  ].join(" ");
  const hasInternship = !student.hasInternship.includes("没有") && !student.hasInternship.includes("完全空白");
  const hasProject = /项目|课程|毕设|论文|调研|报告|作品|原型|代码|数据|公众号|视频|海报/.test(evidenceText);
  const hasPeopleWork = /社团|班委|学生会|志愿|家教|门店|推广|客服|销售|活动|组织|协调/.test(evidenceText);
  const wantsTech = /计算机|软件|人工智能|电子信息|自动化/.test(major);
  const wantsBusiness = /营销|工商|电商|经济|金融|会计|财务|人力|行政|公共管理/.test(major);
  const wantsContent = /设计|传媒|新闻|广告|艺术|语言/.test(major);
  const needsIncomeFast = student.familySupport.includes("经济压力") || student.cityBudget.includes("需要尽快有收入");
  const lowBudget = student.cityBudget.includes("预算有限") || student.cityBudget.includes("本地");

  const directRoles = [
    hasPeopleWork ? "运营助理/社群运营/活动执行：能把校园活动、社团、志愿、兼职转成执行和沟通证据。" : "",
    wantsBusiness ? "人事行政助理/招聘助理/商务助理：专业相关度较高，适合作为第一份实习或校招入口。" : "",
    wantsTech && hasProject ? "测试助理/实施助理/数据助理：用课程项目、代码、报告或工具能力证明基础。" : "",
    wantsContent && hasProject ? "新媒体助理/内容运营/设计助理：用作品集、推文、视频、海报或策划案证明能力。" : "",
    needsIncomeFast ? "客服/销售助理/门店运营：更容易快速拿到面试和收入，但要筛掉高压、纯电销和无保障岗位。" : "",
    "通用低风险入口：运营助理、行政助理、招聘助理、教务助理、客服运营、项目助理。"
  ].filter(Boolean);

  const evidence = [
    hasProject ? "课程项目/毕设/调研可以写成：背景、目标、你负责的部分、工具方法、交付物、结果。" : "目前课程项目证据不足，优先补一份岗位相关作品或课程项目复盘。",
    hasPeopleWork ? "校园/兼职经历可以转成沟通、组织、服务、销售、执行、抗压和复盘证据。" : "缺少人与事的实践经历，建议补一次校园活动、志愿、兼职、社群运营或模拟项目。",
    hasInternship ? "已有实践基础，简历不要只写岗位名，要写具体任务、规模、数据和你的个人贡献。" : "没有实习时不要写空话，把课程、社团、兼职、竞赛和作品当成第一层证据。",
    student.portfolio && !student.portfolio.includes("没有") && !student.portfolio.includes("暂无") ? "已有作品材料，下一步要按目标岗位整理成可打开、可复述、可面试讲解的作品集。" : "作品集缺口明显，至少补 1 个可展示材料：报告、原型、文章、视频、海报、数据分析或代码项目。"
  ];

  const portfolioRoles = [
    "产品助理：先补竞品分析、需求文档、原型图和用户调研小报告。",
    "数据分析助理：先补 Excel/SQL/可视化小项目，用公开数据做一份分析报告。",
    "新媒体/内容运营：先补 3 篇文章、3 条短视频脚本或 1 份账号拆解报告。",
    "前端/测试/技术支持：先补 GitHub/项目截图/测试用例/接口文档/部署说明。",
    "设计助理：先补作品集，不要只写会软件。"
  ];

  const riskyRoles = [
    "不建议直接硬冲高要求产品经理、数据分析师、开发工程师、品牌策划等岗位，除非已经有作品或项目证据。",
    "不建议为了快速就业盲投高压纯销售、无底薪提成、长期外派或不签合同岗位。",
    "如果目标城市生活成本高但预算有限，不建议裸辞/裸去，应先拿实习或 offer 再迁移。",
    decisionPath.risks[0] || "不要把课程参与、团队成果硬包装成独立负责。"
  ];

  const cityStrategy = [
    lowBudget ? "优先学校所在城市、家附近或低成本新一线/二线城市，先拿第一段经历。" : "可以尝试一线/新一线城市实习和校招，但要控制房租、通勤和试错周期。",
    state.targetJob.city ? `目标城市是 ${state.targetJob.city}，建议先用招聘软件验证实习/应届岗位数量和薪资区间。` : "目标城市未定时，先按岗位机会筛城市，不要只凭城市名选择。",
    wantsTech || wantsContent ? "作品型岗位更适合去机会密集城市或远程实习，但必须带作品投递。" : "通用职能岗位本地也能起步，第一份经历比城市名更重要。",
    needsIncomeFast ? "经济压力较大时，先选能稳定入职的岗位，再用 3-6 个月补作品和转方向。" : "如果试错空间尚可，可以用 1-2 个月集中补作品后再投更理想方向。"
  ];

  const timeline = [
    "第 1 周：确定 2-3 个方向，各找 5 个真实 JD，对比要求、薪资、城市和作品门槛。",
    "第 2 周：把课程/社团/兼职整理成 3 个案例，每个案例写清目标、动作、结果、复盘。",
    "第 3-4 周：围绕目标方向做 1 个作品或报告，并把简历第一屏改成应届岗位版。",
    "第 5-6 周：每天投递 5-10 个实习/校招/助理岗位，记录回复率并调整关键词。",
    "第 7 周以后：如果目标方向无回应，先投更低门槛入口岗位，拿第一段真实经历。"
  ];

  return {
    directRoles: directRoles.length ? directRoles : ["先从运营助理、行政助理、招聘助理、客服运营、教务助理、项目助理里选 2-3 个低门槛入口验证市场。"],
    evidence,
    portfolioRoles,
    riskyRoles,
    cityStrategy,
    timeline
  };
}
