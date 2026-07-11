import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Check,
  ClipboardList,
  Copy,
  Database,
  Download,
  FileText,
  Gauge,
  Home,
  LockKeyhole,
  MessageCircle,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
  X
} from "lucide-react";
import { analyzeCandidateBatch, analyzeRecruiterJob, buildActionPlan, buildDecisionPath, buildDiagnosticInsights, buildResumeRewritePlan, buildResumeVariants, buildSampleAuditSummary, calculateMatch, optimizeResume } from "./analysis";
import { runCareerAiAnalysis, runResumeImportAnalysis, testAiConnection } from "./ai";
import { changelog, currentChangelog, type ChangelogEntry } from "./changelog";
import { answerOptions, assessmentQuestions, defaultState, industries, rolesByIndustry } from "./data";
import { buildModules, resumeTemplate, type Module, type Question } from "./questions";
import { parseResumeImportPreview } from "./resumeImport";
import { buildReportFileName } from "./reportExport";
import { getErrorMessage } from "./errors";
import { filterHistoryRecords, type HistoryRoleFilter } from "./history";
import { buildKnowledgeContext } from "./knowledge";
import { clearSampleData, hasSampleData } from "./sampleData";
import { PossibilityDetail, PossibilityRing, buildAiPossibilities, evaluateAiResultQuality, stripMarkdown, toAdviceItems, type PossibilityItem, type PossibilityTone } from "./aiResult";
import { buildCapabilityPlanItems, buildResumeExecutionItems, buildStudentPlanItems } from "./plans";
import { buildCandidateBatchReport, buildLocalReport, buildRecruiterReport, escapeRegExp, formatChoiceText, parseAiSections } from "./reports";
import { clearAnalysisRecords, clearState, exportLocalData, loadAnalysisRecords, loadSeenChangelogVersion, loadState, saveAnalysisRecord, saveSeenChangelogVersion, saveState } from "./storage";
import type { AnalysisRecord, AppState, DetailMode, ResumeImportPreview, UserRole } from "./types";

type Screen = "login" | "role" | "mode" | "home" | "qa" | "analysis" | "profile" | "history" | "privacy" | "changelog";
type AnalysisMode = "local" | "ai";
type MainTab = "jobs" | "community" | "messages" | "profile";

