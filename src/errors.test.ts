import { describe, expect, it } from "vitest";
import { getErrorMessage, sanitizeErrorText } from "./errors";

describe("error helpers", () => {
  it("redacts bearer tokens and OpenAI-style keys", () => {
    const message = sanitizeErrorText("Request failed Bearer abc.def_1234567890 sk-abcdefghijklmnopqrstuvwxyz123456");

    expect(message).toContain("Bearer ***");
    expect(message).toContain("sk-***");
    expect(message).not.toContain("abc.def_1234567890");
    expect(message).not.toContain("abcdefghijklmnopqrstuvwxyz123456");
  });

  it("compacts long messages", () => {
    const message = sanitizeErrorText(`第一行\n${"很长".repeat(400)}`);

    expect(message.length).toBeLessThanOrEqual(500);
    expect(message).not.toContain("\n");
  });

  it("uses fallback when unknown input cannot produce a message", () => {
    expect(getErrorMessage(undefined, "默认错误")).toBe("默认错误");
  });
});
