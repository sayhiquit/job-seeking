import type { AppState } from "./types";

export interface JobCapability {
  role: string;
  coreSkills: string[];
  bonusSkills: string[];
  proofExamples: string[];
  risks: string[];
  starterRoles: string[];
  growthPath: string[];
}

export interface CityOpportunity {
  city: string;
  strongIndustries: string[];
  suitableRoles: string[];
  fitFor: string[];
  cautions: string[];
}

export interface ResumeEvidence {
  quantifiedResults: string[];
  projectSignals: string[];
  managementSignals: string[];
  communicationSignals: string[];
  dataSignals: string[];
  missingEvidence: string[];
}

export const jobCapabilityLibrary: JobCapability[] = [
  {
    role: "用户运营",
    coreSkills: ["用户分层", "社群维护", "活动策划", "数据复盘", "用户反馈处理", "跨部门协作"],
    bonusSkills: ["SQL/BI 看数", "增长实验", "会员体系", "私域转化", "内容策划"],
    proofExamples: ["活动参与率提升", "用户留存提升", "社群活跃提升", "转化率提升", "用户反馈闭环案例"],
    risks: ["只有执行经历但没有复盘数据", "不会拆用户分层", "缺少完整活动案例", "沟通协作弱"],
    starterRoles: ["用户运营助理", "社群运营", "客服运营", "内容运营"],
    growthPath: ["先补一个活动复盘案例", "学习用户分层和基础数据分析", "准备一个用户增长或留存案例"]
  },
  {
    role: "产品经理",
    coreSkills: ["需求分析", "原型设计", "用户调研", "数据分析", "项目推进", "跨部门沟通"],
    bonusSkills: ["SQL", "A/B 测试", "增长模型", "商业化", "行业研究"],
    proofExamples: ["独立负责需求", "推动上线", "指标改善", "用户调研报告", "PRD/原型作品"],
    risks: ["只会提想法但没有落地项目", "沟通推进弱", "没有产品作品", "缺少数据意识"],
    starterRoles: ["产品助理", "项目助理", "实施顾问", "需求分析助理"],
    growthPath: ["做一个完整产品分析作品", "补 PRD 和原型案例", "准备项目推进中的冲突解决案例"]
  },
  {
    role: "销售顾问",
    coreSkills: ["客户开发", "需求挖掘", "销售跟进", "异议处理", "成交转化", "目标管理"],
    bonusSkills: ["CRM 使用", "行业客户资源", "大客户方案", "商务谈判"],
    proofExamples: ["成交金额", "客户数量", "转化率", "回款率", "复购率"],
    risks: ["抗压弱", "不接受收入波动", "不擅长陌生沟通", "没有销售闭环证据"],
    starterRoles: ["销售助理", "客服转销售", "渠道销售", "市场执行"],
    growthPath: ["先练客户沟通和跟进 SOP", "准备一个完整成交或转化案例", "明确能接受的薪资波动范围"]
  },
  {
    role: "招聘专员",
    coreSkills: ["岗位理解", "简历筛选", "电话沟通", "面试协调", "候选人维护", "招聘数据复盘"],
    bonusSkills: ["人才地图", "雇主品牌", "业务访谈", "招聘渠道运营"],
    proofExamples: ["招聘到岗人数", "面试转化率", "招聘周期缩短", "岗位画像梳理"],
    risks: ["沟通主动性不足", "抗压弱", "不了解业务", "没有数据复盘"],
    starterRoles: ["招聘助理", "人事专员", "行政人事", "客服转招聘"],
    growthPath: ["学习岗位画像拆解", "准备电话沟通话术", "补招聘漏斗数据意识"]
  },
  {
    role: "数据分析师",
    coreSkills: ["Excel/SQL", "指标体系", "数据清洗", "可视化", "业务理解", "分析报告"],
    bonusSkills: ["Python", "BI 工具", "实验分析", "统计基础", "增长分析"],
    proofExamples: ["分析报告", "看板作品", "指标改善", "业务决策支持案例"],
    risks: ["只会工具不会业务", "没有作品", "表达能力弱", "缺少数据闭环"],
    starterRoles: ["数据专员", "运营数据助理", "BI 助理", "业务分析助理"],
    growthPath: ["做一个公开数据分析作品", "补 SQL 和可视化", "准备一个业务问题分析案例"]
  },
  {
    role: "电商运营",
    coreSkills: ["商品运营", "活动报名", "店铺数据", "投放配合", "客服协同", "转化优化"],
    bonusSkills: ["直播运营", "短视频带货", "千川/直通车", "选品能力", "供应链理解"],
    proofExamples: ["GMV 提升", "转化率提升", "客单价提升", "复购提升", "活动 ROI 改善"],
    risks: ["只会上架维护但不会看数据", "不理解平台规则", "抗压弱", "不能接受大促加班"],
    starterRoles: ["电商运营助理", "商品运营助理", "直播运营助理", "客服转运营"],
    growthPath: ["补一个店铺诊断作品", "学习平台活动和基础投放指标", "准备大促或商品优化案例"]
  },
  {
    role: "客服主管",
    coreSkills: ["服务流程", "团队排班", "投诉处理", "质检培训", "数据复盘", "跨部门反馈"],
    bonusSkills: ["SOP 搭建", "服务体验优化", "客服系统", "新人培养"],
    proofExamples: ["满意度提升", "投诉率下降", "响应时长缩短", "质检分提升", "团队稳定"],
    risks: ["情绪消耗高", "排班可能影响家庭时间", "管理沟通不足", "只做一线没有带教证据"],
    starterRoles: ["资深客服", "客服质检", "客服培训", "客服运营"],
    growthPath: ["补投诉闭环案例", "整理一份客服 SOP", "准备带教或质检改进案例"]
  },
  {
    role: "项目经理",
    coreSkills: ["计划拆解", "进度推进", "风险管理", "跨部门协作", "会议纪要", "交付复盘"],
    bonusSkills: ["PMP/敏捷", "预算管理", "客户汇报", "行业方案"],
    proofExamples: ["按期交付", "风险闭环", "成本控制", "客户满意", "流程优化"],
    risks: ["抗压弱", "沟通推进弱", "没有完整项目经验", "不能接受临时变化"],
    starterRoles: ["项目助理", "实施支持", "PMO 助理", "交付助理"],
    growthPath: ["复盘一个完整项目", "学习项目计划和风险台账", "准备冲突协调案例"]
  },
  {
    role: "前端开发",
    coreSkills: ["HTML/CSS/JS", "React/Vue", "接口联调", "页面还原", "组件开发", "问题排查"],
    bonusSkills: ["TypeScript", "工程化", "性能优化", "小程序", "可视化"],
    proofExamples: ["上线项目", "组件库", "性能优化", "复杂表单", "真实业务页面"],
    risks: ["只有教程项目", "基础薄弱", "没有联调经验", "沟通需求能力弱"],
    starterRoles: ["前端实习/助理", "Web 制作", "低代码实施", "测试转前端"],
    growthPath: ["做 2 个可访问作品", "补 TS 和接口联调", "准备项目难点和排查过程"]
  },
  {
    role: "新媒体编辑",
    coreSkills: ["选题策划", "内容撰写", "账号运营", "热点判断", "数据复盘", "视觉协同"],
    bonusSkills: ["短视频脚本", "直播协同", "社群转化", "品牌调性", "投放配合"],
    proofExamples: ["阅读量提升", "涨粉", "转化", "爆款内容", "账号矩阵"],
    risks: ["只有兴趣没有作品", "不看数据", "抗压弱", "不能接受热点节奏"],
    starterRoles: ["内容运营助理", "新媒体助理", "文案编辑", "短视频运营助理"],
    growthPath: ["整理 5 篇代表作品", "复盘一个账号", "准备选题和数据复盘案例"]
  },
  {
    role: "行政运营",
    coreSkills: ["流程执行", "资料整理", "跨部门协调", "会议跟进", "供应商沟通", "制度落地"],
    bonusSkills: ["Excel", "OA/ERP", "活动支持", "费用管理", "合同流程"],
    proofExamples: ["流程效率提升", "资料准确率", "活动支持案例", "跨部门协调闭环"],
    risks: ["只写杂活没有结果", "细节质量不足", "沟通协调弱", "抗重复工作弱"],
    starterRoles: ["行政专员", "运营助理", "综合文员", "项目助理"],
    growthPath: ["整理一个流程优化案例", "补 Excel/表格能力", "准备跨部门协调案例"]
  },
  {
    role: "教务运营",
    coreSkills: ["学员服务", "排课协调", "家校沟通", "续费转化", "数据跟进", "问题处理"],
    bonusSkills: ["社群维护", "课程产品理解", "投诉处理", "活动运营"],
    proofExamples: ["续费率提升", "满意度提升", "投诉闭环", "班级稳定率"],
    risks: ["情绪消耗高", "晚间/周末工作", "沟通抗压不足", "没有服务案例"],
    starterRoles: ["教务专员", "班主任", "课程顾问助理", "客服运营"],
    growthPath: ["准备服务闭环案例", "补沟通话术", "学习基础转化和续费指标"]
  },
  {
    role: "客户成功",
    coreSkills: ["客户沟通", "需求理解", "产品使用指导", "续约跟进", "问题闭环", "数据复盘"],
    bonusSkills: ["SaaS 经验", "方案汇报", "CRM", "客户分层"],
    proofExamples: ["续约率", "客户满意度", "使用率提升", "流失挽回案例"],
    risks: ["不擅长沟通推进", "缺少产品理解", "抗压弱", "没有客户案例"],
    starterRoles: ["客服运营", "实施支持", "客户运营", "销售助理"],
    growthPath: ["补一个客户问题闭环案例", "学习 CRM 和客户分层", "准备续约/挽回故事"]
  },
  {
    role: "供应链运营",
    coreSkills: ["订单跟进", "库存管理", "供应商沟通", "交付协调", "数据表格", "异常处理"],
    bonusSkills: ["ERP/WMS", "外贸流程", "成本意识", "流程优化"],
    proofExamples: ["交付周期缩短", "库存准确率", "异常率下降", "成本优化"],
    risks: ["细节粗心", "抗压弱", "表格能力不足", "不接受现场/仓库协同"],
    starterRoles: ["订单专员", "采购助理", "物流调度", "仓储文员"],
    growthPath: ["补 Excel 和 ERP 基础", "准备异常处理案例", "复盘一次订单交付流程"]
  }
];