function App() {
  const [state, setState] = useState<AppState>(defaultState);
  const [screen, setScreen] = useState<Screen>("login");
  const [mainTab, setMainTab] = useState<MainTab>("jobs");
  const [returnScreen, setReturnScreen] = useState<Screen>("home");
  const [activeModuleId, setActiveModuleId] = useState("target");
  const [activeQuestionId, setActiveQuestionId] = useState("");
  const [draft, setDraft] = useState("");
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("local");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [resumeImportPreview, setResumeImportPreview] = useState<ResumeImportPreview | null>(null);
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [modal, setModal] = useState<{ title: string; body: string; onConfirm: () => void } | null>(null);
  const [updateNoticeOpen, setUpdateNoticeOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const match = useMemo(() => calculateMatch(state), [state]);
  const decisionPath = useMemo(() => buildDecisionPath(state, match), [state, match]);
  const optimizedResume = useMemo(() => optimizeResume(state), [state]);
  const resumeVariants = useMemo(() => buildResumeVariants(state, match, decisionPath), [state, match, decisionPath]);
  const resumeRewritePlan = useMemo(() => buildResumeRewritePlan(state), [state]);
  const diagnosticInsights = useMemo(() => buildDiagnosticInsights(state, match), [state, match]);
  const actionPlan = useMemo(() => buildActionPlan(state, match), [state, match]);
  const recruiterAnalysis = useMemo(() => analyzeRecruiterJob(state), [state]);
  const candidateBatch = useMemo(() => analyzeCandidateBatch(state), [state]);
  const knowledge = useMemo(() => buildKnowledgeContext(state), [state]);
  const sampleAudit = useMemo(() => buildSampleAuditSummary(), []);
  const modules = useMemo(() => buildModules(state), [state]);
  const questions = useMemo(() => modules.flatMap((item) => item.questions), [modules]);
  const activeQuestion = questions.find((item) => item.id === activeQuestionId) || questions[0];
  const dirty = Boolean(activeQuestion && draft !== activeQuestion.value(state));
  const requiredCount = questions.filter((question) => question.required).length;
  const completedRequiredCount = questions.filter((question) => question.required && question.value(state).trim()).length;
  const isSampleData = hasSampleData(state);
  const utilityBackLabel = returnScreen === "home" ? "返回首页" : returnScreen === "profile" ? "返回展示" : "返回填写";

  useEffect(() => {
    loadState()
      .then((loaded) => {
        const raw = JSON.stringify(loaded);
        const looksCorrupt = /�|鍔|鑱|宀|绠|鎷|姹/.test(raw);
        setState(
          looksCorrupt
            ? defaultState
            : {
                ...defaultState,
                ...loaded,
                studentProfile: { ...defaultState.studentProfile, ...loaded.studentProfile },
                careerIntent: { ...defaultState.careerIntent, ...loaded.careerIntent },
                profile: { ...defaultState.profile, ...loaded.profile },
                targetJob: { ...defaultState.targetJob, ...loaded.targetJob },
                recruiterJob: { ...defaultState.recruiterJob, ...loaded.recruiterJob },
                aiConfig: { ...defaultState.aiConfig, ...loaded.aiConfig },
                assessmentAnswers: loaded.assessmentAnswers || defaultState.assessmentAnswers
              }
        );
      })
      .finally(() => setHydrated(true));
    loadAnalysisRecords().then(setRecords);
    if (loadSeenChangelogVersion() !== currentChangelog.version) {
      setUpdateNoticeOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      saveState(state).then(() => setSavedAt(new Date().toLocaleTimeString()));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [hydrated, state]);

  useEffect(() => {
    setSettingsOpen(false);
  }, [screen]);

  useEffect(() => {
    const first = modules.find((item) => item.id === activeModuleId)?.questions[0] || modules[0]?.questions[0];
    if (!first) return;
    if (!modules.some((item) => item.id === activeModuleId)) setActiveModuleId(modules[0].id);
    if (!questions.some((item) => item.id === activeQuestionId)) {
      setActiveQuestionId(first.id);
      setDraft(first.value(state));
    }
  }, [activeModuleId, activeQuestionId, modules, questions, state]);

  const chooseRole = (role: UserRole) => {
    setState((current) => ({ ...current, role }));
    setScreen(role === "jobseeker" ? "mode" : "qa");
    setActiveModuleId(role === "jobseeker" ? "intent" : "company");
    setActiveQuestionId("");
    setSettingsOpen(false);
  };

  const startRecruiterFlow = (moduleId: "company" | "screening" = "screening") => {
    setState((current) => ({ ...current, role: "recruiter" }));
    setScreen("qa");
    setActiveModuleId(moduleId);
    setActiveQuestionId("");
    setSettingsOpen(false);
  };

  const chooseMode = (detailMode: DetailMode) => {
    setState((current) => ({
      ...current,
      detailMode,
      ...(detailMode === "student"
        ? {
            profile: {
              ...current.profile,
              years: "无经验/应届",
              status: "应届/实习找工作"
            },
            targetJob: {
              ...current.targetJob,
              industry: "实习/应届",
              role: current.targetJob.role || "暂不确定，先让系统推荐方向"
            },
            careerIntent: {
              ...current.careerIntent,
              clarity: "还不明确，只知道想要更合适的工作",
              roleLevelPreference: "实习/应届/助理"
            }
          }
        : {})
    }));
    setScreen("qa");
    setActiveModuleId(detailMode === "student" ? "student" : detailMode === "quick" ? "intent" : "profile");
    setActiveQuestionId("");
  };

  const switchRole = (role: UserRole) => {
    const action = () => chooseRole(role);
    guardUnsaved(action);
  };

  const switchWorkbench = (role: UserRole) => {
    const action = () => {
      setState((current) => ({ ...current, role }));
      setMainTab("jobs");
      setScreen("home");
      setSettingsOpen(false);
    };
    guardUnsaved(action);
  };

  const switchMode = (detailMode: DetailMode) => {
    const action = () => chooseMode(detailMode);
    guardUnsaved(action);
  };

  const openHome = (tab: MainTab = "jobs") => {
    setMainTab(tab);
    setScreen("home");
    setSettingsOpen(false);
  };

  const openUtilityScreen = (nextScreen: "history" | "privacy" | "changelog", from: Screen = screen) => {
    setReturnScreen(from);
    setScreen(nextScreen);
    setSettingsOpen(false);
  };

  const backFromUtility = () => {
    setScreen(["login", "role", "mode", "history", "privacy", "changelog"].includes(returnScreen) ? "home" : returnScreen);
  };

  const guardUnsaved = (action: () => void) => {
    if (!dirty || !draft.trim()) {
      action();
      return;
    }
    setModal({
      title: "当前填写内容还没保存",
      body: "如果现在切换，当前题里已经填写但未保存的内容不会保存。确定要切换吗？",
      onConfirm: () => {
        setModal(null);
        action();
      }
    });
  };

  const goQuestion = (question: Question) => {
    if (activeQuestion) activeQuestion.save(draft, setState);
    setActiveModuleId(question.moduleId);
    setActiveQuestionId(question.id);
    setDraft(question.value(state));
  };

  const saveCurrentAnswer = () => {
    if (!activeQuestion) return;
    activeQuestion.save(draft, setState);
  };

  const incompleteQuestions = questions.filter((question) => question.required && !question.value(state).trim());

  const startAnalysis = () => {
    const nextIncomplete = questions.filter((question) => {
      const value = question.id === activeQuestion?.id ? draft : question.value(state);
      return question.required && !value.trim();
    });
    const run = () => {
      saveCurrentAnswer();
      persistAnalysisRecord();
      setAnalysisMode("local");
      setScreen("analysis");
      setSettingsOpen(false);
    };
    if (nextIncomplete.length > 0) {
      setModal({
        title: "还有内容没有填写完",
        body: `还有 ${nextIncomplete.length} 个关键问题未填写。现在分析也可以继续，但结果准确性会下降。是否确定分析？`,
        onConfirm: () => {
          setModal(null);
          run();
        }
      });
      return;
    }
    run();
  };

  const persistAnalysisRecord = async () => {
    const record: AnalysisRecord = {
      id: `${Date.now()}`,
      role: state.role,
      title:
        state.role === "jobseeker"
          ? state.detailMode === "student"
            ? `学生方向探索｜${state.studentProfile.major || "未填专业"}`
            : state.targetJob.role.includes("不确定") || state.careerIntent.clarity.includes("还不明确")
            ? `方向探索｜${state.careerIntent.expectedIncome || state.profile.targetSalary || "未填薪资"}`
            : `${state.targetJob.city}${state.targetJob.role}`
          : `${state.recruiterJob.company}${state.recruiterJob.title}`,
      mode: state.detailMode,
      score: state.role === "jobseeker" ? match.total : undefined,
      level: state.role === "jobseeker" ? match.level : "招聘分析",
      summary: state.role === "jobseeker" ? match.action : recruiterAnalysis.risks[0],
      raw: state.role === "jobseeker" ? buildLocalReport(state, match, decisionPath, optimizedResume, knowledge, diagnosticInsights, actionPlan) : buildRecruiterReport(recruiterAnalysis, candidateBatch),
      createdAt: new Date().toLocaleString()
    };
    setRecords((current) => [record, ...current].slice(0, 50));
    await saveAnalysisRecord(record);
  };

  const runAi = async () => {
    if (!state.aiConfig.allowSensitiveAi) {
      setModal({
        title: "需要先确认 AI 隐私授权",
        body: "AI 分析会把岗位、简历、性格问卷和真实情况发送给你配置的 AI 服务商。请先在右上角设置里勾选授权，再开始 AI 分析。",
        onConfirm: () => {
          setModal(null);
          setSettingsOpen(true);
        }
      });
      return;
    }
    setAnalysisMode("ai");
    setAiLoading(true);
    setAiError("");
    try {
      setAiText(await runCareerAiAnalysis(state));
    } catch (error) {
      setAiError(getErrorMessage(error, "AI 分析失败，请检查 API Key、Base URL、模型名称和网络连接。"));
    } finally {
      setAiLoading(false);
    }
  };

  const currentReport = () =>
    state.role === "jobseeker"
      ? `职配助手 - 求职诊断报告\n\n参考分数：${match.total}/100｜${match.level}\n\n本地分析：\n${buildLocalReport(state, match, decisionPath, optimizedResume, knowledge, diagnosticInsights, actionPlan)}\n\nAI 分析：\n${aiText || "尚未生成 AI 分析。"}`
      : `职配助手 - 招聘需求与简历筛选\n\n公司：${state.recruiterJob.company}\n岗位：${state.recruiterJob.title}\n\n人才画像：\n${recruiterAnalysis.mustHave.map((item) => `- ${item}`).join("\n")}\n\n加分项：\n${recruiterAnalysis.niceToHave.map((item) => `- ${item}`).join("\n")}\n\n招聘风险：\n${recruiterAnalysis.risks.map((item) => `- ${item}`).join("\n")}\n\n批量简历筛选：\n${buildCandidateBatchReport(candidateBatch)}\n\n优化 JD：\n${recruiterAnalysis.improvedJd}`;

  const exportReport = () => {
    const report = currentReport();
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = buildReportFileName(state.role);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const copyReport = async () => {
    await navigator.clipboard.writeText(currentReport());
    setModal({
      title: "已复制报告",
      body: "当前分析报告已经复制到剪贴板，可以直接粘贴到文档或聊天窗口。",
      onConfirm: () => setModal(null)
    });
  };

  const resetCurrentState = () => {
    setModal({
      title: "清空当前填写？",
      body: "这会清空当前求职/招聘填写内容，但不会删除历史分析记录。确定继续吗？",
      onConfirm: async () => {
        await clearState();
        setState(defaultState);
        setScreen("role");
        setModal(null);
      }
    });
  };

  const resetHistory = () => {
    setModal({
      title: "清空历史记录？",
      body: "这会删除本机保存的最近 50 条分析历史，删除后无法恢复。确定继续吗？",
      onConfirm: async () => {
        await clearAnalysisRecords();
        setRecords([]);
        setModal(null);
      }
    });
  };

  const clearAiKey = () => {
    setModal({
      title: "清除 AI Key？",
      body: "这会清空本机保存的 API Key，并关闭 AI 敏感信息授权。本地分析和历史记录不会受影响。",
      onConfirm: () => {
        setState((current) => ({
          ...current,
          aiConfig: {
            ...current.aiConfig,
            apiKey: "",
            allowSensitiveAi: false
          }
        }));
        setModal(null);
      }
    });
  };

  if (screen === "login") {
    return <LoginScreen onGuest={() => setScreen("role")} />;
  }

  if (screen === "role") {
    return (
      <ChoiceScreen
        eyebrow="游客登录"
        title="先选择你今天要解决的问题"
        subtitle="进入后也可以在右上角随时切换求职端和招聘端。"
        left={{ icon: <UserRound />, title: "求职", text: "分析岗位是否适合、简历怎么改、还适合做什么。" }}
        right={{ icon: <UsersRound />, title: "招聘", text: "批量筛选候选人简历，整理面试重点和录用风险。" }}
        skipText="暂不填写，先进入首页"
        onSkip={() => openHome("jobs")}
        onLeft={() => chooseRole("jobseeker")}
        onRight={() => chooseRole("recruiter")}
      />
    );
  }

  if (screen === "mode") {
    return (
      <ChoiceScreen
        eyebrow="求职诊断"
        title="选择填写深度"
        subtitle="目标明确选粗略，需要完整判断选详细；在校、应届、没实习经历，直接选学生模式。"
        left={{ icon: <Gauge />, title: "粗略", text: "约 2-4 分钟。填写目标岗位和简历，先得到一版投递判断。" }}
        right={{ icon: <ClipboardList />, title: "详细", text: "约 8-12 分钟。加入性格问卷、真实情况、城市机会和岗位冲突分析。" }}
        third={{ icon: <BadgeCheck />, title: "学生/应届", text: "没有实习也能用。挖课程、社团、竞赛、兼职和作品，给第一份工作方向。" }}
        skipText="暂不填写，先进入首页"
        onSkip={() => openHome("jobs")}
        onLeft={() => chooseMode("quick")}
        onRight={() => chooseMode("deep")}
        onThird={() => chooseMode("student")}
      />
    );
  }

  return (
    <main className="desktop-shell">
      <section className="desktop-frame">
        {screen === "home" && (
          <HomeTopBar
            state={state}
            onRole={switchWorkbench}
            onHistory={() => openUtilityScreen("history", "home")}
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
            onPrivacy={() => openUtilityScreen("privacy", "home")}
          />
        )}
        {screen === "qa" && (
          <TopBar
            state={state}
            onMode={switchMode}
            onRole={switchWorkbench}
            onHistory={() => openUtilityScreen("history", "qa")}
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
            onPrivacy={() => openUtilityScreen("privacy", "qa")}
          />
        )}
        {screen === "analysis" && (
          <AnalysisTopBar
            mode={analysisMode}
            setMode={(mode) => {
              setAnalysisMode(mode);
              if (mode === "ai" && state.aiConfig.allowSensitiveAi && state.aiConfig.apiKey.trim() && !aiText && !aiLoading) runAi();
            }}
            exportReport={exportReport}
            copyReport={copyReport}
            onBack={() => setScreen("qa")}
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
          />
        )}
        {screen === "profile" && (
          <ProfileTopBar
            onBack={() => setScreen("qa")}
            exportReport={exportReport}
            copyReport={copyReport}
            onHistory={() => openUtilityScreen("history", "profile")}
            onRole={switchWorkbench}
            state={state}
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
            onPrivacy={() => openUtilityScreen("privacy", "profile")}
          />
        )}
        {screen === "history" && (
          <HistoryTopBar
            onBack={backFromUtility}
            backLabel={utilityBackLabel}
            exportReport={exportReport}
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
            onPrivacy={() => openUtilityScreen("privacy", returnScreen)}
          />
        )}
        {screen === "privacy" && (
          <PrivacyTopBar
            onBack={backFromUtility}
            backLabel={utilityBackLabel}
            exportReport={exportReport}
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
          />
        )}
        {screen === "changelog" && (
          <ChangelogTopBar
            onBack={backFromUtility}
            backLabel={utilityBackLabel}
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
          />
        )}

        {settingsOpen && <SettingsPopover state={state} setState={setState} savedAt={savedAt} exportReport={exportReport} onPrivacy={() => setScreen("privacy")} onChangelog={() => setScreen("changelog")} />}

        {screen === "home" && (
          <HomeScreen
            tab={mainTab}
            setTab={setMainTab}
            state={state}
            onStartJobseeker={() => chooseRole("jobseeker")}
            onStartRecruiter={() => startRecruiterFlow("screening")}
            onOptimizeRecruiter={() => startRecruiterFlow("company")}
            onHistory={() => openUtilityScreen("history", "home")}
          />
        )}

        {screen === "qa" && activeQuestion && (
          <QaWorkspace
            state={state}
            modules={modules}
            questions={questions}
            activeModuleId={activeModuleId}
            activeQuestion={activeQuestion}
            draft={draft}
            setDraft={setDraft}
            aiConfig={state.aiConfig}
            setActiveModuleId={(id) => {
              const first = modules.find((item) => item.id === id)?.questions[0];
              if (first) goQuestion(first);
            }}
            goQuestion={goQuestion}
            saveCurrentAnswer={saveCurrentAnswer}
            startAnalysis={startAnalysis}
            incompleteCount={incompleteQuestions.length}
            requiredCount={requiredCount}
            completedRequiredCount={completedRequiredCount}
            isSampleData={isSampleData}
            resumeImportPreview={resumeImportPreview}
            setResumeImportPreview={setResumeImportPreview}
            clearSample={() =>
              {
                setResumeImportPreview(null);
                setState((current) => clearSampleData(current));
              }
            }
          />
        )}

        {screen === "analysis" && (
          <AnalysisScreen
            state={state}
            mode={analysisMode}
            match={match}
            decisionPath={decisionPath}
            optimizedResume={optimizedResume}
            diagnosticInsights={diagnosticInsights}
            actionPlan={actionPlan}
            resumeRewritePlan={resumeRewritePlan}
            resumeVariants={resumeVariants}
            recruiterAnalysis={recruiterAnalysis}
            candidateBatch={candidateBatch}
            knowledge={knowledge}
            sampleAudit={sampleAudit}
            aiText={aiText}
            aiLoading={aiLoading}
            aiError={aiError}
            runAi={runAi}
            backToLocal={() => setAnalysisMode("local")}
            onConfirm={() => setScreen("profile")}
            openSettings={() => setSettingsOpen(true)}
            isSampleData={isSampleData}
          />
        )}

        {screen === "profile" && (
          <ProfileScreen
            state={state}
            match={match}
            decisionPath={decisionPath}
            optimizedResume={optimizedResume}
            diagnosticInsights={diagnosticInsights}
            actionPlan={actionPlan}
            resumeRewritePlan={resumeRewritePlan}
            resumeVariants={resumeVariants}
            recruiterAnalysis={recruiterAnalysis}
            candidateBatch={candidateBatch}
            knowledge={knowledge}
            aiText={aiText}
            records={records}
          />
        )}

        {screen === "history" && <HistoryScreen records={records} />}
        {screen === "changelog" && <ChangelogScreen entries={changelog} />}
        {screen === "privacy" && (
          <PrivacyScreen
            state={state}
            records={records}
            onClearState={resetCurrentState}
            onClearRecords={resetHistory}
            onClearAiKey={clearAiKey}
            onExportData={() => exportLocalData(state, records)}
          />
        )}
      </section>

      {modal && (
        <ConfirmModal
          title={modal.title}
          body={modal.body}
          onCancel={() => setModal(null)}
          onConfirm={modal.onConfirm}
        />
      )}
      {updateNoticeOpen && (
        <UpdateNoticeToast
          entry={currentChangelog}
          onClose={() => {
            saveSeenChangelogVersion(currentChangelog.version);
            setUpdateNoticeOpen(false);
          }}
          onOpenLog={() => {
            saveSeenChangelogVersion(currentChangelog.version);
            setUpdateNoticeOpen(false);
            setReturnScreen(screen);
            setScreen("changelog");
          }}
        />
      )}
    </main>
  );
}

function LoginScreen({ onGuest }: { onGuest: () => void }) {
  return (
    <main className="choice-shell login-shell">
      <section className="login-panel">
        <div className="brand-line">
          <span className="brand-mark"><Sparkles size={22} /></span>
          <div>
            <strong>职配助手</strong>
            <small>桌面端原型</small>
          </div>
        </div>
        <div className="login-copy">
          <h1>先用游客身份进入</h1>
          <p>账号体系放到第三版；当前版本专注求职诊断、简历优化和招聘简历筛选。</p>
        </div>
        <div className="login-trust-grid">
          <span><LockKeyhole size={16} /> 本地优先</span>
          <span><ShieldCheck size={16} /> AI 前授权</span>
          <span><Gauge size={16} /> 结果可追溯</span>
        </div>
        <button className="primary login-button" onClick={onGuest}>
          <UserRound size={19} /> 游客进入
        </button>
        <small className="login-note">本地数据默认保存在当前电脑；当前版本不会自动上传你的填写内容。</small>
      </section>
    </main>
  );
}

function ChoiceScreen({
  eyebrow,
  title,
  subtitle,
  left,
  right,
  third,
  skipText,
  onSkip,
  onLeft,
  onRight,
  onThird
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  left: { icon: ReactNode; title: string; text: string };
  right: { icon: ReactNode; title: string; text: string };
  third?: { icon: ReactNode; title: string; text: string };
  skipText?: string;
  onSkip?: () => void;
  onLeft: () => void;
  onRight: () => void;
  onThird?: () => void;
}) {
  return (
    <main className="choice-shell">
      <section className="choice-panel">
        <div className="brand-line">
          <span className="brand-mark"><Sparkles size={22} /></span>
          <div>
            <strong>职配助手</strong>
            <small>{eyebrow}</small>
          </div>
        </div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="choice-grid">
          <button onClick={onLeft}>
            {left.icon}
            <strong>{left.title}</strong>
            <span>{left.text}</span>
          </button>
          <button onClick={onRight}>
            {right.icon}
            <strong>{right.title}</strong>
            <span>{right.text}</span>
          </button>
          {third && onThird && (
            <button onClick={onThird}>
              {third.icon}
              <strong>{third.title}</strong>
              <span>{third.text}</span>
            </button>
          )}
        </div>
        {skipText && onSkip && (
          <button className="choice-skip" onClick={onSkip}>
            {skipText}
          </button>
        )}
      </section>
    </main>
  );
}

function HomeTopBar({
  state,
  onRole,
  onHistory,
  settingsOpen,
  setSettingsOpen,
  onPrivacy
}: {
  state: AppState;
  onRole: (role: UserRole) => void;
  onHistory: () => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  onPrivacy: () => void;
}) {
  return (
    <header className="app-topbar home-topbar">
      <div className="brand-line compact-brand">
        <span className="brand-mark"><Sparkles size={20} /></span>
        <div>
          <strong>职配助手</strong>
          <small>游客模式</small>
        </div>
      </div>
      <div className="top-title">
        <strong>{state.role === "jobseeker" ? "求职首页" : "招聘首页"}</strong>
        <span>{state.role === "jobseeker" ? "像刷岗位一样进入功能区，需要时再开始填写诊断" : "围绕批量简历筛选组织招聘工作流"}</span>
      </div>
      <div className="right-tools">
        <SegmentSwitch
          items={[
            { id: "jobseeker", label: "求职" },
            { id: "recruiter", label: "招聘" }
          ]}
          active={state.role}
          onChange={(id) => onRole(id as UserRole)}
        />
        <button className="secondary compact-action" onClick={onHistory}>历史</button>
        <button className="secondary compact-action" onClick={onPrivacy}>数据</button>
        <button className={settingsOpen ? "gear active" : "gear"} onClick={() => setSettingsOpen(!settingsOpen)} aria-label="设置">
          <Settings size={21} />
        </button>
      </div>
    </header>
  );
}

function HomeScreen({
  tab,
  setTab,
  state,
  onStartJobseeker,
  onStartRecruiter,
  onOptimizeRecruiter,
  onHistory,
}: {
  tab: MainTab;
  setTab: (tab: MainTab) => void;
  state: AppState;
  onStartJobseeker: () => void;
  onStartRecruiter: () => void;
  onOptimizeRecruiter: () => void;
  onHistory: () => void;
}) {
  const isRecruiter = state.role === "recruiter";
  const tabTitle: Record<MainTab, string> = {
    jobs: isRecruiter ? "简历筛选" : "工作机会",
    community: "社区",
    messages: "消息",
    profile: "个人"
  };

  return (
    <section className="home-workspace">
      <div className="home-feed">
        <div className="home-section-head">
          <span>{tabTitle[tab]}</span>
          <strong>{isRecruiter ? "招聘工作台" : "求职工作台"}</strong>
        </div>

        {tab === "jobs" && (
          <>
            <div className="home-card-grid">
              <button className="home-action-card primary-card" onClick={isRecruiter ? onStartRecruiter : onStartJobseeker}>
                <BriefcaseBusiness size={24} />
                <strong>{isRecruiter ? "开始批量筛简历" : "开始求职诊断"}</strong>
                <span>{isRecruiter ? "粘贴候选人简历，按硬性门槛、成果证据和风险排序。" : "从粗略或详细模式进入，判断岗位匹配度并优化简历。"}</span>
              </button>
              <button className="home-action-card" onClick={onHistory}>
                <Database size={24} />
                <strong>查看历史分析</strong>
                <span>回看之前的岗位、简历版本和候选人筛选记录。</span>
              </button>
              <button className="home-action-card" onClick={isRecruiter ? onOptimizeRecruiter : () => setTab("profile")}>
                {isRecruiter ? <FileText size={24} /> : <UserRound size={24} />}
                <strong>{isRecruiter ? "优化招聘要求" : "个人中心"}</strong>
                <span>{isRecruiter ? "梳理岗位职责、硬性门槛、候选人画像和 JD 表达。" : "查看职业档案、历史分析、求职偏好和隐私设置。"}</span>
              </button>
            </div>
            <HomeValuePanel isRecruiter={isRecruiter} />
          </>
        )}

        {tab === "community" && (
          <div className="home-placeholder">
            <UsersRound size={30} />
            <strong>社区功能区</strong>
            <p>社区模块处于内测规划中。当前建议先使用诊断、历史记录和报告导出沉淀案例。</p>
          </div>
        )}

        {tab === "messages" && (
          <div className="home-placeholder">
            <MessageCircle size={30} />
            <strong>消息功能区</strong>
            <p>消息提醒处于内测规划中。当前重要结果会保存在历史记录里，方便随时回看。</p>
          </div>
        )}

        {tab === "profile" && (
          <div className="home-placeholder">
            <UserRound size={30} />
            <strong>个人功能区</strong>
            <p>当前为游客身份；可先查看本地职业档案、历史分析和隐私数据设置。</p>
            <button className="primary" onClick={isRecruiter ? onOptimizeRecruiter : onStartJobseeker}>{isRecruiter ? "优化招聘要求" : "开始求职诊断"}</button>
          </div>
        )}
      </div>

      <BottomNav active={tab} onChange={setTab} isRecruiter={isRecruiter} />
    </section>
  );
}

function HomeValuePanel({ isRecruiter }: { isRecruiter: boolean }) {
  const items = isRecruiter
    ? [
        ["1", "先定筛选标准", "把硬性门槛、加分项、淘汰项和试用期指标说清楚。"],
        ["2", "批量粘贴简历", "从平台复制已授权可查看的候选人简历，系统先做排序。"],
        ["3", "人工复核面试", "每个候选人都有匹配点、风险点和追问问题。"]
      ]
    : [
        ["1", "先判断方向", "目标明确就快速诊断，迷茫就先从诉求和经历反推方向。"],
        ["2", "再看适配原因", "百分比点开能看到岗位、简历、性格、真实情况分别影响了什么。"],
        ["3", "最后改简历", "不是只美化文字，而是告诉你缺什么证据、怎么补、投哪些岗位。"]
      ];

  return (
    <section className="home-value-panel">
      <div className="section-title-row">
        <h3>{isRecruiter ? "招聘端核心流程" : "求职端核心流程"}</h3>
        <span>{isRecruiter ? "减少重复看简历，把时间留给有效面试" : "避免只套 AI 对话，结果必须能解释、能执行"}</span>
      </div>
      <div className="value-steps">
        {items.map(([step, title, text]) => (
          <div key={step}>
            <b>{step}</b>
            <strong>{title}</strong>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function BottomNav({ active, onChange, isRecruiter }: { active: MainTab; onChange: (tab: MainTab) => void; isRecruiter: boolean }) {
  const items: Array<{ id: MainTab; label: string; icon: ReactNode }> = [
    { id: "jobs", label: isRecruiter ? "简历" : "工作", icon: <Home size={20} /> },
    { id: "community", label: "社区", icon: <UsersRound size={20} /> },
    { id: "messages", label: "消息", icon: <MessageCircle size={20} /> },
    { id: "profile", label: "个人", icon: <UserRound size={20} /> }
  ];

  return (
    <nav className="bottom-nav" aria-label="首页功能区">
      {items.map((item) => (
        <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => onChange(item.id)}>
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

function TopBar({
  state,
  onMode,
  onRole,
  onHistory,
  settingsOpen,
  setSettingsOpen,
  onPrivacy
}: {
  state: AppState;
  onMode: (mode: DetailMode) => void;
  onRole: (role: UserRole) => void;
  onHistory: () => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  onPrivacy: () => void;
}) {
  return (
    <header className="app-topbar">
      <div className="left-switch">
        {state.role === "jobseeker" && (
          <SegmentSwitch
            items={[
              { id: "quick", label: "粗略" },
              { id: "deep", label: "详细" },
              { id: "student", label: "学生" }
            ]}
            active={state.detailMode}
            onChange={(id) => onMode(id as DetailMode)}
          />
        )}
      </div>
      <div className="top-title">
        <strong>{state.role === "jobseeker" ? "求职诊断工作台" : "招聘需求工作台"}</strong>
        <span>{state.role === "jobseeker" ? state.detailMode === "student" ? "从专业、课程、社团、兼职和作品里找第一份工作的方向" : "逐题填写，最后交给本地规则或 AI 做综合分析" : "先把岗位说清楚，再生成招聘画像和 JD"}</span>
      </div>
      <div className="right-tools">
        <SegmentSwitch
          items={[
            { id: "jobseeker", label: "求职" },
            { id: "recruiter", label: "招聘" }
          ]}
          active={state.role}
          onChange={(id) => onRole(id as UserRole)}
        />
        <button className="secondary compact-action" onClick={onHistory}>历史</button>
        <button className="secondary compact-action" onClick={onPrivacy}>数据</button>
        <button className={settingsOpen ? "gear active" : "gear"} onClick={() => setSettingsOpen(!settingsOpen)} aria-label="设置">
          <Settings size={21} />
        </button>
      </div>
    </header>
  );
}

function AnalysisTopBar({
  mode,
  setMode,
  exportReport,
  copyReport,
  onBack,
  settingsOpen,
  setSettingsOpen
}: {
  mode: AnalysisMode;
  setMode: (mode: AnalysisMode) => void;
  exportReport: () => void;
  copyReport: () => void;
  onBack: () => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
}) {
  return (
    <header className="app-topbar analysis-bar">
      <div className="analysis-left-tools">
        <button className="secondary compact-action" onClick={onBack}>返回填写</button>
        <SegmentSwitch
          items={[
            { id: "local", label: "本地分析" },
            { id: "ai", label: "AI分析" }
          ]}
          active={mode}
          onChange={(id) => setMode(id as AnalysisMode)}
        />
      </div>
      <div className="top-title">
        <strong>分析结果</strong>
        <span>分数只是参考，真正结论看岗位、简历、性格、真实情况和城市机会。</span>
      </div>
      <div className="right-tools">
        <button className="secondary compact-action" onClick={copyReport}>
          <Copy size={17} /> 复制
        </button>
        <button className="export-button" onClick={exportReport}>
          <Download size={18} /> 导出
        </button>
        <button className={settingsOpen ? "gear active" : "gear"} onClick={() => setSettingsOpen(!settingsOpen)} aria-label="设置">
          <Settings size={21} />
        </button>
      </div>
    </header>
  );
}

function ProfileTopBar({
  state,
  onBack,
  exportReport,
  copyReport,
  onHistory,
  onRole,
  settingsOpen,
  setSettingsOpen,
  onPrivacy
}: {
  state: AppState;
  onBack: () => void;
  exportReport: () => void;
  copyReport: () => void;
  onHistory: () => void;
  onRole: (role: UserRole) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  onPrivacy: () => void;
}) {
  return (
    <header className="app-topbar">
      <button className="secondary" onClick={onBack}>返回填写</button>
      <div className="top-title">
        <strong>{state.role === "jobseeker" ? "个人求职展示" : "招聘方案展示"}</strong>
        <span>把分析结果整理成可以继续修改和导出的版本。</span>
      </div>
      <div className="right-tools">
        <SegmentSwitch
          items={[
            { id: "jobseeker", label: "求职" },
            { id: "recruiter", label: "招聘" }
          ]}
          active={state.role}
          onChange={(id) => onRole(id as UserRole)}
        />
        <button className="export-button" onClick={exportReport}>
          <Download size={18} /> 导出
        </button>
        <button className="secondary compact-action" onClick={copyReport}>
          <Copy size={17} /> 复制
        </button>
        <button className="secondary compact-action" onClick={onHistory}>历史</button>
        <button className="secondary compact-action" onClick={onPrivacy}>数据</button>
        <button className={settingsOpen ? "gear active" : "gear"} onClick={() => setSettingsOpen(!settingsOpen)} aria-label="设置">
          <Settings size={21} />
        </button>
      </div>
    </header>
  );
}

function HistoryTopBar({
  onBack,
  backLabel,
  exportReport,
  settingsOpen,
  setSettingsOpen,
  onPrivacy
}: {
  onBack: () => void;
  backLabel: string;
  exportReport: () => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  onPrivacy: () => void;
}) {
  return (
    <header className="app-topbar">
      <button className="secondary" onClick={onBack}>{backLabel}</button>
      <div className="top-title">
        <strong>历史分析记录</strong>
        <span>保存最近 50 次求职和招聘分析，方便回看不同岗位版本。</span>
      </div>
      <div className="right-tools">
        <button className="export-button" onClick={exportReport}>
          <Download size={18} /> 导出当前
        </button>
        <button className="secondary compact-action" onClick={onPrivacy}>数据</button>
        <button className={settingsOpen ? "gear active" : "gear"} onClick={() => setSettingsOpen(!settingsOpen)} aria-label="设置">
          <Settings size={21} />
        </button>
      </div>
    </header>
  );
}

function PrivacyTopBar({
  onBack,
  backLabel,
  exportReport,
  settingsOpen,
  setSettingsOpen
}: {
  onBack: () => void;
  backLabel: string;
  exportReport: () => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
}) {
  return (
    <header className="app-topbar">
      <button className="secondary" onClick={onBack}>{backLabel}</button>
      <div className="top-title">
        <strong>隐私与本地数据</strong>
        <span>当前填写、历史记录和 AI 授权都由你控制。</span>
      </div>
      <div className="right-tools">
        <button className="export-button" onClick={exportReport}>
          <Download size={18} /> 导出报告
        </button>
        <button className={settingsOpen ? "gear active" : "gear"} onClick={() => setSettingsOpen(!settingsOpen)} aria-label="设置">
          <Settings size={21} />
        </button>
      </div>
    </header>
  );
}

function ChangelogTopBar({
  onBack,
  backLabel,
  settingsOpen,
  setSettingsOpen
}: {
  onBack: () => void;
  backLabel: string;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
}) {
  return (
    <header className="app-topbar">
      <button className="secondary" onClick={onBack}>{backLabel}</button>
      <div className="top-title">
        <strong>更新日志</strong>
        <span>查看每个版本新增了什么、优化了什么。</span>
      </div>
      <div className="right-tools">
        <button className={settingsOpen ? "gear active" : "gear"} onClick={() => setSettingsOpen(!settingsOpen)} aria-label="设置">
          <Settings size={21} />
        </button>
      </div>
    </header>
  );
}

function SegmentSwitch<T extends string>({ items, active, onChange }: { items: { id: T; label: string }[]; active: T; onChange: (id: T) => void }) {
  return (
    <div className="switch-pill" style={{ "--switch-count": items.length } as CSSProperties & Record<"--switch-count", number>}>
      {items.map((item) => (
        <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => onChange(item.id)}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

function SettingsPopover({
  state,
  setState,
  savedAt,
  exportReport,
  onPrivacy,
  onChangelog
}: {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  savedAt: string;
  exportReport: () => void;
  onPrivacy: () => void;
  onChangelog: () => void;
}) {
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [testOk, setTestOk] = useState(false);
  const runTest = async () => {
    setTesting(true);
    setTestMessage("");
    setTestOk(false);
    try {
      setTestMessage(await testAiConnection(state));
      setTestOk(true);
    } catch (error) {
      setTestMessage(getErrorMessage(error, "AI 连接测试失败，请检查设置。"));
    } finally {
      setTesting(false);
    }
  };
  const modelWarning = /gpt-5\.5/i.test(state.aiConfig.model)
    ? "当前模型名 gpt-5.5 很可能不可用。建议先点 OpenAI 预设使用 gpt-4.1-mini，连接成功后再换成你服务商实际支持的模型。"
    : "";

  return (
    <aside className="settings-popover">
      <strong>设置</strong>
      <div className="settings-helper">
        <b>AI 配置向导</b>
        <span>测试时先点服务商预设，再只填写自己的 API Key。没有 Key 也能使用本地分析。</span>
      </div>
      <div className="ai-config-guide">
        <b>配置步骤</b>
        <ol>
          <li>先点下面的服务商预设，自动填入 Base URL 和模型。</li>
          <li>粘贴自己的 API Key；不要填写别人的 Key 或公开示例 Key。</li>
          <li>点击“测试 AI 连接”，成功后再勾选隐私授权。</li>
          <li>正式分析会发送岗位、简历和问卷内容；连接测试只发送 OK 测试语句。</li>
        </ol>
      </div>
      <TextInput label="API Key" type="password" value={state.aiConfig.apiKey} onChange={(value) => setState((current) => ({ ...current, aiConfig: { ...current.aiConfig, apiKey: value } }))} />
      <TextInput label="Base URL" value={state.aiConfig.baseUrl} onChange={(value) => setState((current) => ({ ...current, aiConfig: { ...current.aiConfig, baseUrl: value } }))} />
      <TextInput label="模型" value={state.aiConfig.model} onChange={(value) => setState((current) => ({ ...current, aiConfig: { ...current.aiConfig, model: value } }))} />
      {modelWarning && <div className="settings-status">{modelWarning}</div>}
      <div className="preset-row">
        {[
          { label: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4.1-mini" },
          { label: "DeepSeek", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
          { label: "通义兼容", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen-plus" }
        ].map((item) => (
          <button
            key={item.label}
            className="secondary compact-action"
            onClick={() => setState((current) => ({ ...current, aiConfig: { ...current.aiConfig, baseUrl: item.baseUrl, model: item.model } }))}
          >
            {item.label}
          </button>
        ))}
      </div>
      <label className="privacy-check">
        <input
          type="checkbox"
          checked={state.aiConfig.allowSensitiveAi}
          onChange={(event) => setState((current) => ({ ...current, aiConfig: { ...current.aiConfig, allowSensitiveAi: event.target.checked } }))}
        />
        <span>我确认允许把岗位、简历、性格问卷和真实情况发送给已配置的 AI 服务商用于分析。</span>
      </label>
      <button className="secondary" onClick={exportReport}>
        <Download size={17} /> 导出当前报告
      </button>
      <button className="secondary" onClick={runTest} disabled={testing || !state.aiConfig.apiKey.trim()}>
        <Sparkles size={17} /> {testing ? "测试中..." : "测试 AI 连接"}
      </button>
      {testMessage && <div className={testOk ? "settings-status ok" : "settings-status"}>{testMessage}</div>}
      <small>如果服务商给的是完整 chat/completions 地址，系统会自动转换成正确 Base URL。</small>
      <button className="secondary" onClick={onPrivacy}>
        <ShieldCheck size={17} /> 隐私与数据管理
      </button>
      <button className="secondary" onClick={onChangelog}>
        <ClipboardList size={17} /> 更新日志
      </button>
      <small><Save size={14} /> 已自动保存 {savedAt || "待同步"}</small>
    </aside>
  );
}

function QaWorkspace({
  state,
  modules,
  questions,
  activeModuleId,
  activeQuestion,
  draft,
  setDraft,
  aiConfig,
  setActiveModuleId,
  goQuestion,
  saveCurrentAnswer,
  startAnalysis,
  incompleteCount,
  requiredCount,
  completedRequiredCount,
  isSampleData,
  resumeImportPreview,
  setResumeImportPreview,
  clearSample
}: {
  state: AppState;
  modules: Module[];
  questions: Question[];
  activeModuleId: string;
  activeQuestion: Question;
  draft: string;
  setDraft: (value: string) => void;
  aiConfig: AppState["aiConfig"];
  setActiveModuleId: (id: string) => void;
  goQuestion: (question: Question) => void;
  saveCurrentAnswer: () => void;
  startAnalysis: () => void;
  incompleteCount: number;
  requiredCount: number;
  completedRequiredCount: number;
  isSampleData: boolean;
  resumeImportPreview: ResumeImportPreview | null;
  setResumeImportPreview: (preview: ResumeImportPreview | null) => void;
  clearSample: () => void;
}) {
  const moduleQuestions = questions.filter((item) => item.moduleId === activeModuleId);
  const currentIndex = questions.findIndex((item) => item.id === activeQuestion.id);
  const options = activeQuestion.id === "t-role" ? ["暂不确定，先让系统推荐方向", ...(rolesByIndustry[state.targetJob.industry] || [])] : activeQuestion.options || [];
  const workflowTitle =
    state.role === "recruiter"
      ? activeModuleId === "screening"
        ? "批量筛简历约 3-5 分钟"
        : "招聘要求梳理约 5-10 分钟"
      : state.detailMode === "student"
        ? "学生/应届方向探索约 6-10 分钟"
      : state.detailMode === "deep"
        ? "详细诊断约 8-12 分钟"
        : "粗略诊断约 2-4 分钟";
  const workflowDescription =
    state.role === "recruiter"
      ? activeModuleId === "screening"
        ? `必填 ${completedRequiredCount}/${requiredCount}。先明确筛选优先级，再粘贴候选人简历；信息越完整，候选人排序、风险点和面试追问越可用。`
        : `必填 ${completedRequiredCount}/${requiredCount}。岗位职责、硬性门槛、试用期指标和真实工作强度写得越清楚，人才画像和 JD 越准确。`
      : state.detailMode === "quick"
        ? `必填 ${completedRequiredCount}/${requiredCount}。粗略模式只看诉求、简历和目标岗位，适合先快速判断能不能投、简历怎么改；信息越少，结论越偏参考。`
        : state.detailMode === "student"
          ? `必填 ${completedRequiredCount}/${requiredCount}。没有实习也可以分析，重点是把课程、社团、兼职、竞赛和作品转成第一份工作的证据。`
        : `必填 ${completedRequiredCount}/${requiredCount}。填写越完整，岗位、简历、性格、真实情况和城市机会的判断越准确；信息不完整时结果只适合作参考。`;

  return (
    <section className="qa-layout">
      <div className="qa-fixed-head">
        <div className="workflow-hint">
          <div>
            <strong>{workflowTitle}</strong>
            <span>{workflowDescription}</span>
          </div>
          {isSampleData && (
            <div className="sample-inline-warning">
              <span>仍有示例内容，正式分析前请替换成真实信息。</span>
              <button type="button" className="secondary compact-action" onClick={clearSample}>
                一键清空示例
              </button>
            </div>
          )}
        </div>

        <nav className="module-row" aria-label="模块">
          {modules.map((module) => (
            <button key={module.id} className={activeModuleId === module.id ? "active" : ""} onClick={() => setActiveModuleId(module.id)}>
              {module.icon}
              <span>{module.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <section className="qa-card">
        <div className="question-jump">
          <span>题号</span>
          <div>
            {moduleQuestions.map((question, index) => {
              const filled = Boolean(question.value(state).trim());
              return (
                <button
                  key={question.id}
                  className={`${question.id === activeQuestion.id ? "active" : ""} ${filled ? "filled" : ""}`}
                  onClick={() => goQuestion(question)}
                  aria-label={`第 ${index + 1} 题`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="question-main">
          <div className="question-head">
            <span>{currentIndex + 1}/{questions.length}</span>
            <h2>{activeQuestion.title}</h2>
            {activeQuestion.required && <b>必填</b>}
          </div>
          <p>{activeQuestion.helper}</p>
          <QuestionInput
            question={activeQuestion}
            options={options}
            value={draft}
            onChange={setDraft}
            aiConfig={aiConfig}
            resumeImportPreview={resumeImportPreview}
            setResumeImportPreview={setResumeImportPreview}
          />
        </div>

        <footer className="qa-actions">
          <button className="secondary" disabled={currentIndex <= 0} onClick={() => goQuestion(questions[currentIndex - 1])}>上一题</button>
          <button className="secondary" onClick={saveCurrentAnswer}><Save size={17} /> 已自动保存</button>
          <button className="secondary" disabled={currentIndex >= questions.length - 1} onClick={() => goQuestion(questions[currentIndex + 1])}>下一题</button>
          <button className="primary" onClick={startAnalysis}>
            <Sparkles size={18} /> 确定分析
          </button>
        </footer>

        {incompleteCount > 0 && <div className="qa-warning">还有 {incompleteCount} 个关键问题未填写，直接分析会影响准确性。</div>}
      </section>
    </section>
  );
}

function QuestionInput({
  question,
  options,
  value,
  onChange,
  aiConfig,
  resumeImportPreview,
  setResumeImportPreview
}: {
  question: Question;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  aiConfig: AppState["aiConfig"];
  resumeImportPreview: ResumeImportPreview | null;
  setResumeImportPreview: (preview: ResumeImportPreview | null) => void;
}) {
  if (question.id === "resume") {
    return <ResumeInput value={value} onChange={onChange} aiConfig={aiConfig} preview={resumeImportPreview} onParsed={setResumeImportPreview} />;
  }
  if (question.type === "textarea") {
    return <textarea className="qa-textarea" value={value} onChange={(event) => onChange(event.target.value)} />;
  }
  if (question.type === "select") {
    return (
      <select className="qa-input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
    );
  }
  if (question.type === "assessment") {
    return (
      <div className="assessment-block">
        <small>请按最近半年真实工作/学习表现作答，没有好坏之分，只用于判断岗位环境是否匹配。</small>
        <div className="answer-grid">
          {answerOptions.map((item) => (
            <button key={item.value} className={value === String(item.value) ? "active" : ""} onClick={() => onChange(String(item.value))}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (question.type === "chips") {
    const selected = value ? value.split("||") : [];
    return (
      <div className="chip-grid">
        {options.map((item) => {
          const active = selected.includes(item);
          return (
            <button
              key={item}
              className={active ? "active" : ""}
              onClick={() => onChange(active ? selected.filter((option) => option !== item).join("||") : [...selected, item].join("||"))}
            >
              {item}
            </button>
          );
        })}
      </div>
    );
  }
  return <input className="qa-input" value={value} onChange={(event) => onChange(event.target.value)} />;
}

function ResumeInput({
  value,
  onChange,
  aiConfig,
  preview,
  onParsed
}: {
  value: string;
  onChange: (value: string) => void;
  aiConfig: AppState["aiConfig"];
  preview: ResumeImportPreview | null;
  onParsed: (preview: ResumeImportPreview | null) => void;
}) {
  const [importError, setImportError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (value.trim() && !preview) {
      onParsed(parseResumeImportPreview(value));
    }
  }, [value, preview, onParsed]);

  const loadTextFile = (file?: File) => {
    if (!file) return;
    setImportError("");
    if (/\.(docx|pdf)$/i.test(file.name)) {
      setImportError("已选择 Word/PDF 简历。当前版本不直接解析复杂排版，请先打开文件复制全文粘贴到下方；如果已配置 AI，可粘贴文本后点击“AI 识别简历”。这样能避免解析错乱导致判断不准。");
      onParsed({
        summary: `已选择 ${file.name}，请复制文件正文粘贴后继续识别。`,
        fields: [{ label: "文件类型", value: file.name.split(".").pop()?.toUpperCase() || "文档" }],
        sections: [{ title: "导入提示", items: ["Word/PDF 需要先复制正文文本", "保留岗位、经历、项目、量化结果和真实限制", "粘贴后可用本地识别或 AI 识别"] }],
        missing: ["尚未读取到正文文本"]
      });
      return;
    }
    if (!/\.(txt|md)$/i.test(file.name)) {
      setImportError("当前支持 .txt / .md 文本简历；Word/PDF 请先打开文件复制正文后粘贴。");
      return;
    }
    if (file.size > 1024 * 1024) {
      setImportError("文件过大，请先复制核心简历内容，当前限制 1MB 以内。");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      onChange(text);
      onParsed(parseResumeImportPreview(text));
    };
    reader.onerror = () => setImportError("读取文件失败，请复制简历文本粘贴到输入框。");
    reader.readAsText(file, "utf-8");
  };

  const updateText = (text: string) => {
    onChange(text);
    onParsed(parseResumeImportPreview(text));
  };

  const runAiParse = async () => {
    if (!value.trim()) return;
    setAnalyzing(true);
    setImportError("");
    try {
      const preview = await runResumeImportAnalysis(value, aiConfig);
      onParsed(preview);
    } catch (error) {
      setImportError(getErrorMessage(error, "AI 简历识别失败，请先使用本地模板或稍后重试。"));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <section className="resume-input-panel">
      <div className="resume-input-actions">
        <label className="secondary file-import-button">
          <Upload size={17} /> 导入简历文件
          <input type="file" accept=".txt,.md,.docx,.pdf,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => loadTextFile(event.target.files?.[0])} />
        </label>
        <button className="secondary" type="button" onClick={() => {
          const next = value.trim() ? `${value.trim()}\n\n${resumeTemplate}` : resumeTemplate;
          onChange(next);
          onParsed(parseResumeImportPreview(next));
        }}>
          <FileText size={17} /> 使用简历模板
        </button>
        <button className="secondary" type="button" onClick={runAiParse} disabled={!value.trim() || analyzing}>
          <Sparkles size={17} /> {analyzing ? "识别中..." : "AI 识别简历"}
        </button>
      </div>
      <div className="resume-template-hint">
        <b>建议按“岗位目标、工作经历、量化结果、工具方法、项目案例、真实限制”填写。</b>
        <span>TXT/MD 可直接读取；Word/PDF 先复制正文粘贴更稳。填模板会进入本地分析；开启 AI 后也会一起用于识别简历证据、能力缺口和改写方案。</span>
      </div>
      {importError && <div className="qa-warning">{importError}</div>}
      <textarea className="qa-textarea resume-textarea" value={value} onChange={(event) => updateText(event.target.value)} />
      {preview && <ResumeImportPreviewCard preview={preview} />}
    </section>
  );
}

function ResumeImportPreviewCard({ preview }: { preview: ResumeImportPreview }) {
  return (
    <article className="resume-preview-card">
      <div className="resume-preview-head">
        <strong>简历识别结果</strong>
        <span>{preview.summary}</span>
      </div>
      {preview.fields.length > 0 && (
        <div className="resume-preview-fields">
          {preview.fields.map((field) => (
            <div key={field.label}>
              <span>{field.label}</span>
              <b>{field.value}</b>
            </div>
          ))}
        </div>
      )}
      <div className="resume-preview-grid">
        {preview.sections.map((section) => (
          <section key={section.title}>
            <b>{section.title}</b>
            <ul>
              {section.items.map((item, index) => (
                <li key={`${section.title}-${index}`}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {preview.missing.length > 0 && (
        <div className="resume-preview-missing">
          <b>建议补充</b>
          <ul>
            {preview.missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function AnalysisScreen({
  state,
  mode,
  match,
  decisionPath,
  optimizedResume,
  diagnosticInsights,
  actionPlan,
  resumeRewritePlan,
  resumeVariants,
  recruiterAnalysis,
  candidateBatch,
  knowledge,
  sampleAudit,
  aiText,
  aiLoading,
  aiError,
  runAi,
  backToLocal,
  onConfirm,
  openSettings,
  isSampleData
}: {
  state: AppState;
  mode: AnalysisMode;
  match: ReturnType<typeof calculateMatch>;
  decisionPath: ReturnType<typeof buildDecisionPath>;
  optimizedResume: string;
  diagnosticInsights: ReturnType<typeof buildDiagnosticInsights>;
  actionPlan: ReturnType<typeof buildActionPlan>;
  resumeRewritePlan: ReturnType<typeof buildResumeRewritePlan>;
  resumeVariants: ReturnType<typeof buildResumeVariants>;
  recruiterAnalysis: ReturnType<typeof analyzeRecruiterJob>;
  candidateBatch: ReturnType<typeof analyzeCandidateBatch>;
  knowledge: ReturnType<typeof buildKnowledgeContext>;
  sampleAudit: string[];
  aiText: string;
  aiLoading: boolean;
  aiError: string;
  runAi: () => void;
  backToLocal: () => void;
  onConfirm: () => void;
  openSettings: () => void;
  isSampleData: boolean;
}) {
  const [showFullReport, setShowFullReport] = useState(false);
  const localReport =
    state.role === "jobseeker"
      ? buildLocalReport(state, match, decisionPath, optimizedResume, knowledge, diagnosticInsights, actionPlan)
      : buildRecruiterReport(recruiterAnalysis, candidateBatch);

  return (
    <section className="analysis-layout">
      <div className="analysis-box">
        <div className="analysis-scroll">
        {isSampleData && (
          <div className="qa-warning analysis-warning">当前仍包含示例内容，分析结果只用于体验流程。正式使用前请返回填写页，点击“一键清空示例”后再录入真实信息。</div>
        )}
        {mode === "local" ? (
          <>
            {state.role === "jobseeker" ? (
              <StructuredJobseekerAnalysis state={state} match={match} decisionPath={decisionPath} optimizedResume={optimizedResume} knowledge={knowledge} diagnosticInsights={diagnosticInsights} actionPlan={actionPlan} sampleAudit={sampleAudit} />
            ) : (
              <StructuredRecruiterAnalysis analysis={recruiterAnalysis} candidateBatch={candidateBatch} />
            )}
            {state.role === "jobseeker" && <ResumeVariantCards variants={resumeVariants} />}
            {state.role === "jobseeker" && <ResumeRewriteCards items={resumeRewritePlan} />}
            <button className="secondary report-toggle" onClick={() => setShowFullReport((open) => !open)}>
              {showFullReport ? "收起完整报告" : "查看完整报告"}
            </button>
            {showFullReport && <pre className="full-report">{localReport}</pre>}
          </>
        ) : (
          <div className="ai-analysis">
            {!aiText && !aiLoading && !aiError && (
              <AiSetupCard state={state} openSettings={openSettings} runAi={runAi} />
            )}
            {aiLoading && <p>AI 正在综合岗位、简历、性格、真实情况和城市机会，请稍等...</p>}
            {aiError && <AiErrorBox message={aiError} openSettings={openSettings} retry={runAi} backToLocal={backToLocal} />}
            {aiText && <AiStructuredResult text={aiText} state={state} match={match} decisionPath={decisionPath} knowledge={knowledge} />}
          </div>
        )}
        </div>
      </div>
      <div className="analysis-footer">
      <button className="primary confirm-analysis" onClick={onConfirm}>
        <Check size={18} /> {state.role === "jobseeker" ? "保存并查看求职方案" : "保存并查看招聘方案"}
      </button>
      </div>
    </section>
  );
}

function AiSetupCard({ state, openSettings, runAi }: { state: AppState; openSettings: () => void; runAi: () => void }) {
  const ready = Boolean(state.aiConfig.apiKey.trim() && state.aiConfig.allowSensitiveAi);
  return (
    <section className="ai-setup-card">
      <div>
        <h3>使用 AI 做更深入判断</h3>
        <p>AI 会结合岗位、简历、性格问卷、真实情况和城市机会，回答为什么适合或不适合、该补什么、还适合做什么。</p>
      </div>
      <ol>
        <li className={state.aiConfig.apiKey.trim() ? "done" : ""}>填写 API Key 和模型</li>
        <li className={state.aiConfig.allowSensitiveAi ? "done" : ""}>确认隐私授权</li>
        <li>开始 AI 分析</li>
      </ol>
      <div className="action-row">
        <button className="secondary" onClick={openSettings}>打开设置</button>
        <button className="primary" onClick={runAi} disabled={!ready}>
          <Sparkles size={18} /> 开始 AI 分析
        </button>
      </div>
      {!ready && <small>未填写 Key 或未授权时，可以继续使用本地分析。</small>}
    </section>
  );
}

function ProfileScreen({
  state,
  match,
  decisionPath,
  optimizedResume,
  diagnosticInsights,
  actionPlan,
  resumeRewritePlan,
  resumeVariants,
  recruiterAnalysis,
  candidateBatch,
  knowledge,
  aiText,
  records
}: {
  state: AppState;
  match: ReturnType<typeof calculateMatch>;
  decisionPath: ReturnType<typeof buildDecisionPath>;
  optimizedResume: string;
  diagnosticInsights: ReturnType<typeof buildDiagnosticInsights>;
  actionPlan: ReturnType<typeof buildActionPlan>;
  resumeRewritePlan: ReturnType<typeof buildResumeRewritePlan>;
  resumeVariants: ReturnType<typeof buildResumeVariants>;
  recruiterAnalysis: ReturnType<typeof analyzeRecruiterJob>;
  candidateBatch: ReturnType<typeof analyzeCandidateBatch>;
  knowledge: ReturnType<typeof buildKnowledgeContext>;
  aiText: string;
  records: AnalysisRecord[];
}) {
  if (state.role === "recruiter") {
    return (
      <section className="profile-grid">
        <SummaryCard title="岗位画像" value={state.recruiterJob.title || "未命名岗位"} text={`${state.recruiterJob.company}｜${state.recruiterJob.salary}`} />
        <ResultCard title="必备能力" items={recruiterAnalysis.mustHave} />
        <ResultCard title="加分项" items={recruiterAnalysis.niceToHave} />
        <ResultCard title="招聘风险" items={recruiterAnalysis.risks} />
        <ResultCard title="检索关键词" items={recruiterAnalysis.searchKeywords} />
        <ResultCard title="面试追问" items={recruiterAnalysis.interviewQuestions} />
        <CandidateBatchCards candidates={candidateBatch} />
        <pre className="profile-report">{recruiterAnalysis.improvedJd}</pre>
      </section>
    );
  }

  return (
    <section className="profile-grid">
      <CareerProfileCard state={state} match={match} decisionPath={decisionPath} records={records} />
      <SummaryCard title="下一步路径" value={decisionPath.primaryAction} text={`${decisionPath.title}｜${decisionPath.verdict}`} />
      <SummaryCard title="适配参考" value={`${match.total}/100`} text={`${match.level}｜分数只作参考，最终按路径行动。`} />
      <SummaryCard title="推荐方向" value={state.targetJob.role || "目标岗位"} text={`${state.targetJob.city || state.profile.city}${state.targetJob.cityArea ? `｜${state.targetJob.cityArea}` : ""}｜${state.targetJob.industry}`} />
      <LocalInsightCards insights={diagnosticInsights} />
      <ActionPlanCards actionPlan={actionPlan} />
      <ResultCard title="做这个方向的优势" items={decisionPath.advantages} />
      <ResultCard title="做这个方向的风险" items={decisionPath.risks.slice(0, 5)} />
      <ResultCard title="如果坚持做这个岗位" items={decisionPath.ifInsist} />
      <ResultCard title="更适合尝试" items={decisionPath.alternatives} />
      <ResultCard title="最近分析记录" items={records.length ? records.slice(0, 4).map((item) => `${item.createdAt}｜${item.title}｜${item.level || "分析"}`) : ["暂无历史分析记录"]} />
      <ResultCard
        title="市场验证记录"
        items={[
          state.targetJob.marketValidation || state.careerIntent.marketValidation || "还没有记录招聘软件验证信息。建议搜索“城市+岗位”，记录岗位数量、薪资区间、常见要求和集中区域。",
          `当前城市/区域：${state.profile.city || "未填写"}${state.profile.cityArea ? ` · ${state.profile.cityArea}` : ""}`,
          `目标城市/区域：${state.targetJob.city || "未填写"}${state.targetJob.cityArea ? ` · ${state.targetJob.cityArea}` : ""}`
        ]}
      />
      <ResultCard
        title="隐私边界"
        items={[
          "离异、带娃、照护、通勤、加班、出差等信息只用于判断岗位冲突和稳定性，不用于评价个人价值。",
          state.aiConfig.allowSensitiveAi ? "你已授权 AI 分析；正式分析会把表单内容发送给你配置的 AI 服务商。" : "当前未授权 AI 敏感分析；本地分析不主动发送你的简历和真实情况。",
          "导出、清空当前填写和清空历史记录可以在隐私与数据页面完成。"
        ]}
      />
      <ResultCard
        title="城市提示"
        items={
          knowledge.targetCity
            ? [
                `目标城市优势行业：${knowledge.targetCity.strongIndustries.join("、")}`,
                `适合岗位：${knowledge.targetCity.suitableRoles.join("、")}`,
                `注意：${knowledge.targetCity.cautions.join("、")}`
              ]
            : ["暂无目标城市库数据，建议让 AI 结合岗位和行业进一步判断。"]
        }
      />
      {aiText && <pre className="profile-report">{aiText}</pre>}
      <ResumeVariantCards variants={resumeVariants} />
      <ResumeRewriteCards items={resumeRewritePlan} />
      <pre className="profile-report">{optimizedResume}</pre>
    </section>
  );
}

function CareerProfileCard({
  state,
  match,
  decisionPath,
  records
}: {
  state: AppState;
  match: ReturnType<typeof calculateMatch>;
  decisionPath: ReturnType<typeof buildDecisionPath>;
  records: AnalysisRecord[];
}) {
  const resumeStatus = state.resumeDraft.trim() ? "已建立简历素材" : "未导入简历";
  const target = state.targetJob.role || decisionPath.alternatives[0] || "待明确方向";
  return (
    <section className="career-profile-card">
      <div>
        <span>职业档案</span>
        <h2>{state.profile.name || "游客用户"} · {target}</h2>
        <p>{decisionPath.title}｜{match.level}｜{state.profile.city || "城市未填"}{state.profile.cityArea ? ` · ${state.profile.cityArea}` : ""}</p>
      </div>
      <div className="profile-facts">
        <b>{match.total}<small>适配参考</small></b>
        <b>{records.length}<small>历史分析</small></b>
        <b>{resumeStatus}<small>简历状态</small></b>
      </div>
    </section>
  );
}

function HistoryScreen({ records }: { records: AnalysisRecord[] }) {
  const [expandedId, setExpandedId] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<HistoryRoleFilter>("all");
  const filteredRecords = filterHistoryRecords(records, { query, role: roleFilter });

  if (!records.length) {
    return (
      <section className="history-empty">
        <ClipboardList size={34} />
        <h2>暂无历史分析</h2>
        <p>完成一次“确定分析”后，系统会自动保存求职或招聘分析记录。</p>
      </section>
    );
  }

  return (
    <section className="history-list">
      <div className="history-tools">
        <label className="field">
          <span>搜索历史</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入岗位、城市、结论或关键词" />
        </label>
        <SegmentSwitch
          items={[
            { id: "all", label: "全部" },
            { id: "jobseeker", label: "求职" },
            { id: "recruiter", label: "招聘" }
          ]}
          active={roleFilter}
          onChange={setRoleFilter}
        />
      </div>
      {!filteredRecords.length && (
        <article className="history-empty inline-empty">
          <ClipboardList size={28} />
          <h2>没有匹配记录</h2>
          <p>换个关键词，或切回全部角色再看看。</p>
        </article>
      )}
      {filteredRecords.map((record) => (
        <article key={record.id} className="history-card">
          <div>
            <span>{record.role === "jobseeker" ? "求职" : "招聘"}｜{record.mode === "student" ? "学生" : record.mode === "deep" ? "详细" : "粗略"}</span>
            <h3>{record.title || "未命名分析"}</h3>
            <p>{record.summary}</p>
          </div>
          <aside>
            {typeof record.score === "number" && <strong>{record.score}</strong>}
            <b>{record.level || "分析"}</b>
            <small>{record.createdAt}</small>
          </aside>
          <button className="secondary history-detail-button" onClick={() => setExpandedId(expandedId === record.id ? "" : record.id)}>
            {expandedId === record.id ? "收起详情" : "查看详情"}
          </button>
          {expandedId === record.id && <pre>{record.raw}</pre>}
        </article>
      ))}
    </section>
  );
}

function ChangelogScreen({ entries }: { entries: ChangelogEntry[] }) {
  return (
    <section className="changelog-list">
      {entries.map((entry, index) => (
        <article key={entry.version} className={index === 0 ? "changelog-card current" : "changelog-card"}>
          <div className="changelog-head">
            <span>{entry.date}</span>
            <strong>v{entry.version}</strong>
            {index === 0 && <b>本次更新</b>}
          </div>
          <h2>{entry.title}</h2>
          <div className="changelog-columns">
            <section>
              <h3>更新内容</h3>
              <ul>
                {entry.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3>优化内容</h3>
              <ul>
                {entry.optimizations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        </article>
      ))}
    </section>
  );
}

function PrivacyScreen({
  state,
  records,
  onClearState,
  onClearRecords,
  onClearAiKey,
  onExportData
}: {
  state: AppState;
  records: AnalysisRecord[];
  onClearState: () => void;
  onClearRecords: () => void;
  onClearAiKey: () => void;
  onExportData: () => void;
}) {
  return (
    <section className="privacy-grid">
      <article className="privacy-card full-width-card">
        <ShieldCheck size={28} />
        <h2>敏感信息使用边界</h2>
        <p>婚育、离异、带娃、照护、经济压力、健康、通勤、加班和出差信息，只用于判断岗位冲突、求职紧急度和稳定性风险，不用于评价用户能力或价值。</p>
        <small>未勾选 AI 授权前，这些信息只参与本地分析；勾选后才会发送给你配置的 AI 服务商。</small>
      </article>
      <article className="privacy-card">
        <ShieldCheck size={28} />
        <h2>AI 授权状态</h2>
        <p>{state.aiConfig.allowSensitiveAi ? "已允许把填写内容发送给你配置的 AI 服务商用于分析。" : "尚未授权发送敏感填写内容，AI 深度分析不会自动开始。"}</p>
        <small>连接测试只发送无敏感测试语句；正式 AI 分析才会发送岗位、简历、问卷和真实情况。</small>
      </article>
      <article className="privacy-card">
        <Database size={28} />
        <h2>本地数据</h2>
        <p>当前填写会自动保存在本机，历史记录最多保留 50 条。</p>
        <small>历史记录：{records.length} 条｜当前角色：{state.role === "jobseeker" ? "求职" : "招聘"}</small>
      </article>
      <article className="privacy-card">
        <Download size={28} />
        <h2>正式桌面版</h2>
        <p>正式安装器运行时不需要用户手动启动网页端口；开发预览才会看到 127.0.0.1。</p>
        <small>给朋友测试时优先发安装器；如果只发文件夹，需要同时带上 release 里的 exe 和使用说明。</small>
      </article>
      <article className="privacy-card action-card">
        <h2>数据操作</h2>
        <button className="secondary" onClick={onExportData}>
          <Download size={17} /> 导出本地数据
        </button>
        <button className="secondary danger-action" onClick={onClearState}>
          <Trash2 size={17} /> 清空当前填写
        </button>
        <button className="secondary danger-action" onClick={onClearRecords}>
          <Trash2 size={17} /> 清空历史记录
        </button>
        <button className="secondary danger-action" onClick={onClearAiKey}>
          <LockKeyhole size={17} /> 清除 AI Key
        </button>
      </article>
    </section>
  );
}

function AiStructuredResult({
  text,
  state,
  match,
  decisionPath,
  knowledge
}: {
  text: string;
  state: AppState;
  match: ReturnType<typeof calculateMatch>;
  decisionPath: ReturnType<typeof buildDecisionPath>;
  knowledge: ReturnType<typeof buildKnowledgeContext>;
}) {
  const [showRaw, setShowRaw] = useState(false);
  const [activePossibility, setActivePossibility] = useState("");
  const sections = parseAiSections(text);
  const sectionMap = Object.fromEntries(sections.map((section) => [section.title, section.content]));
  const qualityIssues = evaluateAiResultQuality(sectionMap);
  const possibilities = buildAiPossibilities(state, match, decisionPath, knowledge, sectionMap);
  const selectedPossibility = possibilities.find((item) => item.label === activePossibility) || possibilities[0];
  const adviceGroups = [
    { title: "原因依据", content: sectionMap["为什么不是简单问 AI"] || sectionMap["为什么现在可能不适合"] },
    { title: "当前最该做", content: sectionMap["现在最该做什么"] },
    { title: "坚持目标岗位", content: sectionMap["如果坚持这个岗位，先补什么"] },
    { title: "岗位和城市机会", content: sectionMap["更适合的岗位和城市"] },
    { title: "简历和投递", content: sectionMap["简历和投递打法"] },
    { title: "风险提醒", content: sectionMap["为什么现在可能不适合"] }
  ].filter((item) => item.content?.trim());
  return (
    <section className="ai-result">
      <article className="ai-visual-hero">
        <div>
          <span>AI 综合诊断</span>
          <h3>{sectionMap["一句话结论"] ? stripMarkdown(sectionMap["一句话结论"]).slice(0, 96) : decisionPath.title}</h3>
          <p>{decisionPath.verdict}</p>
        </div>
        <b>{match.total}</b>
      </article>
      {qualityIssues.length > 0 && (
        <article className="ai-quality-card">
          <strong>AI 结果需要复核</strong>
          <ul>
            {qualityIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
          <small>本地分析和百分比诊断仍可参考；建议点击“重试 AI”或补充简历/JD 后重新分析。</small>
        </article>
      )}
      <div className="possibility-grid">
        {possibilities.map((item) => (
          <PossibilityRing key={item.label} selected={selectedPossibility.label === item.label} onSelect={() => setActivePossibility(item.label)} {...item} />
        ))}
      </div>
      <PossibilityDetail item={selectedPossibility} />
      <div className="ai-reason-board">
        {adviceGroups.map((section) => (
          <article key={section.title} className={section.title.includes("风险") ? "ai-advice-card risk" : "ai-advice-card"}>
            <h3>{section.title}</h3>
            <ul>
              {toAdviceItems(section.content).map((item, index) => (
                <li key={`${section.title}-${index}`}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <button className="secondary report-toggle" onClick={() => setShowRaw((open) => !open)}>
        {showRaw ? "收起 AI 原文" : "查看 AI 原文"}
      </button>
      {showRaw && <pre className="full-report">{text}</pre>}
    </section>
  );
}

function ResumeRewriteCards({ items }: { items: ReturnType<typeof buildResumeRewritePlan> }) {
  if (!items.length) {
    return (
      <article className="result-card full-width-card">
        <h3>简历逐段改写</h3>
        <p>还没有粘贴简历内容。粘贴经历后，系统会按段指出问题、给出改写模板和缺失证据。</p>
      </article>
    );
  }
  return (
    <section className="rewrite-section">
      <div className="section-title-row">
        <h3>简历逐段改写</h3>
        <span>先补证据，再优化表达</span>
      </div>
      <div className="rewrite-grid">
        {items.map((item) => (
          <article key={item.id} className="rewrite-card">
            <span>原文</span>
            <p>{item.original}</p>
            <span>问题</span>
            <p>{item.problem}</p>
            <span>建议改写</span>
            <p>{item.rewrite}</p>
            <span>还缺什么证据</span>
            <p>{item.missingEvidence}</p>
            <button className="secondary compact-action" onClick={() => navigator.clipboard.writeText(item.rewrite)}>
              <Copy size={16} /> 复制改写模板
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ResumeVariantCards({ variants }: { variants: ReturnType<typeof buildResumeVariants> }) {
  const entries = [
    { key: "target", title: "目标岗位版简历", text: variants.target },
    { key: "bridge", title: "过渡岗位版简历", text: variants.bridge },
    { key: "explore", title: "方向探索版简历", text: variants.explore }
  ];
  return (
    <section className="rewrite-section">
      <div className="section-title-row">
        <h3>成品简历草稿</h3>
        <span>高适配用目标版，低适配优先用过渡版</span>
      </div>
      <div className="variant-grid">
        {entries.map((item) => (
          <article key={item.key} className="variant-card">
            <h3>{item.title}</h3>
            <pre>{item.text}</pre>
            <button className="secondary compact-action" onClick={() => navigator.clipboard.writeText(item.text)}>
              <Copy size={16} /> 复制这一版
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function StructuredJobseekerAnalysis({
  state,
  match,
  decisionPath,
  optimizedResume,
  knowledge,
  diagnosticInsights,
  actionPlan,
  sampleAudit
}: {
  state: AppState;
  match: ReturnType<typeof calculateMatch>;
  decisionPath: ReturnType<typeof buildDecisionPath>;
  optimizedResume: string;
  knowledge: ReturnType<typeof buildKnowledgeContext>;
  diagnosticInsights: ReturnType<typeof buildDiagnosticInsights>;
  actionPlan: ReturnType<typeof buildActionPlan>;
  sampleAudit: string[];
}) {
  const cityItems = knowledge.targetCity
    ? [
        `目标城市 ${state.targetJob.city}${state.targetJob.cityArea ? ` · ${state.targetJob.cityArea}` : ""} 的优势行业：${knowledge.targetCity.strongIndustries.join("、")}`,
        `更容易切入的岗位：${knowledge.targetCity.suitableRoles.join("、")}`,
        `适合人群：${knowledge.targetCity.fitFor.join("、")}`,
        `注意：${knowledge.targetCity.cautions.join("、")}`
      ]
    : ["目标城市暂未命中本地城市库，建议用 AI 继续判断城市机会。"];
  const capabilityPlan = buildCapabilityPlanItems(state, decisionPath, knowledge);
  const resumePlan = buildResumeExecutionItems(state, decisionPath, knowledge);
  const studentPlan = buildStudentPlanItems(state, decisionPath);

  return (
    <div className="analysis-cards">
      <article className="decision-card">
        <span>下一步路径</span>
        <strong>{decisionPath.title}</strong>
        <p>{decisionPath.verdict} 当前判断置信度：{match.confidence}。</p>
        <div className="decision-actions">
          <b>{decisionPath.primaryAction}</b>
          <small>{decisionPath.resumeStrategy}</small>
        </div>
        <div className="score-strip">
          {match.parts.map((part) => (
            <div key={part.label}>
              <small>{part.label}</small>
              <b>{part.score}</b>
            </div>
          ))}
        </div>
      </article>
      <CareerHealthReport state={state} match={match} decisionPath={decisionPath} insights={diagnosticInsights} />
      <LocalInsightCards insights={diagnosticInsights} />
      <ActionPlanCards actionPlan={actionPlan} />
      <ResultCard title="做这个岗位/方向的优势" items={decisionPath.advantages} />
      <ResultCard title="做这个岗位/方向的风险" items={decisionPath.risks.slice(0, 6)} />
      <ResultCard title="如果坚持做这个岗位，需要这样补" items={decisionPath.ifInsist} />
      <ResultCard title="如果换方向，更适合先投这些" items={decisionPath.alternatives} />
      {state.detailMode === "student" && (
        <>
          <ResultCard title="学生/应届优先方向" items={studentPlan.directRoles} />
          <ResultCard title="没有实习也能转成简历的证据" items={studentPlan.evidence} />
          <ResultCard title="先补作品后再冲的方向" items={studentPlan.portfolioRoles} />
          <ResultCard title="不建议现在硬冲的方向" items={studentPlan.riskyRoles} />
          <ResultCard title="学生城市策略" items={studentPlan.cityStrategy} />
          <ResultCard title="45 天补强路线" items={studentPlan.timeline} />
        </>
      )}
      <ResultCard
        title="先按你的诉求筛方向"
        items={[
          `目标明确度：${state.careerIntent.clarity}`,
          `最想解决：${formatChoiceText(state.careerIntent.mainGoal)}`,
          `期望/最低收入：${state.careerIntent.expectedIncome || state.profile.targetSalary || "未填写"}`,
          `不能接受：${formatChoiceText(state.careerIntent.bottomLine)}`,
          `优势：${formatChoiceText(state.careerIntent.strengths)}`,
          `求职卡点：${formatChoiceText(state.careerIntent.jobSearchObstacle)}`
        ]}
      />
      <ResultCard
        title="今天先做这 3 件事"
        items={decisionPath.nextSteps.slice(0, 3)}
      />
      <ResultCard title="简历应该优先改什么" items={decisionPath.resumeFocus} />
      <ResultCard title="要胜任这个岗位，先补这些" items={capabilityPlan} />
      <ResultCard title="简历优化执行表" items={resumePlan} />
      <ResultCard title="城市机会判断" items={cityItems} />
      <ResultCard
        title="城市/商圈线索"
        items={[
          `当前城市：${state.profile.city}${state.profile.cityArea ? ` · ${state.profile.cityArea}` : ""}`,
          `目标城市：${state.targetJob.city}${state.targetJob.cityArea ? ` · ${state.targetJob.cityArea}` : ""}`,
          knowledge.currentCity ? `当前城市适合岗位：${knowledge.currentCity.suitableRoles.slice(0, 4).join("、")}` : "当前城市暂未命中本地城市库，建议补充区域后再判断。",
          knowledge.targetCity ? `目标城市适合岗位：${knowledge.targetCity.suitableRoles.slice(0, 4).join("、")}` : "目标城市暂未命中本地城市库，建议补充具体区域/商圈。"
        ]}
      />
      <ResultCard title="内置样本人设校验" items={sampleAudit} />
      <ResultCard
        title="简历证据缺口"
        items={[
          `量化结果：${knowledge.evidence.quantifiedResults.join("、") || "未发现，建议补数字结果"}`,
          `项目证据：${knowledge.evidence.projectSignals.join("、") || "未发现，建议补完整项目/活动案例"}`,
          `缺失证据：${knowledge.evidence.missingEvidence.join("、") || "暂无明显缺失"}`
        ]}
      />
      <ResultCard
        title="简历先改这 4 处"
        items={[
          "标题写清楚目标岗位、年限、城市，不要只写姓名或求职意向。",
          "个人优势第一句直接贴目标岗位关键词。",
          "每段经历按结果、动作、工具、复盘顺序改写。",
          "没有证据的能力不要硬写，先用作品或案例补。"
        ]}
      />
      <ResultCard
        title="30 天行动计划"
        items={[...actionPlan.today.map((item) => `今天：${item}`), ...actionPlan.week.map((item) => `本周：${item}`), ...actionPlan.month.map((item) => `30天：${item}`)].slice(0, 9)}
      />
      <pre className="resume-card">{optimizedResume}</pre>
    </div>
  );
}

function CareerHealthReport({
  state,
  match,
  decisionPath,
  insights
}: {
  state: AppState;
  match: ReturnType<typeof calculateMatch>;
  decisionPath: ReturnType<typeof buildDecisionPath>;
  insights: ReturnType<typeof buildDiagnosticInsights>;
}) {
  const direct = insights.possibilities.find((item) => item.id === "target-fit")?.score ?? match.total;
  const proof = insights.possibilities.find((item) => item.id === "resume-proof")?.score ?? 0;
  const reality = insights.possibilities.find((item) => item.id === "style-reality")?.score ?? 0;
  const growth = insights.possibilities.find((item) => item.id === "growth-path")?.score ?? 0;
  const headline =
    match.total >= 78
      ? "可以进入投递优化"
      : match.total >= 60
        ? "建议先补证据再投"
        : "不建议只靠包装简历硬冲";
  const primaryRisk = decisionPath.risks[0] || insights.confidenceWarnings[0] || "当前没有明显硬冲风险，但仍需用真实 JD 验证。";
  const target = state.targetJob.role || decisionPath.alternatives[0] || "待明确方向";

  return (
    <section className="career-health-report">
      <div className="health-main">
        <span>职业健康报告</span>
        <strong>{headline}</strong>
        <p>围绕 {target} 综合岗位、简历、性格、真实情况、城市机会和补强可行性生成。分数只做参考，结论以原因和行动为准。</p>
      </div>
      <div className="health-metrics">
        <div><b>{direct}%</b><span>胜任/定向可能</span></div>
        <div><b>{proof}%</b><span>简历证据</span></div>
        <div><b>{reality}%</b><span>现实稳定性</span></div>
        <div><b>{growth}%</b><span>补强可行性</span></div>
      </div>
      <div className="health-alert">
        <ShieldCheck size={18} />
        <span>{primaryRisk}</span>
      </div>
    </section>
  );
}

function LocalInsightCards({ insights }: { insights: ReturnType<typeof buildDiagnosticInsights> }) {
  const [activeId, setActiveId] = useState(insights.possibilities[0]?.id || "");
  const items: PossibilityItem[] = insights.possibilities.map((item) => ({
    label: item.label,
    value: item.score,
    hint: item.summary,
    tone: item.tone as PossibilityTone,
    reasons: item.why,
    sources: item.influencedBy
  }));
  const active = items.find((item, index) => insights.possibilities[index]?.id === activeId) || items[0];

  if (!items.length) return null;
  return (
    <section className="local-insight-panel">
      <div className="section-title-row">
        <h3>本地诊断百分比</h3>
        <span>点击圆环查看“为什么是这个数”</span>
      </div>
      {insights.confidenceWarnings.length > 0 && (
        <div className="confidence-warning">
          {insights.confidenceWarnings.map((warning) => (
            <span key={warning}>{warning}</span>
          ))}
        </div>
      )}
      <div className="possibility-grid">
        {items.map((item, index) => {
          const id = insights.possibilities[index]?.id || item.label;
          return <PossibilityRing key={id} selected={activeId === id} onSelect={() => setActiveId(id)} {...item} />;
        })}
      </div>
      <PossibilityDetail item={active} />
    </section>
  );
}

function ActionPlanCards({ actionPlan }: { actionPlan: ReturnType<typeof buildActionPlan> }) {
  return (
    <section className="action-plan-grid">
      <ResultCard title="今天完成" items={actionPlan.today} />
      <ResultCard title="本周完成" items={actionPlan.week} />
      <ResultCard title="30 天路线" items={actionPlan.month} />
      <ResultCard title="停止硬冲规则" items={actionPlan.stopRules} />
    </section>
  );
}

function StructuredRecruiterAnalysis({
  analysis,
  candidateBatch
}: {
  analysis: ReturnType<typeof analyzeRecruiterJob>;
  candidateBatch: ReturnType<typeof analyzeCandidateBatch>;
}) {
  const topCandidates = candidateBatch.slice(0, 3);
  const screeningSummary = candidateBatch.length
    ? [
        `已识别 ${candidateBatch.length} 份候选人简历，按岗位硬性门槛、关键词、量化成果和风险项排序。`,
        `优先约面：${candidateBatch.filter((item) => item.decision === "优先约面").length} 人；建议初筛：${candidateBatch.filter((item) => item.decision === "建议初筛").length} 人。`,
        topCandidates.length ? `前三候选人：${topCandidates.map((item) => `${item.name} ${item.score}分`).join("、")}。` : "暂无候选人排序。",
        "使用方式：从平台复制已授权可查看的候选人简历文本，批量粘贴后先让系统排序，再人工复核。"
      ]
    : ["还没有粘贴候选人简历。公司端真正价值在批量初筛，而不是只优化 JD。"];
  return (
    <div className="analysis-cards">
      <ResultCard title="批量筛选概览" items={screeningSummary} />
      <ResultCard title="候选人必须具备" items={analysis.mustHave} />
      <ResultCard title="候选人加分项" items={analysis.niceToHave} />
      <ResultCard title="招聘风险" items={analysis.risks} />
      <ResultCard title="检索关键词" items={analysis.searchKeywords} />
      <ResultCard title="面试追问" items={analysis.interviewQuestions} />
      <CandidateBatchCards candidates={candidateBatch} />
      <RecruiterFunnel candidates={candidateBatch} />
      <ResultCard
        title="面试筛选建议"
        items={[
          "先看系统排序，但不要只按分数录用；分数用于节省初筛时间，最后仍要人工核验。",
          "让候选人按目标、动作、结果讲一个完整项目。",
          "追问数据来源、协作对象、遇到的问题和复盘结论。",
          "明确工作强度、薪资结构、试用期目标，避免入职后预期不一致。",
          "对高分候选人重点追问数字归属；对中分候选人电话确认硬门槛；低分候选人只保留特殊背景。"
        ]}
      />
      <pre className="resume-card">{analysis.improvedJd}</pre>
    </div>
  );
}

function RecruiterFunnel({ candidates }: { candidates: ReturnType<typeof analyzeCandidateBatch> }) {
  const priority = candidates.filter((item) => item.score >= 80).length;
  const screen = candidates.filter((item) => item.score >= 65 && item.score < 80).length;
  const watch = candidates.filter((item) => item.score >= 50 && item.score < 65).length;
  const reject = candidates.filter((item) => item.score < 50).length;
  const total = candidates.length || 1;

  if (!candidates.length) return null;
  return (
    <section className="recruiter-funnel full-width-card">
      <div className="section-title-row">
        <h3>候选人筛选漏斗</h3>
        <span>先压缩无效简历，再把面试时间留给高价值候选人</span>
      </div>
      <div className="funnel-bars">
        {[
          ["优先约面", priority, "good"],
          ["电话初筛", screen, "warn"],
          ["备选观察", watch, "neutral"],
          ["暂不推荐", reject, "risk"]
        ].map(([label, count, tone]) => (
          <div key={label} className={`funnel-row ${tone}`}>
            <span>{label}</span>
            <div><i style={{ width: `${Math.max(8, (Number(count) / total) * 100)}%` }} /></div>
            <b>{count} 人</b>
          </div>
        ))}
      </div>
      <p>当前排序只基于已粘贴文本，适合做第一轮筛选；录用前仍需人工核验经历真实性、薪资期望、到岗时间和岗位强度接受度。</p>
    </section>
  );
}

function CandidateBatchCards({ candidates }: { candidates: ReturnType<typeof analyzeCandidateBatch> }) {
  if (!candidates.length) {
    return (
      <article className="result-card full-width-card">
        <h3>批量简历筛选</h3>
        <p>还没有粘贴候选人简历。进入“批量筛简历”模块，把 BOSS 等平台已授权可查看的简历文本复制进来，多个候选人用 --- 分隔。</p>
      </article>
    );
  }
  return (
    <section className="candidate-screening full-width-card">
      <div className="section-title-row">
        <h3>批量简历筛选排序</h3>
        <span>按硬门槛、关键词、成果证据和风险项排序</span>
      </div>
      <div className="candidate-grid">
        {candidates.map((candidate) => (
          <article key={candidate.id} className="candidate-card">
            <div className="candidate-head">
              <div>
                <strong>{candidate.name}</strong>
                <span>{candidate.decision}</span>
              </div>
              <b>{candidate.score}</b>
            </div>
            <p>{candidate.summary}</p>
            <ResultMini title="匹配点" items={candidate.strengths} />
            <ResultMini title="风险点" items={candidate.risks} />
            <ResultMini title="建议追问" items={candidate.questions} />
          </article>
        ))}
      </div>
    </section>
  );
}

function ResultMini({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="result-mini">
      <span>{title}</span>
      <div className="result-card-scroll">
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, text }: { title: string; value: string; text: string }) {
  return (
    <article className="summary-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{text}</p>
    </article>
  );
}

function ResultCard({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="result-card">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function TextInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function AiErrorBox({
  message,
  openSettings,
  retry,
  backToLocal
}: {
  message: string;
  openSettings: () => void;
  retry: () => void;
  backToLocal: () => void;
}) {
  const hint = /model|模型|404|not found|does not exist|不存在/i.test(message)
    ? "模型名称可能不可用。你当前如果填的是 gpt-5.5，建议先点设置里的 OpenAI 预设，改成 gpt-4.1-mini 后测试连接。"
    : /401|unauthorized|权限|API Key|key/i.test(message)
      ? "API Key 可能无效、过期或没有该模型权限，请检查 Key 和服务商账号额度。"
      : /connect|timeout|网络|代理|DNS|host|超时/i.test(message)
        ? "网络或代理可能无法访问该服务商。可以先测试连接，或换 DeepSeek/通义兼容预设验证。"
        : "请先打开设置测试连接；本地分析仍可继续使用。";
  return (
    <div className="error-box">
      <strong>AI 请求失败</strong>
      <p>{message}</p>
      <small>{hint}</small>
      <div className="action-row">
        <button className="secondary" onClick={openSettings}>
          <Settings size={17} /> 打开设置
        </button>
        <button className="secondary" onClick={retry}>
          <Sparkles size={17} /> 重试 AI
        </button>
        <button className="secondary" onClick={backToLocal}>
          切回本地分析
        </button>
      </div>
    </div>
  );
}

function ConfirmModal({ title, body, onCancel, onConfirm }: { title: string; body: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-backdrop">
      <section className="confirm-modal">
        <button className="modal-close" onClick={onCancel} aria-label="关闭"><X size={18} /></button>
        <h2>{title}</h2>
        <p>{body}</p>
        <div>
          <button className="secondary" onClick={onCancel}>取消</button>
          <button className="primary" onClick={onConfirm}>确定</button>
        </div>
      </section>
    </div>
  );
}

function UpdateNoticeToast({
  entry,
  onClose,
  onOpenLog
}: {
  entry: ChangelogEntry;
  onClose: () => void;
  onOpenLog: () => void;
}) {
  return (
    <aside className="update-toast" role="status" aria-live="polite">
      <button className="modal-close" onClick={onClose} aria-label="关闭"><X size={18} /></button>
      <span>本次更新 · v{entry.version}</span>
      <h2>{entry.title}</h2>
      <p>{entry.highlights[0]}</p>
      <div className="update-toast-actions">
        <button className="secondary" onClick={onOpenLog}>查看日志</button>
        <button className="primary" onClick={onClose}>知道了</button>
      </div>
    </aside>
  );
}

export default App;
