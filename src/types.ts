export type UserRole = "jobseeker" | "recruiter";
export type DetailMode = "quick" | "deep" | "student";

export interface Profile {
  name: string;
  city: string;
  cityArea: string;
  education: string;
  years: string;
  status: string;
  targetSalary: string;
  urgency: string;
  familyContext: string;
  flexibility: string[];
  wantsManagement: string;
  hasCareDuty: string;
  canRelocate: string;
  commuteLimit: string;
  overtimeTolerance: string;
  travelTolerance: string;
}

export interface CareerIntent {
  clarity: string;
  mainGoal: string;
  expectedIncome: string;
  bottomLine: string;
  preferredWorkStyle: string;
  avoidWork: string;
  strengths: string;
  weakPoints: string;
  companyPreference: string;
  roleLevelPreference: string;
  learningBudget: string;
  jobSearchObstacle: string;
  cityPreference: string;
  transitionOpenness: string;
  marketValidation: string;
}

export interface StudentProfile {
  grade: string;
  major: string;
  graduationTime: string;
  schoolLevel: string;
  hasInternship: string;
  campusExperience: string;
  courseProjects: string;
  competitions: string;
  partTimeExperience: string;
  certificates: string;
  portfolio: string;
  firstJobPreference: string;
  cityBudget: string;
  familySupport: string;
}

export interface Experience {
  company: string;
  title: string;
  period: string;
  highlights: string;
}

export interface Assessment {
  communication: number;
  stability: number;
  pressure: number;
  detail: number;
  learning: number;
  result: number;
}

export interface TargetJob {
  industry: string;
  role: string;
  city: string;
  cityArea: string;
  jd: string;
  managementLevel: string;
  workIntensity: string;
  travelRequirement: string;
  cityOpportunity: string;
  incomeStability: string;
  marketValidation: string;
}

export interface RecruiterJob {
  company: string;
  title: string;
  department: string;
  salary: string;
  hiringReason: string;
  workMode: string;
  teamStructure: string;
  coreTasks: string;
  successMetrics: string;
  jd: string;
  mustHave: string;
  softSkills: string;
  dealBreakers: string;
  redFlags: string;
  sellingPoints: string;
  searchKeywords: string;
  candidateResume: string;
  screeningPriority: string;
}

export interface AiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  allowSensitiveAi: boolean;
}

export interface AppState {
  role: UserRole;
  detailMode: DetailMode;
  careerIntent: CareerIntent;
  studentProfile: StudentProfile;
  profile: Profile;
  experiences: Experience[];
  assessment: Assessment;
  assessmentAnswers: Record<string, number>;
  targetJob: TargetJob;
  resumeDraft: string;
  recruiterJob: RecruiterJob;
  aiConfig: AiConfig;
}

export interface AnalysisRecord {
  id: string;
  role: UserRole;
  title: string;
  mode: DetailMode;
  score?: number;
  level?: string;
  summary: string;
  raw: string;
  createdAt: string;
}

export interface ResumeImportPreview {
  summary: string;
  fields: Array<{ label: string; value: string }>;
  sections: Array<{ title: string; items: string[] }>;
  missing: string[];
}
