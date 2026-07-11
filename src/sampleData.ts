import { defaultState } from "./data";
import type { AppState } from "./types";

export function getSampleFieldCount(state: AppState) {
  if (state.role === "recruiter") {
    return [
      state.recruiterJob.company === defaultState.recruiterJob.company,
      state.recruiterJob.title === defaultState.recruiterJob.title,
      state.recruiterJob.jd === defaultState.recruiterJob.jd,
      state.recruiterJob.candidateResume === defaultState.recruiterJob.candidateResume
    ].filter(Boolean).length;
  }

  return [
    state.profile.name === defaultState.profile.name,
    state.resumeDraft === defaultState.resumeDraft,
    state.targetJob.jd === defaultState.targetJob.jd,
    state.targetJob.marketValidation === defaultState.targetJob.marketValidation,
    state.careerIntent.mainGoal === defaultState.careerIntent.mainGoal
  ].filter(Boolean).length;
}

export function hasSampleData(state: AppState) {
  return getSampleFieldCount(state) >= 2;
}

export function clearSampleData(state: AppState): AppState {
  if (state.role === "recruiter") {
    return {
      ...state,
      recruiterJob: {
        ...state.recruiterJob,
        company: "",
        title: "",
        department: "",
        salary: "",
        hiringReason: "岗位定位还不清晰",
        workMode: "暂不确定",
        teamStructure: "",
        coreTasks: "",
        successMetrics: "",
        jd: "",
        mustHave: "",
        softSkills: "",
        dealBreakers: "",
        redFlags: "",
        sellingPoints: "",
        searchKeywords: "",
        candidateResume: "",
        screeningPriority: "先宽筛，保留更多候选人"
      }
    };
  }

  return {
    ...state,
    careerIntent: {
      ...defaultState.careerIntent,
      clarity: "还不明确，只知道想要更合适的工作",
      mainGoal: "",
      expectedIncome: "",
      bottomLine: "",
      preferredWorkStyle: "",
      avoidWork: "",
      strengths: "",
      weakPoints: "",
      companyPreference: "",
      roleLevelPreference: "暂不确定",
      learningBudget: "暂不确定",
      jobSearchObstacle: "",
      cityPreference: "",
      transitionOpenness: defaultState.careerIntent.transitionOpenness,
      marketValidation: ""
    },
    profile: {
      ...state.profile,
      name: "",
      city: "",
      cityArea: "",
      years: "",
      status: "",
      targetSalary: "",
      familyContext: ""
    },
    targetJob: {
      ...state.targetJob,
      industry: defaultState.targetJob.industry,
      role: "暂不确定，先让系统推荐方向",
      city: "",
      cityArea: "",
      jd: "",
      managementLevel: "不确定",
      workIntensity: "不确定",
      travelRequirement: "不确定",
      cityOpportunity: "不确定",
      incomeStability: "不确定",
      marketValidation: ""
    },
    resumeDraft: ""
  };
}
