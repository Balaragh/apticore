// ─── User & Auth ──────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  createdAt: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  emailNotifications: boolean;
  practiceReminders: boolean;
  weeklyReport: boolean;
  theme: 'light' | 'dark' | 'system';
  profileVisibility: 'public' | 'private';
  targetRole?: string;
  preferredInterviewType?: InterviewType;
  dailyGoal?: number;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ─── Interview ───────────────────────────────
export type InterviewType = 'technical' | 'behavioral' | 'system-design' | 'mixed' | 'hr';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type PracticeMode = 'video' | 'mock' | 'question' | 'live';
export type InterviewUserRole = 'interviewer' | 'candidate';
export type InterviewStage = 'intro' | 'technical' | 'coding' | 'system-design' | 'behavioral' | 'qa' | 'wrap-up';
export type MeetingStatus = 'scheduled' | 'waiting' | 'in-progress' | 'completed' | 'cancelled';

export interface ScheduledInterview {
  id: string;
  title: string;
  role: string;
  type: InterviewType;
  scheduledFor: string;
  durationMinutes: number;
  status: MeetingStatus;
  interviewerName: string;
  interviewerEmail: string;
  interviewerCompany?: string;
  candidateName: string;
  candidateEmail: string;
  roomCode: string;
  createdAt: string;
  meetingNotes?: string;
  assessmentId?: string;
}

export interface LiveParticipant {
  id: string;
  name: string;
  role: InterviewUserRole;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isAdmitted: boolean;
  joinedAt: string;
  connectionQuality: 'good' | 'fair' | 'poor' | 'connecting';
}

export interface LiveChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: InterviewUserRole;
  text: string;
  timestamp: string;
}

export interface LiveInterviewEvaluation {
  id: string;
  sessionId: string;
  roomCode: string;
  candidateName: string;
  role: string;
  interviewType: InterviewType;
  interviewerName: string;
  submittedAt: string;
  technicalScore: number; // 1-5
  problemSolvingScore: number; // 1-5
  communicationScore: number; // 1-5
  overallRating: number; // 1-5
  recommendation: 'strong-hire' | 'hire' | 'weak-hire' | 'no-hire';
  strengths: string[];
  improvements: string[];
  publicFeedback: string;
  confidentialNotes: string;
  isSubmitted: boolean;
}

export interface InterviewConfig {
  role: string;
  technologies: string[];
  difficulty: Difficulty;
  type: InterviewType;
  questionCount: number;
  timePerQuestion: number; // seconds
  mode?: PracticeMode;
  durationMinutes?: number;
  interviewerId?: string;
}

export interface InterviewQuestion {
  id: string;
  text: string;
  type: InterviewType;
  difficulty: Difficulty;
  topic: string;
  role?: string;
  hints?: string[];
  expectedPoints?: string[];
  sampleStarGuide?: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
}

export interface InterviewAnswer {
  questionId: string;
  answer: string;
  timeSpent: number; // seconds
  savedAt: string;
  notes?: string;
  starBreakdown?: STARAnswer;
}

export interface InterviewSession {
  id: string;
  config: InterviewConfig;
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
  status: 'in-progress' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt?: string;
  selfReview?: SelfReview;
}

// ─── STAR Answer Coach ───────────────────────
export interface STARAnswer {
  situation: string;
  task: string;
  action: string;
  result: string;
  reflection?: string;
}

// ─── Self Review ─────────────────────────────
export interface SelfReview {
  sessionId: string;
  confidence: number; // 1-5
  clarity: number; // 1-5
  difficulty: number; // 1-5
  keyTakeaway: string;
  areasToImprove: string;
  savedAt: string;
}

// ─── Preparation Checklist ───────────────────
export interface InterviewChecklistItem {
  id: string;
  title: string;
  category: 'devices' | 'environment' | 'materials' | 'mindset';
  description: string;
  checked: boolean;
}

// ─── Daily Practice Goal ─────────────────────
export interface DailyPracticeGoal {
  targetQuestions: number;
  targetMinutes: number;
  completedQuestionsToday: number;
  completedMinutesToday: number;
  streakDays: number;
  lastUpdated: string;
}

// ─── Onboarding ──────────────────────────────
export interface UserOnboardingProfile {
  targetRole: string;
  preferredInterviewType: InterviewType;
  dailyQuestionGoal: number;
  completedOnboarding: boolean;
}

// ─── Feedback ────────────────────────────────
export interface InterviewFeedback {
  sessionId: string;
  overallScore: number;
  technicalAccuracy: number;
  relevance: number;
  communication: number;
  completeness: number;
  strengths: string[];
  improvements: string[];
  questionFeedback: QuestionFeedback[];
  recommendations: string[];
}

export interface QuestionFeedback {
  questionId: string;
  score: number;
  feedback: string;
  keyPointsCovered: string[];
  missedPoints: string[];
}

// ─── Resume ──────────────────────────────────
export interface ResumeAnalysis {
  id: string;
  fileName: string;
  uploadedAt: string;
  overallScore: number;
  skills: SkillCard[];
  targetRole: string;
  gaps: SkillGap[];
  suggestions: string[];
}

export interface SkillCard {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  source: 'resume' | 'inferred';
}

export interface SkillGap {
  skill: string;
  importance: 'critical' | 'recommended' | 'nice-to-have';
  description: string;
}

// ─── Question Bank ───────────────────────────
export interface BankQuestion {
  id: string;
  text: string;
  type: InterviewType;
  difficulty: Difficulty;
  topic: string;
  role?: string;
  tags: string[];
  practiceCount: number;
  lastPracticed?: string;
  isSaved: boolean;
  userNotes?: string;
}

// ─── Learning Roadmap ────────────────────────
export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'locked' | 'available';
  category: string;
  estimatedHours: number;
  resources: RoadmapResource[];
}

export interface RoadmapResource {
  title: string;
  type: 'article' | 'video' | 'exercise' | 'project';
  url: string;
}

// ─── Analytics ───────────────────────────────
export interface PerformanceData {
  weeklyPractice: { day: string; sessions: number; score: number }[];
  topicScores: { topic: string; score: number; sessions: number }[];
  overallProgress: { month: string; score: number }[];
  totalSessions: number;
  avgScore: number;
  totalHours: number;
  streak: number;
}

// ─── Dashboard ───────────────────────────────
export interface DashboardStats {
  totalInterviews: number;
  avgScore: number;
  practiceStreak: number;
  questionsAnswered: number;
  improvementRate: number;
}

export interface RecentSession {
  id: string;
  role: string;
  type: InterviewType;
  score: number;
  date: string;
  questionCount: number;
}

export interface RecommendedTopic {
  topic: string;
  reason: string;
  difficulty: Difficulty;
  questionCount: number;
}

// ─── Notifications ───────────────────────────
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  createdAt: string;
}
