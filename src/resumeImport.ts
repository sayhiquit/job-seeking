import { escapeRegExp } from "./reports";
import type { ResumeImportPreview } from "./types";

export function parseResumeImportPreview(text: string): ResumeImportPreview {
  const lines = text
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
  const groups: Array<[string, string[]]> = [
    ["基本信息", ["姓名", "昵称", "电话", "邮箱", "城市", "学历", "年限", "工作年限"]],
    ["求职目标", ["求职", "目标岗位", "应聘", "薪资", "期望", "不能接受"]],
    ["工作经历", ["公司", "岗位", "负责", "运营", "客服", "销售", "项目", "活动", "数据", "管理"]],
    ["量化结果", ["提升", "降低", "完成", "转化", "增长", "满意度", "效率", "人数", "金额", "%", "万", "千"]],
    ["项目/作品", ["项目", "作品", "案例", "复盘", "证书", "课程", "工具"]]
  ];
  const sections = groups
    .map(([title, keywords]) => ({
      title,
      items: lines.filter((line) => keywords.some((keyword) => line.includes(keyword))).slice(0, 5)
    }))
    .filter((section) => section.items.length);
  const missing = [
    !/目标岗位|求职目标|应聘|想做/.test(text) ? "缺少明确求职目标" : "",
    !/\d|%|万|千|人|次|个|k|K/.test(text) ? "缺少量化结果" : "",
    !/项目|作品|案例|复盘|证书/.test(text) ? "缺少项目/作品/证据" : "",
    !/城市|通勤|加班|出差|薪资|底线|不能接受/.test(text) ? "缺少真实限制和求职边界" : ""
  ].filter(Boolean);
  return {
    summary: sections.length ? `已识别出 ${sections.length} 个模块，可继续补强和改写。` : "未识别出明显结构，建议使用模板重新填写。",
    fields,
    sections: sections.length ? sections : [{ title: "原始简历", items: lines.slice(0, 8) }],
    missing
  };
}

export function extractFieldValue(text: string, keys: string[]) {
  for (const key of keys) {
    const pattern = new RegExp(`(?:${escapeRegExp(key)})[:：\\s\\-]*([^\\n]{1,48})`, "i");
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}
