export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  highlights: string[];
  optimizations: string[];
};

export const changelog: ChangelogEntry[] = [
  {
    version: "0.1.3",
    date: "2026-07-01",
    title: "桌面发布检查增强",
    highlights: [
      "新增正式桌面版发布前检查，避免安装包配置不完整时继续打包。",
      "打包前自动确认 Windows 正式版不会弹出 CMD 控制台窗口。",
      "打包前自动确认 NSIS 安装器、应用图标和桌面资源路径配置完整。"
    ],
    optimizations: [
      "desktop:build 和 desktop:bundle 现在会先执行 desktop:check。",
      "desktop:check 会同时执行版本一致性检查和桌面发布配置检查。",
      "同步更新应用、安装包、Tauri 与 Rust 包版本到 0.1.3。"
    ]
  },
  {
    version: "0.1.2",
    date: "2026-07-01",
    title: "桌面启动体验优化",
    highlights: [
      "修复 Windows 正式版启动时会额外弹出 CMD 控制台窗口的问题。",
      "分析结果页优化为桌面面板体验，保存按钮恢复正常尺寸。",
      "结果卡片支持标题固定、内容区独立滚动，长文本不再遮挡标题。"
    ],
    optimizations: [
      "为 Tauri 发布版增加 Windows GUI 子系统配置。",
      "同步更新应用、安装包、Tauri 与 Rust 包版本到 0.1.2。",
      "构建前继续执行版本一致性校验，避免公告版本和安装包版本不一致。"
    ]
  },
  {
    version: "0.1.1",
    date: "2026-07-01",
    title: "职业诊断产品化增强",
    highlights: [
      "新增本次更新公告系统，版本更新后只弹出当前版本内容。",
      "设置里新增更新日志入口，可查看每个版本更新内容。",
      "新增招聘软件市场验证问题，城市机会判断可以结合岗位数量、薪资区间、常见要求和集中区域。",
      "简历导入入口升级，TXT/MD 可直接读取，Word/PDF 提供清晰复制正文和 AI 识别路径。",
      "AI 分析继续固定 7 段结构，并保留质量检查，避免泛泛回答。",
      "个人展示页升级为职业档案，展示定位、适配参考、历史分析和简历状态。",
      "隐私页强化敏感信息使用边界，并补充正式桌面版说明。"
    ],
    optimizations: [
      "清空示例数据时同步清理城市区域和市场验证字段。",
      "AI 上下文加入当前区域、目标区域和市场验证信息。",
      "结果页和个人页更明确地区分本地分析、AI 分析、隐私授权和正式桌面体验。"
    ]
  },
  {
    version: "0.1.0",
    date: "2026-06-30",
    title: "桌面端原型基础版",
    highlights: [
      "完成求职/招聘工作台、粗略/详细/学生模式入口。",
      "完成求职适配度、本地百分比诊断、简历优化、补强计划和历史记录。",
      "完成招聘端岗位要求优化、候选人批量简历筛选和面试追问建议。",
      "完成 AI Key 配置、本地分析、AI 分析、隐私授权和本地数据管理。"
    ],
    optimizations: [
      "桌面端布局从网页滚动改为固定顶部、内容区滚动。",
      "新增游客登录、个人/工作/社区/消息底部功能区。",
      "新增城市库、学生无实习方向推荐、文本简历导入和简历模板。"
    ]
  }
];

export const currentChangelog = changelog[0];
