import { Types } from 'mongoose';
import {
  AptitudeQuestion,
  IAptitudeQuestion,
  AptitudeDomain,
  AptitudeDifficulty,
} from '../models/AptitudeQuestion';
import { AptitudeAttempt } from '../models/AptitudeAttempt';
import { DomainStreak, IDomainStreak } from '../models/DomainStreak';
import { VERIFIED_APTITUDE_SEED_BANK } from './aptitude-bank.data';

export const ALL_APTITUDE_DOMAINS: AptitudeDomain[] = [
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Verbal Ability',
  'Data Interpretation',
  'Programming Fundamentals',
  'Technical MCQs',
];

export interface QuestionSubmissionItem {
  questionId: string;
  selectedOption: number;
  timeSpentSeconds?: number;
}

export interface PracticeSessionResult {
  domain: string;
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
  results: Array<{
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
  }>;
}

export class AptitudeService {
  /**
   * Helper: Get YYYY-MM-DD for a Date in a specific timezone
   */
  public static getDateInTimezone(
    date: Date = new Date(),
    timezone: string = 'Asia/Kolkata'
  ): string {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(date); // e.g. "2026-10-18"
    } catch {
      return date.toISOString().split('T')[0];
    }
  }

  /**
   * Helper: Get previous calendar day YYYY-MM-DD from given date string
   */
  public static getYesterdayDateString(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() - 1);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dt = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${dt}`;
  }

  /**
   * Ensures verified question bank is seeded in MongoDB
   */
  public static async seedVerifiedQuestions(): Promise<number> {
    const count = await AptitudeQuestion.countDocuments();
    if (count >= VERIFIED_APTITUDE_SEED_BANK.length) {
      return count;
    }

    const operations = VERIFIED_APTITUDE_SEED_BANK.map((item) => ({
      updateOne: {
        filter: { canonicalId: item.canonicalId },
        update: {
          $setOnInsert: {
            canonicalId: item.canonicalId,
            domain: item.domain,
            topic: item.topic,
            difficulty: item.difficulty,
            question: item.question,
            options: item.options,
            correctIndex: item.correctIndex,
            explanation: item.explanation,
            verified: true,
            source: 'curated' as const,
          },
        },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      await AptitudeQuestion.bulkWrite(operations as any, { ordered: false });
    }

    return await AptitudeQuestion.countDocuments();
  }

  /**
   * Retrieve domain summary cards and streak tracking for user
   */
  public static async getDomainSummary(
    userId: Types.ObjectId,
    timezone: string = 'Asia/Kolkata'
  ) {
    await this.seedVerifiedQuestions();
    const today = this.getDateInTimezone(new Date(), timezone);
    const yesterday = this.getYesterdayDateString(today);

    // Fetch all domain streaks for user
    const streaks = await DomainStreak.find({ userId });
    const streakMap = new Map<string, IDomainStreak>();
    streaks.forEach((s) => streakMap.set(s.domain, s));

    // Also count total verified questions available per domain
    const domainCounts = await AptitudeQuestion.aggregate([
      { $group: { _id: '$domain', total: { $sum: 1 } } },
    ]);
    const totalMap = new Map<string, number>();
    domainCounts.forEach((d) => totalMap.set(d._id, d.total));

    // Also count answered questions per domain for this user
    const answeredCounts = await AptitudeAttempt.aggregate([
      { $match: { userId } },
      { $group: { _id: '$domain', answered: { $sum: 1 } } },
    ]);
    const userAnsMap = new Map<string, number>();
    answeredCounts.forEach((a) => userAnsMap.set(a._id, a.answered));

    const domainSummaries = ALL_APTITUDE_DOMAINS.map((domain) => {
      const streakDoc = streakMap.get(domain);
      const totalAvailable = totalMap.get(domain) || 0;
      const totalAnswered = userAnsMap.get(domain) || 0;
      const remainingQuestions = Math.max(0, totalAvailable - totalAnswered);

      // Streak status check
      let currentStreak = streakDoc?.currentStreak || 0;
      const longestStreak = streakDoc?.longestStreak || 0;
      const lastPracticeDate = streakDoc?.lastPracticeDate || null;
      const dailyGoal = streakDoc?.dailyGoal || 5;
      const todayQuestions = streakDoc?.todayQuestionsCompleted || 0;
      const isCompletedToday = lastPracticeDate === today && todayQuestions >= dailyGoal;

      // If user missed yesterday and didn't practice today, active streak for display is 0
      // but will officially reset to 1 on next practice
      const isStreakAtRisk = lastPracticeDate !== null && lastPracticeDate < yesterday;

      const accuracy =
        streakDoc && streakDoc.totalQuestionsCompleted > 0
          ? Math.round((streakDoc.totalCorrectAnswers / streakDoc.totalQuestionsCompleted) * 100)
          : 0;

      return {
        domain,
        currentStreak: isStreakAtRisk && !isCompletedToday ? 0 : currentStreak,
        storedStreak: currentStreak,
        longestStreak,
        lastPracticeDate,
        dailyGoal,
        todayQuestionsCompleted: todayQuestions,
        isCompletedToday,
        isStreakAtRisk,
        totalAvailable,
        totalAnswered,
        remainingQuestions,
        accuracy,
        practiceDates: streakDoc?.practiceDates || [],
      };
    });

    return {
      today,
      timezone,
      domains: domainSummaries,
    };
  }

  /**
   * Get un-answered questions for a specific domain, difficulty, and count
   * Strictly excludes any question already answered by the user
   */
  public static async getQuestionsForPractice(params: {
    userId: Types.ObjectId;
    domain: AptitudeDomain;
    difficulty?: string;
    count?: number;
  }): Promise<{
    domain: AptitudeDomain;
    difficulty: string;
    questions: Array<{
      id: string;
      canonicalId: string;
      domain: string;
      topic: string;
      difficulty: string;
      question: string;
      options: string[];
    }>;
    totalRemainingInDomain: number;
    exhausted: boolean;
    message?: string;
  }> {
    await this.seedVerifiedQuestions();

    const { userId, domain } = params;
    const count = Math.min(Math.max(params.count || 5, 1), 30);
    const difficulty = params.difficulty || 'All';

    // 1. Fetch all questionIds answered by this user in this domain
    const answeredAttempts = await AptitudeAttempt.find(
      { userId, domain },
      { questionId: 1, _id: 0 }
    ).lean();
    const answeredQuestionIds = answeredAttempts.map((a) => a.questionId);

    // 2. Query question bank excluding all previously answered questions
    const baseFilter: any = {
      domain,
      _id: { $nin: answeredQuestionIds },
    };

    let questionsQuery = { ...baseFilter };
    if (difficulty !== 'All') {
      questionsQuery.difficulty = difficulty;
    }

    let candidates = await AptitudeQuestion.find(questionsQuery).lean();

    // If requested difficulty has fewer questions than requested count, fallback to all difficulties in domain
    if (candidates.length < count && difficulty !== 'All') {
      const fallbackCandidates = await AptitudeQuestion.find(baseFilter).lean();
      candidates = fallbackCandidates;
    }

    // 3. Count total remaining in domain
    const totalRemaining = await AptitudeQuestion.countDocuments(baseFilter);

    // 4. If exhausted, return empty with exhausted flag
    if (candidates.length === 0) {
      const totalAnswered = answeredQuestionIds.length;
      return {
        domain,
        difficulty,
        questions: [],
        totalRemainingInDomain: 0,
        exhausted: true,
        message: `Outstanding! You have answered all ${totalAnswered} questions currently in ${domain}. Check back soon or reset history to practice again.`,
      };
    }

    // 5. Shuffle candidates randomly and take `count`
    const shuffled = [...candidates].sort(() => 0.5 - Math.random()).slice(0, count);

    // 6. Project questions without revealing correct answer or explanation
    const safeQuestions = shuffled.map((q) => ({
      id: q._id.toString(),
      canonicalId: q.canonicalId,
      domain: q.domain,
      topic: q.topic,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options,
    }));

    return {
      domain,
      difficulty,
      questions: safeQuestions,
      totalRemainingInDomain: totalRemaining,
      exhausted: false,
    };
  }

  /**
   * Submit practice session answers:
   * - Records attempts in AptitudeAttempt (marking questions as permanently answered)
   * - Calculates score and provides explanations
   * - Calculates domain-specific daily streak strictly in user's timezone
   */
  public static async submitPracticeSession(params: {
    userId: Types.ObjectId;
    domain: AptitudeDomain;
    answers: QuestionSubmissionItem[];
    timezone?: string;
  }): Promise<PracticeSessionResult> {
    const { userId, domain, answers } = params;
    const timezone = params.timezone || 'Asia/Kolkata';
    const today = this.getDateInTimezone(new Date(), timezone);
    const yesterday = this.getYesterdayDateString(today);

    if (!Array.isArray(answers) || answers.length === 0) {
      throw new Error('At least one question answer must be provided.');
    }

    // 1. Fetch matching AptitudeQuestions from DB
    const questionIds = answers
      .map((a) => (Types.ObjectId.isValid(a.questionId) ? new Types.ObjectId(a.questionId) : null))
      .filter(Boolean) as Types.ObjectId[];

    const questionDocs = await AptitudeQuestion.find({
      _id: { $in: questionIds },
      domain,
    });
    const questionMap = new Map<string, IAptitudeQuestion>();
    questionDocs.forEach((q) => questionMap.set(q._id.toString(), q));

    // 2. Evaluate answers and persist each attempt
    const results: PracticeSessionResult['results'] = [];
    let batchCorrectCount = 0;

    for (const ans of answers) {
      const q = questionMap.get(ans.questionId);
      if (!q) continue;

      const isCorrect = ans.selectedOption === q.correctIndex;
      if (isCorrect) batchCorrectCount++;

      // Upsert attempt to ensure question is permanently recorded as answered for this user
      await AptitudeAttempt.findOneAndUpdate(
        { userId, questionId: q._id },
        {
          $setOnInsert: {
            userId,
            questionId: q._id,
            canonicalId: q.canonicalId,
            domain: q.domain,
            selectedOption: ans.selectedOption,
            isCorrect,
            timeSpentSeconds: ans.timeSpentSeconds || 0,
            practiceDate: today,
          },
        },
        { upsert: true, new: true }
      );

      results.push({
        questionId: q._id.toString(),
        canonicalId: q.canonicalId,
        question: q.question,
        options: q.options,
        selectedOption: ans.selectedOption,
        correctIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation,
        topic: q.topic,
        difficulty: q.difficulty,
      });
    }

    // 3. Count today's total answers for this user in this domain
    const todayAttemptsCount = await AptitudeAttempt.countDocuments({
      userId,
      domain,
      practiceDate: today,
    });
    const todayCorrectCount = await AptitudeAttempt.countDocuments({
      userId,
      domain,
      practiceDate: today,
      isCorrect: true,
    });

    // 4. Update DomainStreak record for this domain
    let streakDoc = await DomainStreak.findOne({ userId, domain });
    if (!streakDoc) {
      streakDoc = new DomainStreak({
        userId,
        domain,
        currentStreak: 0,
        longestStreak: 0,
        lastPracticeDate: null,
        dailyGoal: 5,
        todayQuestionsCompleted: 0,
        todayCorrectAnswers: 0,
        totalQuestionsCompleted: 0,
        totalCorrectAnswers: 0,
        practiceDates: [],
        timezone,
      });
    }

    const previousLastDate = streakDoc.lastPracticeDate;
    let isStreakExtendedToday = false;

    // Check if daily goal is achieved with this practice
    const isGoalAchieved = todayAttemptsCount >= streakDoc.dailyGoal;

    if (isGoalAchieved) {
      if (previousLastDate === today) {
        // Already extended streak today! Idempotent rule: multiple sessions on same day count once
        isStreakExtendedToday = false;
      } else if (previousLastDate === yesterday) {
        // Practiced yesterday, continuing consecutive streak!
        streakDoc.currentStreak += 1;
        if (streakDoc.currentStreak > streakDoc.longestStreak) {
          streakDoc.longestStreak = streakDoc.currentStreak;
        }
        streakDoc.lastPracticeDate = today;
        if (!streakDoc.practiceDates.includes(today)) {
          streakDoc.practiceDates.push(today);
        }
        isStreakExtendedToday = true;
      } else {
        // Missed a day or first time practicing this domain: reset streak to 1
        streakDoc.currentStreak = 1;
        if (streakDoc.longestStreak === 0) {
          streakDoc.longestStreak = 1;
        }
        streakDoc.lastPracticeDate = today;
        if (!streakDoc.practiceDates.includes(today)) {
          streakDoc.practiceDates.push(today);
        }
        isStreakExtendedToday = true;
      }
    }

    // Update cumulative totals
    streakDoc.todayQuestionsCompleted = todayAttemptsCount;
    streakDoc.todayCorrectAnswers = todayCorrectCount;
    streakDoc.totalQuestionsCompleted = await AptitudeAttempt.countDocuments({ userId, domain });
    streakDoc.totalCorrectAnswers = await AptitudeAttempt.countDocuments({
      userId,
      domain,
      isCorrect: true,
    });
    streakDoc.timezone = timezone;

    await streakDoc.save();

    const percentage = results.length > 0 ? Math.round((batchCorrectCount / results.length) * 100) : 0;

    return {
      domain,
      totalAnswered: results.length,
      correctCount: batchCorrectCount,
      percentage,
      dailyGoalAchieved: isGoalAchieved,
      streak: {
        currentStreak: streakDoc.currentStreak,
        longestStreak: streakDoc.longestStreak,
        todayQuestionsCompleted: streakDoc.todayQuestionsCompleted,
        dailyGoal: streakDoc.dailyGoal,
        lastPracticeDate: streakDoc.lastPracticeDate,
        isStreakExtendedToday,
      },
      results,
    };
  }

  /**
   * Reset user's answered question history for a domain
   * (Allows candidate to re-practice exhausted question sets)
   */
  public static async resetDomainHistory(userId: Types.ObjectId, domain: AptitudeDomain) {
    const deleteResult = await AptitudeAttempt.deleteMany({ userId, domain });
    // Reset today's progress counters but preserve streaks and longest streak
    await DomainStreak.findOneAndUpdate(
      { userId, domain },
      {
        $set: {
          todayQuestionsCompleted: 0,
          todayCorrectAnswers: 0,
          totalQuestionsCompleted: 0,
          totalCorrectAnswers: 0,
        },
      }
    );

    return {
      deletedAttempts: deleteResult.deletedCount,
      domain,
    };
  }

  /**
   * Comprehensive Aptitude Dashboard Payload
   */
  public static async getAptitudeDashboard(
    userId: Types.ObjectId,
    timezone: string = 'Asia/Kolkata'
  ) {
    const summary = await this.getDomainSummary(userId, timezone);
    const today = summary.today;

    // Aggregate overall statistics
    const totalAnsweredOverall = summary.domains.reduce((acc, d) => acc + d.totalAnswered, 0);
    const totalAvailableOverall = summary.domains.reduce((acc, d) => acc + d.totalAvailable, 0);
    const todayQuestionsOverall = summary.domains.reduce(
      (acc, d) => acc + d.todayQuestionsCompleted,
      0
    );
    const overallDailyGoal = summary.domains.reduce((acc, d) => acc + d.dailyGoal, 0);

    // Collect all unique practice dates across domains for calendar heatmap
    const allPracticeDates = Array.from(
      new Set(summary.domains.flatMap((d) => d.practiceDates))
    ).sort();

    // Calculate maximum active streak across domains
    const maxActiveStreak = Math.max(0, ...summary.domains.map((d) => d.currentStreak));
    const maxLongestStreak = Math.max(0, ...summary.domains.map((d) => d.longestStreak));

    return {
      today,
      timezone,
      overall: {
        totalAnswered: totalAnsweredOverall,
        totalAvailable: totalAvailableOverall,
        todayQuestionsCompleted: todayQuestionsOverall,
        overallDailyGoal,
        maxActiveStreak,
        maxLongestStreak,
        practiceDates: allPracticeDates,
      },
      domains: summary.domains,
    };
  }
}
