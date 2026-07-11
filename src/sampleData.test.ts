import { describe, expect, it } from "vitest";
import { defaultState } from "./data";
import { clearSampleData, getSampleFieldCount, hasSampleData } from "./sampleData";
import type { AppState } from "./types";

function cloneState(overrides: Partial<AppState> = {}): AppState {
  return {
    ...structuredClone(defaultState),
    ...overrides
  };
}

describe("sample data helpers", () => {
  it("detects jobseeker sample content even after one field changes", () => {
    const state = cloneState({
      profile: {
        ...defaultState.profile,
        name: "真实用户"
      }
    });

    expect(getSampleFieldCount(state)).toBeGreaterThanOrEqual(2);
    expect(hasSampleData(state)).toBe(true);
  });

  it("clears jobseeker sample fields without changing the current role", () => {
    const cleared = clearSampleData(cloneState());

    expect(cleared.role).toBe("jobseeker");
    expect(cleared.profile.name).toBe("");
    expect(cleared.resumeDraft).toBe("");
    expect(cleared.targetJob.jd).toBe("");
    expect(cleared.careerIntent.mainGoal).toBe("");
    expect(hasSampleData(cleared)).toBe(false);
  });

  it("clears recruiter sample fields", () => {
    const state = cloneState({ role: "recruiter" });
    const cleared = clearSampleData(state);

    expect(cleared.role).toBe("recruiter");
    expect(cleared.recruiterJob.company).toBe("");
    expect(cleared.recruiterJob.title).toBe("");
    expect(cleared.recruiterJob.jd).toBe("");
    expect(cleared.recruiterJob.candidateResume).toBe("");
    expect(hasSampleData(cleared)).toBe(false);
  });
});
