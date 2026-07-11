import type { AnalysisRecord, UserRole } from "./types";

export type HistoryRoleFilter = "all" | UserRole;

export function filterHistoryRecords(
  records: AnalysisRecord[],
  options: { query?: string; role?: HistoryRoleFilter } = {}
) {
  const query = options.query?.trim().toLowerCase() || "";
  const role = options.role || "all";

  return records.filter((record) => {
    if (role !== "all" && record.role !== role) return false;
    if (!query) return true;

    const haystack = [
      record.title,
      record.summary,
      record.raw,
      record.level,
      record.createdAt,
      record.role === "jobseeker" ? "求职" : "招聘"
    ]
      .filter(Boolean)
      .join("\n")
      .toLowerCase();
    return haystack.includes(query);
  });
}