export const cityOpportunityLibrary: CityOpportunity[] = [
  {
    city: "上海",
    strongIndustries: ["金融", "外企", "品牌", "电商", "互联网运营", "供应链"],
    suitableRoles: ["用户运营", "品牌市场", "数据分析", "客户成功", "供应链运营"],
    fitFor: ["学历和表达较好", "希望做专业化岗位", "能接受较高生活成本"],
    cautions: ["竞争强", "通勤成本高", "生活成本高"]
  },
  {
    city: "杭州",
    strongIndustries: ["电商", "直播", "互联网运营", "内容", "产品", "本地生活"],
    suitableRoles: ["用户运营", "电商运营", "内容运营", "产品助理", "数据运营"],
    fitFor: ["想做运营/电商/内容", "愿意快速学习", "能接受业务变化"],
    cautions: ["运营岗位节奏较快", "部分岗位加班明显"]
  },
  {
    city: "深圳",
    strongIndustries: ["硬件", "跨境电商", "制造", "产品", "销售", "供应链"],
    suitableRoles: ["跨境运营", "供应链运营", "产品助理", "销售顾问", "项目协调"],
    fitFor: ["能接受市场化竞争", "目标感强", "想涨薪或接触产业链"],
    cautions: ["节奏快", "销售和跨境岗位收入波动可能较大"]
  },
  {
    city: "广州",
    strongIndustries: ["贸易", "服装", "美妆", "电商", "运营", "销售"],
    suitableRoles: ["电商运营", "内容运营", "销售顾问", "市场执行", "客服运营"],
    fitFor: ["想做消费品/电商/销售", "希望生活成本相对可控"],
    cautions: ["岗位质量差异大，需要筛选公司"]
  },
  {
    city: "北京",
    strongIndustries: ["互联网", "AI", "教育", "传媒", "政企", "产品"],
    suitableRoles: ["产品经理", "项目经理", "内容运营", "数据分析", "政企客户经理"],
    fitFor: ["学历背景较好", "希望接触平台型机会", "能接受强竞争"],
    cautions: ["竞争强", "通勤压力大", "部分行业波动大"]
  },
  {
    city: "苏州",
    strongIndustries: ["制造", "外企工厂", "供应链", "质量", "工程", "客服中心"],
    suitableRoles: ["生产计划", "质量工程", "供应链计划", "客服运营", "行政人事"],
    fitFor: ["重视稳定", "有家庭责任", "希望兼顾生活和工作"],
    cautions: ["互联网运营机会相对少，制造和外企岗位更集中"]
  },
  {
    city: "成都",
    strongIndustries: ["游戏", "研发", "交付", "客服运营", "共享中心", "区域总部"],
    suitableRoles: ["客服运营", "实施支持", "项目助理", "内容运营", "测试工程师"],
    fitFor: ["希望生活压力相对低", "想做稳定型岗位", "愿意从支持岗切入"],
    cautions: ["高薪岗位竞争集中，部分岗位薪资上限低于一线"]
  },
  {
    city: "武汉",
    strongIndustries: ["研发", "交付", "教育", "制造", "共享中心", "本地运营"],
    suitableRoles: ["实施顾问", "项目助理", "数据专员", "客服运营", "人事行政"],
    fitFor: ["想在中部城市稳定发展", "接受从支持或交付岗位切入"],
    cautions: ["高端岗位数量少于一线，需要看行业和公司"]
  },
  {
    city: "南京",
    strongIndustries: ["软件", "政企", "制造研发", "教育", "金融科技"],
    suitableRoles: ["实施顾问", "项目助理", "前端开发", "数据分析", "政企客户经理"],
    fitFor: ["希望在长三角稳定发展", "适合技术、交付、政企方向"],
    cautions: ["岗位层级分化明显，需区分外包、驻场和自研"]
  },
  {
    city: "西安",
    strongIndustries: ["软件外包", "军工配套", "教育", "交付", "客服中心"],
    suitableRoles: ["测试工程师", "实施支持", "客服运营", "数据专员", "项目助理"],
    fitFor: ["重视生活成本", "想先稳定就业", "愿意从交付或支持岗位切入"],
    cautions: ["高薪互联网岗位少于一线，需看公司质量"]
  },
  {
    city: "长沙",
    strongIndustries: ["内容传媒", "本地生活", "消费品", "新媒体", "客服运营"],
    suitableRoles: ["新媒体编辑", "内容运营", "客服运营", "市场执行", "电商运营"],
    fitFor: ["想做内容、传媒、本地消费", "希望生活压力相对可控"],
    cautions: ["内容岗位竞争强，薪资上限需要看平台和公司"]
  },
  {
    city: "青岛",
    strongIndustries: ["贸易", "制造", "物流", "旅游服务", "品牌消费"],
    suitableRoles: ["外贸助理", "供应链运营", "销售顾问", "客服运营", "行政人事"],
    fitFor: ["重视稳定和生活质量", "适合贸易、服务、制造相关经历"],
    cautions: ["互联网岗位少，跨行业转运营要谨慎"]
  },
  {
    city: "重庆",
    strongIndustries: ["制造", "汽车", "客服中心", "本地生活", "物流"],
    suitableRoles: ["客服运营", "行政运营", "物流调度", "销售顾问", "生产计划"],
    fitFor: ["希望生活成本可控", "重视稳定就业", "适合制造和服务类经验"],
    cautions: ["高薪互联网岗位有限，需注意岗位强度和薪资结构"]
  },
  {
    city: "郑州",
    strongIndustries: ["物流", "电商客服", "教育", "制造", "本地服务"],
    suitableRoles: ["客服运营", "教务运营", "行政人事", "电商运营助理", "物流调度"],
    fitFor: ["希望留中原城市", "急需稳定就业", "适合服务和运营支持方向"],
    cautions: ["薪资上限相对有限，需警惕低底薪高提成岗位"]
  },
  {
    city: "合肥",
    strongIndustries: ["新能源", "制造", "软件", "政企", "客服中心"],
    suitableRoles: ["实施支持", "项目助理", "行政运营", "质量文员", "客服运营"],
    fitFor: ["希望在长三角周边发展", "适合制造、交付、支持岗"],
    cautions: ["岗位差异较大，注意区分自研、外包和驻场"]
  },
  {
    city: "宁波",
    strongIndustries: ["外贸", "制造", "供应链", "港口物流", "消费品"],
    suitableRoles: ["外贸跟单", "供应链运营", "采购助理", "销售顾问", "行政运营"],
    fitFor: ["有贸易/制造/物流经验", "重视稳定和产业机会"],
    cautions: ["互联网岗位少，外贸岗位受行业周期影响"]
  },
  {
    city: "厦门",
    strongIndustries: ["软件信息服务", "跨境电商", "外贸", "旅游服务", "教育培训", "医疗健康", "品牌消费"],
    suitableRoles: ["跨境运营", "电商运营", "用户运营", "客服运营", "行政运营", "外贸跟单", "实施支持", "新媒体运营"],
    fitFor: ["希望在生活成本和城市舒适度之间平衡", "有外贸/电商/运营/客服/教育服务经历", "重视稳定但也希望有成长空间"],
    cautions: ["高薪岗位数量少于北上深杭", "互联网岗位更集中在软件园和电商/跨境方向", "旅游服务岗位季节性和周末节假日工作较明显", "外贸和跨境岗位受行业周期影响"]
  },
  {
    city: "福州",
    strongIndustries: ["政企软件", "数字福建", "金融服务", "教育", "医疗", "客服中心", "本地生活"],
    suitableRoles: ["实施顾问", "项目助理", "客服运营", "行政人事", "数据专员", "教务运营", "政企客户经理"],
    fitFor: ["希望福建省内稳定发展", "适合软件交付、政企服务、教育医疗和运营支持方向", "重视稳定和本地资源"],
    cautions: ["平台型互联网岗位有限", "政企/交付岗位要区分自研、外包、驻场", "薪资上限通常低于一线城市"]
  },
  {
    city: "泉州",
    strongIndustries: ["鞋服制造", "品牌消费", "电商", "外贸", "供应链", "门店连锁"],
    suitableRoles: ["电商运营", "商品运营", "外贸跟单", "供应链运营", "销售运营", "门店运营", "行政运营"],
    fitFor: ["有服装鞋帽、制造、外贸、电商经验", "愿意接触实体产业链", "希望在福建省内稳定就业"],
    cautions: ["岗位规范程度差异较大", "部分民营企业管理较强人情化", "电商和外贸岗位可能有大促/旺季加班"]
  },
  {
    city: "漳州",
    strongIndustries: ["食品制造", "农业食品", "物流", "本地服务", "外贸配套"],
    suitableRoles: ["生产计划", "质量文员", "供应链运营", "行政人事", "客服运营", "销售助理"],
    fitFor: ["重视本地稳定就业", "适合制造、食品、物流和行政支持方向", "希望通勤和生活压力较低"],
    cautions: ["高薪白领岗位相对少", "跨行业到互联网/产品方向需要谨慎", "建议重点看公司规范性和社保合同"]
  },
  {
    city: "莆田",
    strongIndustries: ["鞋服", "医疗服务", "电商", "本地生活", "物流"],
    suitableRoles: ["电商运营助理", "客服运营", "行政运营", "门店运营", "销售顾问", "物流调度"],
    fitFor: ["希望本地就业或福建省内过渡", "适合电商、客服、门店和运营支持方向"],
    cautions: ["岗位层级和薪资上限有限", "需要重点筛选公司规范性", "部分岗位销售属性较强"]
  },
  {
    city: "南昌",
    strongIndustries: ["制造", "教育", "软件交付", "客服中心", "本地运营"],
    suitableRoles: ["客服运营", "实施支持", "教务运营", "行政人事", "项目助理", "销售顾问"],
    fitFor: ["希望中部省会稳定发展", "适合支持、交付、教育和服务型岗位"],
    cautions: ["高薪岗位数量有限", "需区分外包/驻场和自有业务"]
  },
  {
    city: "济南",
    strongIndustries: ["政企软件", "教育", "制造", "金融服务", "医疗"],
    suitableRoles: ["实施顾问", "项目助理", "客服运营", "行政运营", "数据专员", "政企客户经理"],
    fitFor: ["重视稳定和省会资源", "适合政企、教育、医疗、交付方向"],
    cautions: ["互联网产品岗位相对少", "政企岗位流程较重，适合稳定执行型"]
  },
  {
    city: "大连",
    strongIndustries: ["软件外包", "日企服务", "贸易物流", "客服中心", "旅游服务"],
    suitableRoles: ["测试工程师", "实施支持", "外贸助理", "客服运营", "行政人事", "数据专员"],
    fitFor: ["有语言、软件外包、贸易或客服经验", "希望生活节奏相对稳定"],
    cautions: ["软件外包岗位较多，要注意项目稳定性", "高薪增长岗位数量有限"]
  },
  {
    city: "佛山",
    strongIndustries: ["家电制造", "家具建材", "供应链", "电商", "门店连锁"],
    suitableRoles: ["供应链运营", "电商运营", "销售运营", "采购助理", "行政运营", "生产计划"],
    fitFor: ["有制造、销售、电商、供应链经验", "适合珠三角实体产业链方向"],
    cautions: ["部分岗位更偏现场和业务执行", "注意通勤区域和工厂/办公室地点"]
  },
  {
    city: "东莞",
    strongIndustries: ["电子制造", "跨境电商", "供应链", "外贸", "品质工程"],
    suitableRoles: ["供应链运营", "外贸跟单", "跨境运营", "质量文员", "生产计划", "项目助理"],
    fitFor: ["能接受制造业环境", "想接触产业链和外贸跨境", "重视就业机会数量"],
    cautions: ["岗位区域分散，通勤和住宿要重点评估", "部分岗位加班和现场协同较多"]
  },
  {
    city: "天津",
    strongIndustries: ["制造", "港口物流", "金融后台", "政企服务", "医药"],
    suitableRoles: ["物流调度", "供应链运营", "行政运营", "客服运营", "项目助理", "销售顾问"],
    fitFor: ["希望环渤海稳定发展", "适合制造、物流、政企和服务支持方向"],
    cautions: ["岗位增长性需要看行业", "部分制造物流岗位工作地点较偏"]
  },
  {
    city: "无锡",
    strongIndustries: ["制造", "半导体", "物联网", "外企工厂", "供应链"],
    suitableRoles: ["生产计划", "质量文员", "供应链运营", "项目助理", "行政人事", "实施支持"],
    fitFor: ["适合制造、质量、供应链和技术支持方向", "希望长三角稳定就业"],
    cautions: ["互联网运营岗位少于上海杭州", "制造岗位需关注加班和厂区位置"]
  }
];

