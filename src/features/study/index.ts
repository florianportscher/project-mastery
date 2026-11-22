// Public API of the study feature for any code: the AI's instructions in a
// Chat and its tutor context as text, and the views of what study owns (the
// Memory card and the study plan), which pages pass into the Brief's panel
// and the map as slots. Server-only exports live in `server.ts`.
export { renderTutorContext } from "./ai/context";
export { CloseCard } from "./components/close-card";
export { EndSessionButton } from "./components/end-session-button";
export { ExamResultCard } from "./components/exam-result-card";
export { MemoryCard } from "./components/memory-card";
export { ProgressLine } from "./components/progress-line";
export { ReadinessLine } from "./components/readiness-line";
export { MockExamStatus } from "./components/mock-exam-status";
export { MockTaskSheet } from "./components/mock-task-sheet";
export { mockExamPath } from "./domain/mock-paths";
export { ProblemFlagControl } from "./components/problem-flag-control";
export { TopicChoiceControls } from "./components/topic-choice-controls";
export { TodayCard } from "./components/today-card";
export { topicBadges } from "./domain/plan";
export {
  isTodayMessage,
  MOCK_REVIEW_MESSAGE,
  QUICK_REPLIES,
  sessionLength,
} from "./domain/today-messages";
export { sessionEndedMessage } from "./schemas";
export type {
  AskedProblem,
  GradedKc,
  ProblemFlag,
  ProblemView,
  TopicView,
  TutorContext,
} from "./types";
