import { apiClient } from '@/lib/api-client';

export type AptitudeDomain =
  | 'Quantitative Aptitude'
  | 'Logical Reasoning'
  | 'Verbal Ability'
  | 'Data Interpretation'
  | 'Programming Fundamentals'
  | 'Technical MCQs';

export type AptitudeDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'All';

export interface DomainSummaryItem {
  domain: AptitudeDomain;
  currentStreak: number;
  storedStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
  dailyGoal: number;
  todayQuestionsCompleted: number;
  isCompletedToday: boolean;
  isStreakAtRisk: boolean;
  totalAvailable: number;
  totalAnswered: number;
  remainingQuestions: number;
  accuracy: number;
  practiceDates: string[];
}

export interface AptitudeDashboardResponse {
  today: string;
  timezone: string;
  overall: {
    totalAnswered: number;
    totalAvailable: number;
    todayQuestionsCompleted: number;
    overallDailyGoal: number;
    maxActiveStreak: number;
    maxLongestStreak: number;
    practiceDates: string[];
  };
  domains: DomainSummaryItem[];
}

export interface PracticeQuestionItem {
  id: string;
  canonicalId: string;
  domain: AptitudeDomain;
  topic: string;
  difficulty: string;
  question: string;
  options: string[];
}

export interface FetchQuestionsResponse {
  domain: AptitudeDomain;
  difficulty: string;
  questions: PracticeQuestionItem[];
  totalRemainingInDomain: number;
  exhausted: boolean;
  message?: string;
}

export interface SubmitAnswerPayload {
  questionId: string;
  selectedOption: number;
  timeSpentSeconds?: number;
}

export interface QuestionEvaluationResult {
  questionId: string;
  canonicalId: string;
  question: string;
  options: string[];
  selectedOption: number;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
  topic: string;
  difficulty: string;
}

export interface SubmitPracticeResponse {
  domain: AptitudeDomain;
  totalAnswered: number;
  correctCount: number;
  percentage: number;
  dailyGoalAchieved: boolean;
  streak: {
    currentStreak: number;
    longestStreak: number;
    todayQuestionsCompleted: number;
    dailyGoal: number;
    lastPracticeDate: string | null;
    isStreakExtendedToday: boolean;
  };
  results: QuestionEvaluationResult[];
}

export const aptitudeApi = {
  /**
   * Fetch complete dashboard with domain streaks, overall progress, and calendar history
   */
  async getDashboard(timezone?: string): Promise<AptitudeDashboardResponse> {
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    return apiClient.get<AptitudeDashboardResponse>(`/aptitude/dashboard?timezone=${encodeURIComponent(tz)}`);
  },

  /**
   * Fetch domain summary cards
   */
  async getDomains(timezone?: string): Promise<{ today: string; timezone: string; domains: DomainSummaryItem[] }> {
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    return apiClient.get(`/aptitude/domains?timezone=${encodeURIComponent(tz)}`);
  },

  /**
   * Fetch un-answered questions strictly excluding any answered questions for this user & domain
   */
  async getQuestions(params: {
    domain: AptitudeDomain;
    difficulty?: string;
    count?: number;
  }): Promise<FetchQuestionsResponse> {
    const query = new URLSearchParams({
      domain: params.domain,
      difficulty: params.difficulty || 'All',
      count: String(params.count || 5),
    });
    return apiClient.get<FetchQuestionsResponse>(`/aptitude/questions?${query.toString()}`);
  },

  /**
   * Submit practice session answers and advance streak
   */
  async submitPractice(payload: {
    domain: AptitudeDomain;
    answers: SubmitAnswerPayload[];
    timezone?: string;
  }): Promise<SubmitPracticeResponse> {
    const tz = payload.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    return apiClient.post<SubmitPracticeResponse>('/aptitude/submit', {
      ...payload,
      timezone: tz,
    });
  },

  /**
   * Reset user's answered history for a specific domain
   */
  async resetDomain(domain: AptitudeDomain): Promise<{ deletedAttempts: number; domain: string }> {
    return apiClient.post('/aptitude/reset-domain', { domain });
  },
};