export function findJobCapability(role: string) {
  return jobCapabilityLibrary.find((item) => role.includes(item.role) || item.role.includes(role)) || jobCapabilityLibrary[0];
}

export function findCityOpportunity(city: string) {
  return cityOpportunityLibrary.find((item) => city.includes(item.city) || item.city.includes(city));
}

export function extractResumeEvidence(state: AppState, capability = findJobCapability(state.targetJob.role)): ResumeEvidence {
  const text = `${state.resumeDraft} ${state.experiences.map((item) => item.highlights).join(" ")}`;
  const quantifiedResults = text.match(/\d+(\.\d+)?%|\d+(\.\d+)?万|\d+(\.\d+)?k|\d+人|\d+个|\d+次/g) || [];
  const projectSignals = ["项目", "活动", "上线", "负责", "推动", "复盘", "方案"].filter((word) => text.includes(word));
  const managementSignals = ["管理", "带人", "培训", "团队", "新人", "主管"].filter((word) => text.includes(word));
  const communicationSignals = ["沟通", "协作", "客户", "用户", "跨部门", "协调"].filter((word) => text.includes(word));
  const dataSignals = ["数据", "指标", "分析", "报表", "转化", "增长", "留存"].filter((word) => text.includes(word));
  const missingEvidence = capability.proofExamples.filter((item) => !text.includes(item.replace(/提升|案例|作品/g, ""))).slice(0, 5);

  return {
    quantifiedResults: Array.from(new Set(quantifiedResults)).slice(0, 8),
    projectSignals,
    managementSignals,
    communicationSignals,
    dataSignals,
    missingEvidence
  };
}

