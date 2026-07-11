import type { UserRole } from "./types";

export function formatReportDateStamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}${month}${day}-${hour}${minute}`;
}

export function buildReportFileName(role: UserRole, date = new Date()) {
  const prefix = role === "jobseeker" ? "求职诊断报告" : "招聘需求分析";
  return `${prefix}-${formatReportDateStamp(date)}.txt`;
}

export function buildLocalDataFileName(date = new Date()) {
  return `职配助手本地数据-${formatReportDateStamp(date)}.json`;
}
