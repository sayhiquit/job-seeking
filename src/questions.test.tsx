import { describe, expect, it } from "vitest";
import { assessmentQuestions, defaultState } from "./data";
import { buildModules } from "./questions";

describe("question design", () => {
  it("uses behavior-anchored assessment wording", () => {
    expect(assessmentQuestions[0].text).toContain("过去半年");
    expect(assessmentQuestions.some((question) => question.text.includes("没有好坏"))).toBe(false);
    expect(assessmentQuestions.some((question) => question.text.includes("非常优秀"))).toBe(false);
  });

  it("covers evidence gaps for jobseekers", () => {
    const modules = buildModules(defaultState);
    const intent = modules.find((module) => module.id === "intent");
    const obstacle = intent?.questions.find((question) => question.id === "i-obstacle");

    expect(obstacle?.options).toContain("不知道怎么写项目证据");
    expect(obstacle?.helper).toContain("具体动作");
  });

  it("keeps recruiter screening focused on work evidence instead of identity labels", () => {
    const modules = buildModules({ ...defaultState, role: "recruiter" });
    const standard = modules.find((module) => module.id === "standard");
    const dealBreakers = standard?.questions.find((question) => question.id === "r-deal");
    const priority = modules
      .find((module) => module.id === "screening")
      ?.questions.find((question) => question.id === "r-screen-priority");

    expect(dealBreakers?.helper).toContain("不要写年龄、性别、婚育");
    expect(priority?.options).toContain("优先看可培养潜力和学习速度");
  });
});
