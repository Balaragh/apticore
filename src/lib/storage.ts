/**
 * Safe client-side storage for non-sensitive interview training preferences,
 * checklist states, daily goals, answer notes, and self-reviews.
 *
 * NOTE: Strict adherence to security guidelines:
 * NO passwords, authentication tokens, or session identifiers are stored here.
 */

import type {
  DailyPracticeGoal,
  InterviewChecklistItem,
  SelfReview,
  UserOnboardingProfile,
} from '@/types';

const STORAGE_KEYS = {
  DAILY_GOAL: 'apticore_daily_goal',
  CHECKLIST: 'apticore_prep_checklist',
  SELF_REVIEWS: 'apticore_self_reviews',
  SAVED_NOTES: 'apticore_answer_notes',
  BOOKMARKS: 'apticore_bookmarked_questions',
  ONBOARDING: 'apticore_onboarding_profile',
} as const;

// Default Daily Goal
export const DEFAULT_DAILY_GOAL: DailyPracticeGoal = {
  targetQuestions: 3,
  targetMinutes: 20,
  completedQuestionsToday: 1,
  completedMinutesToday: 8,
  streakDays: 5,
  lastUpdated: new Date().toISOString().split('T')[0],
};

// Default Checklist
export const DEFAULT_CHECKLIST: InterviewChecklistItem[] = [
  {
    id: 'c1',
    title: 'Camera & Lighting',
    category: 'devices',
    description: 'Ensure camera is positioned at eye level with balanced front-facing lighting.',
    checked: true,
  },
  {
    id: 'c2',
    title: 'Microphone & Audio Check',
    category: 'devices',
    description: 'Verify input volume and use headphones to avoid echo feedback.',
    checked: true,
  },
  {
    id: 'c3',
    title: 'Quiet & Distraction-Free Space',
    category: 'environment',
    description: 'Silence phone notifications and notify housemates of interview session.',
    checked: true,
  },
  {
    id: 'c4',
    title: 'Internet Stability Check',
    category: 'environment',
    description: 'Close heavy background downloads and bandwidth-hungry video streams.',
    checked: false,
  },
  {
    id: 'c5',
    title: 'Resume & Target Job Description',
    category: 'materials',
    description: 'Have a copy of your resume and key project bullet points nearby for reference.',
    checked: true,
  },
  {
    id: 'c6',
    title: 'Notepad & Pen / Digital Scratchpad',
    category: 'materials',
    description: 'Prepare a notepad for taking notes during complex system design or technical scenarios.',
    checked: false,
  },
  {
    id: 'c7',
    title: 'Glass of Water',
    category: 'mindset',
    description: 'Keep hydration at arm’s reach to pause and reset during longer answers.',
    checked: true,
  },
  {
    id: 'c8',
    title: 'STAR Story Anchors Ready',
    category: 'mindset',
    description: 'Recall 3 key projects with clear Situation, Task, Action, and Measurable Results.',
    checked: true,
  },
];

// Helper to get from storage safely
function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Storage save failed:', err);
  }
}

// ── Daily Goal
export function getDailyGoal(): DailyPracticeGoal {
  const goal = getStored<DailyPracticeGoal>(STORAGE_KEYS.DAILY_GOAL, DEFAULT_DAILY_GOAL);
  const today = new Date().toISOString().split('T')[0];
  if (goal.lastUpdated !== today) {
    // Reset daily counters for a new day while preserving target & streak
    return {
      ...goal,
      completedQuestionsToday: 0,
      completedMinutesToday: 0,
      lastUpdated: today,
    };
  }
  return goal;
}

export function saveDailyGoal(goal: DailyPracticeGoal): void {
  setStored(STORAGE_KEYS.DAILY_GOAL, goal);
}

export function recordPracticeProgress(questionsCompleted: number, minutesSpent: number): DailyPracticeGoal {
  const current = getDailyGoal();
  const updated: DailyPracticeGoal = {
    ...current,
    completedQuestionsToday: current.completedQuestionsToday + questionsCompleted,
    completedMinutesToday: current.completedMinutesToday + minutesSpent,
  };
  saveDailyGoal(updated);
  return updated;
}

// ── Prep Checklist
export function getPrepChecklist(): InterviewChecklistItem[] {
  return getStored<InterviewChecklistItem[]>(STORAGE_KEYS.CHECKLIST, DEFAULT_CHECKLIST);
}

export function toggleChecklistItem(id: string): InterviewChecklistItem[] {
  const list = getPrepChecklist();
  const updated = list.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item));
  setStored(STORAGE_KEYS.CHECKLIST, updated);
  return updated;
}

export function resetPrepChecklist(): InterviewChecklistItem[] {
  setStored(STORAGE_KEYS.CHECKLIST, DEFAULT_CHECKLIST);
  return DEFAULT_CHECKLIST;
}

// ── Self Reviews
export function getSelfReviews(): Record<string, SelfReview> {
  return getStored<Record<string, SelfReview>>(STORAGE_KEYS.SELF_REVIEWS, {});
}

export function saveSelfReview(review: SelfReview): void {
  const all = getSelfReviews();
  all[review.sessionId] = review;
  setStored(STORAGE_KEYS.SELF_REVIEWS, all);
}

// ── Answer Notes
export function getSavedNotes(): Record<string, string> {
  return getStored<Record<string, string>>(STORAGE_KEYS.SAVED_NOTES, {});
}

export function saveAnswerNote(questionId: string, note: string): void {
  const notes = getSavedNotes();
  notes[questionId] = note;
  setStored(STORAGE_KEYS.SAVED_NOTES, notes);
}

// ── Bookmarked Questions
export function getBookmarkedQuestionIds(): string[] {
  return getStored<string[]>(STORAGE_KEYS.BOOKMARKS, ['bq1', 'bq2', 'bq6', 'bq8', 'bq12']);
}

export function toggleBookmarkQuestion(questionId: string): string[] {
  const current = getBookmarkedQuestionIds();
  const exists = current.includes(questionId);
  const updated = exists ? current.filter((id) => id !== questionId) : [...current, questionId];
  setStored(STORAGE_KEYS.BOOKMARKS, updated);
  return updated;
}

// ── Onboarding Profile
export function getOnboardingProfile(): UserOnboardingProfile {
  return getStored<UserOnboardingProfile>(STORAGE_KEYS.ONBOARDING, {
    targetRole: 'Frontend Developer',
    preferredInterviewType: 'technical',
    dailyQuestionGoal: 3,
    completedOnboarding: true,
  });
}

export function saveOnboardingProfile(profile: UserOnboardingProfile): void {
  setStored(STORAGE_KEYS.ONBOARDING, profile);
}
