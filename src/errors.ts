export function getErrorMessage(error: unknown, fallback: string) {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (raw) return sanitizeErrorText(raw);
  try {
    return sanitizeErrorText(JSON.stringify(error)) || fallback;
  } catch {
    return fallback;
  }
}

export function sanitizeErrorText(value: string | undefined) {
  if (!value) return "";
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/g, "Bearer ***")
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, "sk-***")
    .replace(/\s+/g, " ")
    .slice(0, 500);
}