export function getFollowUpQuestions(state: AppState, evidence = extractResumeEvidence(state)) {
  const questions: string[] = [];
  if (!evidence.quantifiedResults.length) questions.push("你过往经历里有没有能量化的结果？比如提升率、人数、金额、效率、周期。");
  if (!evidence.projectSignals.length) questions.push("你有没有完整负责过一个项目、活动、需求或客户跟进过程？");
  if (state.targetJob.managementLevel.includes("管理") && !evidence.managementSignals.length) questions.push("你有没有带过新人、协调过多人，或承担过小组负责人角色？");
  if (state.targetJob.city !== state.profile.city) questions.push("如果目标城市机会更好，你能接受搬家、异地通勤、远程或先短期试岗吗？");
  if (!state.profile.familyContext && state.profile.hasCareDuty.includes("无")) questions.push("是否有带娃、照顾老人、晚间不能加班、不能出差等现实限制？");
  return questions.slice(0, 5);
}

export function buildKnowledgeContext(state: AppState) {
  const capability = findJobCapability(state.targetJob.role);
  const currentCity = findCityOpportunity(state.profile.city);
  const targetCity = findCityOpportunity(state.targetJob.city);
  const evidence = extractResumeEvidence(state, capability);
  const questions = getFollowUpQuestions(state, evidence);
  return { capability, currentCity, targetCity, evidence, questions };
}
