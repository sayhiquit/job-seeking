import type { Dispatch, ReactNode, SetStateAction } from "react";
import { BadgeCheck, BriefcaseBusiness, Building2, ClipboardList, FileText, Gauge, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { assessmentQuestions, industries, rolesByIndustry } from "./data";
import type { AppState } from "./types";

export type QuestionType = "text" | "textarea" | "select" | "assessment" | "chips";
export type Question = {
  id: string;
  moduleId: string;
  title: string;
  helper: string;
  type: QuestionType;
  required?: boolean;
  options?: string[];
  value: (state: AppState) => string;
  save: (value: string, setState: Dispatch<SetStateAction<AppState>>) => void;
};
export type Module = { id: string; label: string; icon: ReactNode; questions: Question[] };

const flexibilityOptions = ["接受阶段性加班但不接受长期高强度", "接受跨行业转岗", "接受通勤60分钟内", "优先稳定岗位", "接受短期降薪换长期机会", "接受从助理/初级岗过渡", "接受先做外包/项目制", "接受先做线下/门店岗", "需要固定下班或低加班", "可以接受混合办公/远程协作"];
const cityOptions = [
  "北京", "上海", "广州", "深圳", "杭州", "成都", "重庆", "武汉", "南京", "苏州",
  "西安", "长沙", "郑州", "青岛", "天津", "合肥", "宁波", "佛山", "东莞", "无锡",
  "厦门", "福州", "泉州", "漳州", "莆田", "南昌", "济南", "大连", "沈阳", "长春",
  "哈尔滨", "太原", "石家庄", "昆明", "贵阳", "南宁", "海口", "珠海", "中山", "惠州",
  "常州", "嘉兴", "绍兴", "温州", "金华", "台州", "南通", "徐州", "扬州", "烟台",
  "潍坊", "洛阳", "佛山/顺德", "北京-海淀/朝阳/西城", "上海-浦东/徐汇/静安", "深圳-南山/福田/龙岗", "杭州-滨江/余杭/西湖",
  "广州-天河/海珠/番禺", "厦门-思明/湖里/集美", "福州-鼓楼/台江/仓山", "成都-高新/武侯/锦江", "武汉-洪山/武昌/江汉",
  "苏州-工业园/吴中/高新", "当前县城/地级市", "暂不确定"
];
const yearOptions = ["无经验/应届", "1年以内", "1-3年", "3-5年", "5-8年", "8-10年", "10年以上"];
const salaryOptions = ["只要尽快就业，薪资可谈", "4k以下", "4k-6k", "6k-8k", "8k-10k", "10k-15k", "15k-20k", "20k-30k", "30k以上", "希望不低于上一份收入", "暂不确定"];
const jobStatusOptions = ["在职看机会", "已离职，尽快找工作", "应届/实习找工作", "转行探索", "职业空窗后重新求职", "被裁/合同到期", "想换城市发展", "暂时只是了解方向"];
const urgencyOptions = ["马上需要工作，经济压力较大", "1个月内希望入职", "1-2个月内找到更好", "3个月内慢慢看", "不急，先找方向", "先骑驴找马"];
const mainGoalOptions = ["涨薪", "尽快就业", "先拿到稳定 offer", "工作更稳定", "离家近/通勤短", "减少加班", "转行", "换城市发展", "获得成长和晋升", "离开高压环境", "找更适合性格的工作", "兼顾家庭/带娃", "先明确职业方向", "验证目标岗位是否真的适合", "把简历证据补清楚"];
const bottomLineOptions = ["长期高强度加班", "频繁出差", "强销售/强业绩压力", "倒班/夜班", "收入波动大", "通勤超过60分钟", "离家太远", "没有社保/合同不规范", "试用期目标不清楚", "纯体力或重复机械工作", "管理混乱经常救火", "需要大量酒局应酬", "明显违法违规或灰色业务", "暂时没有明显底线"];
const workStyleOptions = ["稳定清晰的流程", "能独立完成任务", "与人沟通协作", "服务客户/用户", "数据分析和复盘", "创意内容/表达", "现场执行/动手操作", "项目推进和协调", "带新人/带团队", "学习新工具新技术", "目标明确按结果评价", "有反馈和复盘机制", "少一点复杂人际关系"];
const avoidWorkOptions = ["纯电话销售", "陌生拜访", "长期站立/体力活", "大量重复录入", "强制直播/露脸", "频繁外派驻场", "长期夜班倒班", "高压客服投诉", "复杂办公室政治", "没有成长空间", "暂时说不清"];
const familyContextOptions = ["无特殊现实限制", "需要接送孩子/带娃", "单亲或主要照护孩子", "需要照顾老人或家人", "离异后需要更稳定收入", "经济压力较大，不能长期试错", "身体/健康原因不能高强度", "需要兼顾学习/考证", "只能本地就业", "可补充其他情况"];
const strengthOptions = ["沟通表达", "执行力", "学习快", "抗压强", "细心稳定", "服务意识", "数据分析", "销售成交", "内容创作", "组织协调", "带团队", "技术/工具能力", "熟悉某个行业", "暂时说不清"];
const weakPointOptions = ["学历不占优势", "经验年限不足", "没有量化成果", "缺少可展示作品/案例", "面试表达弱", "简历不会写", "目标不明确", "转行跨度大", "年龄/空窗焦虑", "不擅长社交", "抗压一般", "不能加班出差", "证书/技能不足", "城市机会少", "不知道怎么验证市场", "暂时说不清"];
const companyPreferenceOptions = ["大公司/规范平台", "中小公司但成长快", "国企/事业单位/稳定平台", "互联网/科技公司", "制造/实体行业", "教育/医疗/民生行业", "本地生活/门店连锁", "外企/跨境业务", "创业公司", "远程/灵活办公", "不挑公司，先就业", "暂不确定"];
const roleLevelOptions = ["实习/应届/助理", "初级执行岗", "有经验专员", "高级专员/骨干", "主管/带小团队", "经理/负责人", "想先降一级过渡", "只接受不降级", "暂不确定"];
const learningBudgetOptions = ["几乎没时间，只能边工作边学", "每天30分钟以内", "每天1小时左右", "每天2小时以上", "可以集中学习2-4周", "可以脱产学习1-3个月", "只接受入职后学习", "暂不确定"];
const obstacleOptions = ["不知道适合做什么", "投简历没回应", "面试过不了", "薪资谈不上去", "年龄/空窗被问", "想转行但没经验", "简历没有亮点", "不知道怎么写项目证据", "不知道该投哪些公司", "缺少面试反馈", "城市机会少", "家庭/通勤限制多", "岗位要求看不懂", "害怕选错方向", "暂时没有明显障碍"];
const studentGradeOptions = ["大一/大二，先探索方向", "大三/研二，开始找实习", "大四/研三，准备校招", "已毕业未就业", "专升本/考研后重新规划", "暂不确定"];
const studentMajorOptions = ["计算机/软件/人工智能", "电子信息/自动化/机械", "设计/传媒/新闻/广告", "市场营销/工商管理/电商", "会计/财务/金融/经济", "人力资源/行政/公共管理", "教育/心理/语言类", "医学/护理/药学", "土木/建筑/工程管理", "物流/供应链/国贸", "法学/社会学/文史哲", "艺术/体育/音乐", "专业不喜欢，想换方向", "暂不确定/想让系统结合课程和兴趣判断"];
const schoolLevelOptions = ["985/211/双一流", "普通本科/大专/高职", "民办/独立学院", "硕士及以上", "学历不占优势，希望靠作品和实习补", "暂不想填写"];
const internshipOptions = ["没有正式实习", "有一段短实习但含金量不高", "有相关实习", "只有兼职/校园推广/家教/门店经历", "只有课程项目/社团项目", "完全空白"];
const studentFirstJobOptions = ["先找能入门、能积累经验的岗位", "优先专业相关，薪资可以低一点", "优先薪资和城市，不强求专业对口", "想进互联网/科技/电商方向", "想稳定，考虑国企/事业单位/学校/本地公司", "想考公考编但也准备就业备选", "想先实习再决定方向", "暂不确定"];
const cityBudgetOptions = ["预算有限，优先低成本城市或家附近", "能承担一线/新一线短期成本", "家里支持有限，需要尽快有收入", "可以接受异地实习/校招", "只接受本地或学校所在城市", "暂不确定"];
const familySupportOptions = ["家里能支持一段时间，但希望尽快就业", "经济压力较大，需要尽快收入", "家里希望稳定/考公/本地", "可以自由选择城市和行业", "需要兼顾家庭或回家发展", "暂不确定"];
export const resumeTemplate = [
  "【基本信息】",
  "姓名/昵称：",
  "当前城市：",
  "工作年限：",
  "学历：",
  "",
  "【求职目标】",
  "目标岗位：",
  "目标城市：",
  "期望薪资：",
  "不能接受：如长期高强度加班/频繁出差/远通勤/收入波动",
  "",
  "【个人优势摘要】",
  "用 3 句话写清楚：我做过什么、擅长什么、能为目标岗位带来什么结果。",
  "",
  "【工作经历 1】",
  "公司/行业：",
  "岗位：",
  "时间：",
  "主要任务：",
  "可量化结果：人数/金额/周期/效率/转化率/满意度/交付数量",
  "使用工具/方法：",
  "最能证明目标岗位能力的案例：",
  "",
  "【工作经历 2】",
  "公司/行业：",
  "岗位：",
  "时间：",
  "主要任务：",
  "可量化结果：",
  "使用工具/方法：",
  "最能证明目标岗位能力的案例：",
  "",
  "【项目/作品/证书】",
  "项目或作品：",
  "你负责的部分：",
  "结果或交付物：",
  "证书/课程/工具：",
  "",
  "【补充说明】",
  "空窗、转行、家庭/通勤限制、可投入学习时间等真实情况："
].join("\n");

export function buildModules(state: AppState): Module[] {
  if (state.role === "recruiter") {
    return [
      {
        id: "company",
        label: "岗位基本信息",
        icon: <Building2 />,
        questions: [
          textQuestion("r-company", "company", "公司名称", "用于报告展示和生成完整 JD。", (s) => s.recruiterJob.company, (value, setState) => updateRecruiter(setState, "company", value), true),
          textQuestion("r-title", "company", "招聘岗位名称", "例如用户运营、销售经理、行政主管。岗位名越明确，人才画像越准确。", (s) => s.recruiterJob.title, (value, setState) => updateRecruiter(setState, "title", value), true),
          textQuestion("r-department", "company", "所属部门/汇报对象", "例如增长运营部，向运营负责人汇报。用于判断协作压力和岗位层级。", (s) => s.recruiterJob.department, (value, setState) => updateRecruiter(setState, "department", value)),
          textQuestion("r-salary", "company", "薪资范围和结构", "例如 8k-12k、底薪+提成、13薪、试用期比例。薪资结构会影响候选人层级、稳定性和吸引力。", (s) => s.recruiterJob.salary, (value, setState) => updateRecruiter(setState, "salary", value))
        ]
      },
      {
        id: "goal",
        label: "招聘目的",
        icon: <ClipboardList />,
        questions: [
          selectQuestion("r-reason", "goal", "为什么现在要招这个岗位", "招聘原因会影响筛选重点：替补岗位看稳定和接手速度，新业务岗位看学习、开荒和不确定性承受力。", ["新增岗位，承担新业务/新目标", "替补离职员工，维持原有工作", "团队扩编，提高产能", "补齐某项专业能力", "储备人才，暂时不紧急", "岗位定位还不清晰"], (s) => s.recruiterJob.hiringReason, (value, setState) => updateRecruiter(setState, "hiringReason", value), true),
          selectQuestion("r-work-mode", "goal", "工作方式和强度", "工作方式必须提前说清，否则容易入职后预期不一致。", ["坐班，节奏稳定", "坐班，偶尔加班", "阶段性高强度/活动期加班", "需要频繁出差/外勤", "轮班/排班制", "远程或混合办公", "暂不确定"], (s) => s.recruiterJob.workMode, (value, setState) => updateRecruiter(setState, "workMode", value)),
          textQuestion("r-team", "goal", "团队结构和协作对象", "例如向谁汇报、和哪些部门配合、是否带人。", (s) => s.recruiterJob.teamStructure, (value, setState) => updateRecruiter(setState, "teamStructure", value)),
          textareaQuestion("r-tasks", "goal", "入职后最核心的 3-5 件事", "不要只写“负责日常工作”。请写清楚候选人入职后要交付什么、和谁协作、遇到什么压力。", (s) => s.recruiterJob.coreTasks, (value, setState) => updateRecruiter(setState, "coreTasks", value), true),
          textareaQuestion("r-metrics", "goal", "试用期/转正怎么判断做得好", "写 2-4 个可观察标准，例如转化率、到岗人数、客户满意度、交付周期、投诉率、GMV、回款、文档质量。", (s) => s.recruiterJob.successMetrics, (value, setState) => updateRecruiter(setState, "successMetrics", value))
        ]
      },
      {
        id: "standard",
        label: "人才标准",
        icon: <BriefcaseBusiness />,
        questions: [
          textareaQuestion("r-must", "standard", "必须具备的硬条件", "只写真正不能培养、没有就无法上岗的条件，例如证书、工具、行业经验、到岗时间。把“加分项”留给下一题。", (s) => s.recruiterJob.mustHave, (value, setState) => updateRecruiter(setState, "mustHave", value), true),
          textareaQuestion("r-soft", "standard", "可培养能力和加分项", "写可以面试验证、入职后培养的能力，例如沟通主动、复盘意识、服务意识、目标感、工具学习速度。", (s) => s.recruiterJob.softSkills, (value, setState) => updateRecruiter(setState, "softSkills", value)),
          textareaQuestion("r-deal", "standard", "明确不匹配的工作条件", "只写工作条件和岗位冲突，例如不能接受活动期加班、不能外勤、不能看数据；不要写年龄、性别、婚育、籍贯等身份标签。", (s) => s.recruiterJob.dealBreakers, (value, setState) => updateRecruiter(setState, "dealBreakers", value)),
          textareaQuestion("r-red", "standard", "面试中要验证的风险证据", "例如经历断层、成果归属不清、只会说概念、无法讲清案例。建议写成可追问的问题，而不是主观评价。", (s) => s.recruiterJob.redFlags, (value, setState) => updateRecruiter(setState, "redFlags", value))
        ]
      },
      {
        id: "jd",
        label: "JD与投放",
        icon: <FileText />,
        questions: [
          textareaQuestion("r-jd", "jd", "现有 JD / 招聘描述", "如果已经有 JD 就粘贴；没有也可以留空，系统会根据前面信息生成一版。", (s) => s.recruiterJob.jd, (value, setState) => updateRecruiter(setState, "jd", value)),
          textareaQuestion("r-sell", "jd", "真实岗位卖点", "写清楚能吸引候选人的真实优势，例如成长、稳定、资源、团队、薪资结构。不要写空话。", (s) => s.recruiterJob.sellingPoints, (value, setState) => updateRecruiter(setState, "sellingPoints", value)),
          textareaQuestion("r-keywords", "jd", "检索/投放关键词", "用于后续平台检索和投放。可写岗位、技能、行业、工具、成果词。", (s) => s.recruiterJob.searchKeywords, (value, setState) => updateRecruiter(setState, "searchKeywords", value))
        ]
      },
      {
        id: "screening",
        label: "批量筛简历",
        icon: <UsersRound />,
        questions: [
          selectQuestion(
            "r-screen-priority",
            "screening",
            "筛选时优先看什么",
            "不同岗位筛人逻辑不同。先选一个主排序依据，后面系统会同时保留风险点和追问建议。",
            ["优先匹配硬性门槛，再看成果证据", "优先看同岗位/同行业经验", "优先看量化成果和项目案例", "优先看稳定性和工作强度匹配", "优先看薪资和到岗速度", "优先看可培养潜力和学习速度", "先宽筛，保留更多候选人"],
            (s) => s.recruiterJob.screeningPriority,
            (value, setState) => updateRecruiter(setState, "screeningPriority", value)
          ),
          textareaQuestion(
            "r-candidate-batch",
            "screening",
            "批量粘贴候选人简历",
            "从 BOSS 等平台打开候选人简历后，复制已授权可查看的简历文本粘贴到这里。多个候选人用 --- 分隔，也可以直接连续粘贴，系统会尝试拆分并排序。",
            (s) => s.recruiterJob.candidateResume,
            (value, setState) => updateRecruiter(setState, "candidateResume", value)
          )
        ]
      }
    ];
  }

  const quick: Module[] = [
    {
      id: "intent",
      label: "快速诉求",
      icon: <ClipboardList />,
      questions: quickIntentQuestions()
    },
    {
      id: "resume",
      label: "简历经历",
      icon: <FileText />,
      questions: [
        textareaQuestion("resume", "resume", "粘贴简历或经历摘要", "不需要写得漂亮，真实写做过什么即可。系统会先从经历里反推更适合的方向。", (s) => s.resumeDraft, (value, setState) => setState((current) => ({ ...current, resumeDraft: value })), true)
      ]
    },
    {
      id: "target",
      label: "岗位目标",
      icon: <BriefcaseBusiness />,
      questions: quickTargetQuestions()
    }
  ];

  const student: Module[] = [
    {
      id: "student",
      label: "学生画像",
      icon: <BadgeCheck />,
      questions: studentQuestions()
    },
    {
      id: "student-evidence",
      label: "可转化经历",
      icon: <FileText />,
      questions: studentEvidenceQuestions()
    },
    {
      id: "intent",
      label: "第一份工作诉求",
      icon: <ClipboardList />,
      questions: quickIntentQuestions()
    },
    {
      id: "target",
      label: "方向/城市",
      icon: <BriefcaseBusiness />,
      questions: quickTargetQuestions()
    }
  ];

  if (state.detailMode === "student") return student;

  if (state.detailMode === "quick") return quick;

  return [
    {
      id: "profile",
      label: "基础情况",
      icon: <UserRound />,
      questions: [
        textQuestion("p-name", "profile", "姓名/昵称", "用于报告展示，不需要真实姓名。", (s) => s.profile.name, (value, setState) => updateProfile(setState, "name", value)),
        selectQuestion("p-city", "profile", "当前城市", "城市会影响通勤、迁移成本和机会判断。没有精确城市可先选“当前县城/地级市”。", cityOptions, (s) => s.profile.city, (value, setState) => updateProfile(setState, "city", value), true),
        selectQuestion("p-education", "profile", "学历", "用于判断岗位门槛和简历表达策略。", ["高中/中专", "大专", "本科", "硕士及以上"], (s) => s.profile.education, (value, setState) => updateProfile(setState, "education", value)),
        selectQuestion("p-years", "profile", "工作年限", "用于判断岗位层级、转岗难度和简历呈现方式。", yearOptions, (s) => s.profile.years, (value, setState) => updateProfile(setState, "years", value), true),
        selectQuestion("p-status", "profile", "求职状态", "不同状态会影响推荐策略：急找更重现实可行，在职更重匹配质量。", jobStatusOptions, (s) => s.profile.status, (value, setState) => updateProfile(setState, "status", value))
      ]
    },
    ...quick,
    {
      id: "reality",
      label: "真实情况",
      icon: <ShieldCheck />,
      questions: [
        selectQuestion("real-urgency", "reality", "求职紧急度", "越紧急，系统越会优先给现实可行路径。", urgencyOptions, (s) => s.profile.urgency, (value, setState) => updateProfile(setState, "urgency", value), true),
        chipsQuestion("real-family", "reality", "真实情况", "只用于判断通勤、稳定性、强度和时间冲突，不做歧视性判断。可多选。", familyContextOptions, (s) => s.profile.familyContext, (value, setState) => updateProfile(setState, "familyContext", value)),
        selectQuestion("real-care", "reality", "是否有照护责任", "只用于判断通勤、加班、出差和稳定性，不做歧视性判断。", ["无固定照护责任", "需要接送孩子/带娃", "需要照顾老人或家人", "有较强家庭责任，时间弹性有限"], (s) => s.profile.hasCareDuty, (value, setState) => updateProfile(setState, "hasCareDuty", value)),
        selectQuestion("real-commute", "reality", "通勤限制", "通勤限制会影响岗位推荐。", ["单程 30 分钟以内", "单程 60 分钟以内", "单程 90 分钟以内", "可接受长通勤"], (s) => s.profile.commuteLimit, (value, setState) => updateProfile(setState, "commuteLimit", value)),
        selectQuestion("real-overtime", "reality", "加班接受度", "用于判断高强度岗位是否冲突。", ["不接受长期高强度", "可接受阶段性加班，不接受长期高强度", "可以接受较高强度", "只接受稳定节奏"], (s) => s.profile.overtimeTolerance, (value, setState) => updateProfile(setState, "overtimeTolerance", value)),
        selectQuestion("real-travel", "reality", "出差接受度", "用于判断销售、项目、实施、外派类岗位风险。", ["不接受出差", "可接受偶尔出差", "可接受频繁出差", "看薪资和发展机会决定"], (s) => s.profile.travelTolerance, (value, setState) => updateProfile(setState, "travelTolerance", value)),
        chipsQuestion("real-flex", "reality", "可接受的弹性条件", "选择你能妥协的条件，系统会判断过渡岗位。", flexibilityOptions, (s) => s.profile.flexibility.join("||"), (value, setState) => updateProfile(setState, "flexibility", value ? value.split("||") : []))
      ]
    },
    {
      id: "personality",
      label: "性格问卷",
      icon: <Gauge />,
      questions: assessmentQuestions.map((question, index) => ({
        id: question.id,
        moduleId: "personality",
        title: `工作风格题 ${index + 1}`,
        helper: question.text,
        type: "assessment" as const,
        required: true,
        value: (s: AppState) => String(s.assessmentAnswers[question.id] || ""),
        save: (value: string, setState: Dispatch<SetStateAction<AppState>>) =>
          setState((current) => ({ ...current, assessmentAnswers: { ...current.assessmentAnswers, [question.id]: Number(value) || 3 } }))
      }))
    },
  ];
}

function targetQuestions(): Question[] {
  return [
    {
      id: "t-industry",
      moduleId: "target",
      title: "已有倾向行业",
      helper: "如果还不确定，选最接近过往经历或最想了解的一类即可；系统会结合诉求和简历再给替代方向。",
      type: "select",
      required: false,
      options: industries,
      value: (s) => s.targetJob.industry,
      save: (value, setState) =>
        setState((current) => ({
          ...current,
          targetJob: { ...current.targetJob, industry: value, role: current.targetJob.role || rolesByIndustry[value]?.[0] || "" }
        }))
    },
    {
      id: "t-role",
      moduleId: "target",
      title: "已有目标岗位",
      helper: "没有明确目标可以选“不确定”，系统会先判断你更适合哪些岗位，不会强行按一个岗位打分。",
      type: "select",
      required: false,
      options: [],
      value: (s) => s.targetJob.role,
      save: (value, setState) => updateTarget(setState, "role", value)
    },
    textQuestion("t-city", "target", "明确想去的城市", "没有明确城市可以留空。城市倾向请优先在“求职诉求”里填写。", (s) => s.targetJob.city, (value, setState) => updateTarget(setState, "city", value)),
    textQuestion("t-city-area", "target", "目标区域/商圈", "例如软件园、工业园、高新区、南山科技园、珠江新城。越具体，城市机会判断越细。", (s) => s.targetJob.cityArea, (value, setState) => updateTarget(setState, "cityArea", value)),
    selectQuestion("t-management", "target", "目标岗位是否偏管理", "只有当你已经在看具体岗位时才需要判断。", ["不确定", "不需要直接带人", "需要协同多人但不直接管理", "需要带新人/小团队", "明确管理岗/主管岗"], (s) => s.targetJob.managementLevel, (value, setState) => updateTarget(setState, "managementLevel", value)),
    selectQuestion("t-intensity", "target", "目标岗位工作强度", "如果不知道，可选“不确定”，系统会更多依据你的底线判断。", ["不确定", "节奏稳定", "节奏中等，偶尔加班", "高强度，经常加班", "强销售/强业绩压力"], (s) => s.targetJob.workIntensity, (value, setState) => updateTarget(setState, "workIntensity", value)),
    selectQuestion("t-travel", "target", "目标岗位出差要求", "如果不知道，可选“不确定”。", ["不确定", "不需要出差", "偶尔出差", "频繁出差", "驻场/外派"], (s) => s.targetJob.travelRequirement, (value, setState) => updateTarget(setState, "travelRequirement", value)),
    selectQuestion("t-city-op", "target", "你对目标城市机会的判断", "不知道可以选“不确定”，这不是必填结论。", ["不确定", "目标城市机会一般", "目标城市机会更好", "目标城市是核心发展城市", "当前城市机会更现实"], (s) => s.targetJob.cityOpportunity, (value, setState) => updateTarget(setState, "cityOpportunity", value)),
    textareaQuestion("t-market", "target", "招聘软件市场验证", "建议从 BOSS/智联/前程等软件搜索“城市+岗位”，记录岗位数量、薪资区间、常见要求、公司类型和集中区域。没有验证可留空。", (s) => s.targetJob.marketValidation || s.careerIntent.marketValidation, (value, setState) => {
      updateTarget(setState, "marketValidation", value);
      updateCareerIntent(setState, "marketValidation", value);
    }),
    selectQuestion("t-income", "target", "目标岗位收入稳定性", "不知道可以选“不确定”，不要为了填表乱猜。", ["不确定", "收入相对稳定", "底薪低但提成高", "收入波动较大", "短期可能降薪换发展"], (s) => s.targetJob.incomeStability, (value, setState) => updateTarget(setState, "incomeStability", value)),
    textareaQuestion("t-jd", "target", "已有岗位 JD / 招聘要求", "如果你已经看到具体岗位，就粘贴 JD；如果还迷茫，可以留空，让系统先基于诉求和简历推荐方向。", (s) => s.targetJob.jd, (value, setState) => updateTarget(setState, "jd", value))
  ];
}

function quickTargetQuestions(): Question[] {
  const keepIds = new Set(["t-industry", "t-role", "t-city", "t-jd"]);
  return targetQuestions().filter((question) => keepIds.has(question.id));
}

function studentQuestions(): Question[] {
  return [
    selectQuestion("stu-grade", "student", "你现在处于哪个阶段", "阶段会影响建议：低年级先探索，高年级优先实习/校招落地，已毕业则更重视尽快有收入。", studentGradeOptions, (s) => s.studentProfile.grade, (value, setState) => updateStudentProfile(setState, "grade", value), true),
    selectQuestion("stu-major", "student", "你的专业或最接近的方向", "不知道专业能做什么也没关系，系统会把专业、课程项目和兴趣拆成可投方向。", studentMajorOptions, (s) => s.studentProfile.major, (value, setState) => updateStudentProfile(setState, "major", value), true),
    textQuestion("stu-graduation", "student", "预计毕业时间", "例如 2027 年 6 月、已经毕业、还有一年毕业。", (s) => s.studentProfile.graduationTime, (value, setState) => updateStudentProfile(setState, "graduationTime", value)),
    selectQuestion("stu-school", "student", "学校/学历竞争力", "不是为了评价人，而是判断要不要用作品、证书、实习和项目补门槛。", schoolLevelOptions, (s) => s.studentProfile.schoolLevel, (value, setState) => updateStudentProfile(setState, "schoolLevel", value)),
    selectQuestion("stu-internship", "student", "目前实习/实践基础", "没有实习也能分析，系统会从课程、社团、兼职、作品里挖可转化经历。", internshipOptions, (s) => s.studentProfile.hasInternship, (value, setState) => updateStudentProfile(setState, "hasInternship", value), true),
    selectQuestion("stu-first-job", "student", "第一份工作最想优先满足什么", "这是学生模式最重要的判断依据之一。", studentFirstJobOptions, (s) => s.studentProfile.firstJobPreference, (value, setState) => updateStudentProfile(setState, "firstJobPreference", value), true),
    selectQuestion("stu-budget", "student", "城市和生活成本承受度", "用于判断是建议本地先起步，还是去机会更多的城市冲实习/校招。", cityBudgetOptions, (s) => s.studentProfile.cityBudget, (value, setState) => updateStudentProfile(setState, "cityBudget", value), true),
    selectQuestion("stu-family", "student", "家庭/经济支持情况", "只用于判断求职紧急度和试错空间，不做歧视性判断。", familySupportOptions, (s) => s.studentProfile.familySupport, (value, setState) => updateStudentProfile(setState, "familySupport", value))
  ];
}

function studentEvidenceQuestions(): Question[] {
  return [
    textareaQuestion("stu-course", "student-evidence", "课程项目/毕设/论文/调研", "没有实习时，这些就是最重要的简历证据。写课程名、做了什么、交付物、结果。", (s) => s.studentProfile.courseProjects, (value, setState) => updateStudentEvidence(setState, "courseProjects", value), true),
    textareaQuestion("stu-campus", "student-evidence", "社团/班委/学生会/志愿活动", "写你负责的事情，不要只写头衔。比如组织活动、拉赞助、做推文、协调同学、统计数据。", (s) => s.studentProfile.campusExperience, (value, setState) => updateStudentEvidence(setState, "campusExperience", value)),
    textareaQuestion("stu-competition", "student-evidence", "竞赛/证书/训练营", "写竞赛、证书、课程、训练营、作品证明。没有也可以写“暂无”。", (s) => s.studentProfile.competitions, (value, setState) => updateStudentEvidence(setState, "competitions", value)),
    textareaQuestion("stu-parttime", "student-evidence", "兼职/校园推广/家教/门店经历", "这些可以转成沟通、服务、销售、执行、抗压和稳定性证据。", (s) => s.studentProfile.partTimeExperience, (value, setState) => updateStudentEvidence(setState, "partTimeExperience", value)),
    textareaQuestion("stu-portfolio", "student-evidence", "作品集/个人项目/可展示材料", "如公众号文章、海报、视频、GitHub、原型、数据分析报告、调研报告、运营复盘。", (s) => s.studentProfile.portfolio, (value, setState) => updateStudentEvidence(setState, "portfolio", value))
  ];
}

function intentQuestions(): Question[] {
  return [
    selectQuestion(
      "i-clarity",
      "intent",
      "你现在对职业目标有多明确",
      "这会决定系统是做“目标岗位适配”，还是先帮你找方向。",
      ["还不明确，只知道想要更合适的工作", "有几个方向在犹豫", "有明确岗位，但不确定能不能做", "只想优化某个岗位的简历"],
      (s) => s.careerIntent.clarity,
      (value, setState) => updateCareerIntent(setState, "clarity", value),
      true
    ),
    chipsQuestion("i-main-goal", "intent", "这次换工作最想解决什么", "可多选。迷茫时不用先想岗位，先选你最想改善的现实问题。", mainGoalOptions, (s) => s.careerIntent.mainGoal, (value, setState) => updateCareerIntent(setState, "mainGoal", value), true),
    selectQuestion("i-income", "intent", "期望收入或最低可接受收入", "如果只知道想要多少钱，就先选这里；这是迷茫用户也能确定的重要约束。", salaryOptions, (s) => s.careerIntent.expectedIncome, (value, setState) => {
      updateCareerIntent(setState, "expectedIncome", value);
      updateProfile(setState, "targetSalary", value);
    }, true),
    selectQuestion("i-city", "intent", "城市和通勤倾向", "用于判断是否建议换城市、远程、同城过渡或缩短通勤。", ["只留当前城市", "优先当前城市，也可以听建议评估其他城市", "可以去一线/新一线城市", "可以跨城市，只看机会和收入", "只接受远程/同城", "暂不确定"], (s) => s.careerIntent.cityPreference, (value, setState) => {
      updateCareerIntent(setState, "cityPreference", value);
      updateProfile(setState, "canRelocate", value);
    }),
    chipsQuestion("i-bottom-line", "intent", "不能接受的工作条件", "可多选。系统会用这些作为硬性排除条件。", bottomLineOptions, (s) => s.careerIntent.bottomLine, (value, setState) => updateCareerIntent(setState, "bottomLine", value), true),
    chipsQuestion("i-style", "intent", "更喜欢怎样的工作方式", "可多选。用于判断你更适合沟通型、执行型、分析型、服务型还是管理型岗位。", workStyleOptions, (s) => s.careerIntent.preferredWorkStyle, (value, setState) => updateCareerIntent(setState, "preferredWorkStyle", value)),
    chipsQuestion("i-avoid", "intent", "明确不想做什么", "可多选。用于排除看似高薪但长期不适合的岗位。", avoidWorkOptions, (s) => s.careerIntent.avoidWork, (value, setState) => updateCareerIntent(setState, "avoidWork", value)),
    chipsQuestion("i-strengths", "intent", "你觉得自己比较有优势的地方", "可多选。不确定也可以选“暂时说不清”，AI 会结合简历再判断。", strengthOptions, (s) => s.careerIntent.strengths, (value, setState) => updateCareerIntent(setState, "strengths", value)),
    chipsQuestion("i-weak", "intent", "你担心自己的短板是什么", "可多选。系统会据此判断需要补能力、补证据还是调整岗位。", weakPointOptions, (s) => s.careerIntent.weakPoints, (value, setState) => updateCareerIntent(setState, "weakPoints", value)),
    chipsQuestion("i-company", "intent", "更倾向什么类型的公司", "可多选。不同公司类型对稳定性、成长、薪资、强度的影响很大。", companyPreferenceOptions, (s) => s.careerIntent.companyPreference, (value, setState) => updateCareerIntent(setState, "companyPreference", value)),
    selectQuestion("i-level", "intent", "能接受的岗位层级", "用于判断是直接冲目标岗，还是先用过渡岗位拿 offer。", roleLevelOptions, (s) => s.careerIntent.roleLevelPreference, (value, setState) => updateCareerIntent(setState, "roleLevelPreference", value)),
    selectQuestion("i-learning", "intent", "你能投入多少学习/补强时间", "决定建议是短期改简历、做作品，还是先找更近的岗位。", learningBudgetOptions, (s) => s.careerIntent.learningBudget, (value, setState) => updateCareerIntent(setState, "learningBudget", value)),
    chipsQuestion("i-obstacle", "intent", "目前求职最卡在哪里", "可多选。系统会把建议落到具体动作，而不是只说方向。", obstacleOptions, (s) => s.careerIntent.jobSearchObstacle, (value, setState) => updateCareerIntent(setState, "jobSearchObstacle", value)),
    selectQuestion("i-transition", "intent", "是否接受过渡岗位", "目标不明确或目标偏高时，过渡岗位可能更现实。", ["可以接受过渡岗位，但希望能靠近长期方向", "只接受和目标高度相关的岗位", "可以先稳定就业，再慢慢调整", "不接受降级或明显转弯", "可以接受短期降薪换长期机会", "只接受不降薪的机会"], (s) => s.careerIntent.transitionOpenness, (value, setState) => updateCareerIntent(setState, "transitionOpenness", value))
  ];
}

function quickIntentQuestions(): Question[] {
  const keepIds = new Set(["i-clarity", "i-main-goal", "i-income", "i-bottom-line", "i-obstacle"]);
  return intentQuestions().filter((question) => keepIds.has(question.id));
}

function textQuestion(id: string, moduleId: string, title: string, helper: string, value: Question["value"], save: Question["save"], required = false): Question {
  return { id, moduleId, title, helper, type: "text", required, value, save };
}

function textareaQuestion(id: string, moduleId: string, title: string, helper: string, value: Question["value"], save: Question["save"], required = false): Question {
  return { id, moduleId, title, helper, type: "textarea", required, value, save };
}

function selectQuestion(id: string, moduleId: string, title: string, helper: string, options: string[], value: Question["value"], save: Question["save"], required = false): Question {
  return { id, moduleId, title, helper, type: "select", options, required, value, save };
}

function chipsQuestion(id: string, moduleId: string, title: string, helper: string, options: string[], value: Question["value"], save: Question["save"], required = false): Question {
  return { id, moduleId, title, helper, type: "chips", options, required, value, save };
}

function updateProfile(setState: Dispatch<SetStateAction<AppState>>, key: keyof AppState["profile"], value: string | string[]) {
  setState((current) => ({ ...current, profile: { ...current.profile, [key]: value } }));
}

function updateCareerIntent(setState: Dispatch<SetStateAction<AppState>>, key: keyof AppState["careerIntent"], value: string) {
  setState((current) => ({ ...current, careerIntent: { ...current.careerIntent, [key]: value } }));
}

function updateStudentProfile(setState: Dispatch<SetStateAction<AppState>>, key: keyof AppState["studentProfile"], value: string) {
  setState((current) => ({ ...current, studentProfile: { ...current.studentProfile, [key]: value } }));
}

function updateStudentEvidence(setState: Dispatch<SetStateAction<AppState>>, key: keyof AppState["studentProfile"], value: string) {
  setState((current) => {
    const studentProfile = { ...current.studentProfile, [key]: value };
    const evidenceText = [
      studentProfile.courseProjects,
      studentProfile.campusExperience,
      studentProfile.competitions,
      studentProfile.partTimeExperience,
      studentProfile.certificates,
      studentProfile.portfolio
    ]
      .filter(Boolean)
      .join("\n\n");
    return { ...current, studentProfile, resumeDraft: evidenceText };
  });
}

function updateTarget(setState: Dispatch<SetStateAction<AppState>>, key: keyof AppState["targetJob"], value: string) {
  setState((current) => ({ ...current, targetJob: { ...current.targetJob, [key]: value } }));
}

function updateRecruiter(setState: Dispatch<SetStateAction<AppState>>, key: keyof AppState["recruiterJob"], value: string) {
  setState((current) => ({ ...current, recruiterJob: { ...current.recruiterJob, [key]: value } }));
}
