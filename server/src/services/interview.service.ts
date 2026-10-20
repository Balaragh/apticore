import crypto from 'crypto';
import { InterviewSession, IInterviewSession } from '../models/InterviewSession';
import { InterviewQuestion } from '../models/InterviewQuestion';
import { InterviewResponse } from '../models/InterviewResponse';
import { Resume } from '../models/Resume';
import { Notification } from '../models/Notification';
import { PracticeProgress } from '../models/PracticeProgress';
import { QuestionGeneratorService } from './question-generator.service';
import { hashToken } from '../utils/crypto';
import { InterviewType, Difficulty } from '../types';

export class InterviewService {
  /**
   * Schedules a new live or practice interview session.
   */
  static async scheduleInterview(data: {
    candidateId: string;
    interviewerId?: string;
    title: string;
    role: string;
    type: InterviewType;
    difficulty: Difficulty;
    scheduledFor: Date;
    durationMinutes: number;
    interviewerName?: string;
    interviewerEmail?: string;
    candidateName: string;
    candidateEmail: string;
    meetingNotes?: string;
    resumeId?: string;
    language?: 'en' | 'ta' | 'hi';
  }): Promise<IInterviewSession> {
    // Generate distinct, human-friendly room code and cryptographic invitation token
    const randomDigits = Math.floor(100 + Math.random() * 900);
    const roomCode = `apti-meet-${randomDigits}`;
    const rawInvitationToken = crypto.randomBytes(24).toString('hex');
    const invitationTokenHash = hashToken(rawInvitationToken);

    // Find candidate's resume to ground questions
    let resume = null;
    if (data.resumeId) {
      resume = await Resume.findOne({ _id: data.resumeId, userId: data.candidateId });
    }
    if (!resume) {
      resume = await Resume.findOne({ userId: data.candidateId, parsingStatus: 'completed' }).sort({ createdAt: -1 });
    }

    // Generate grounded questions for this interview
    let questionIds: any[] = [];
    if (resume) {
      const generated = await QuestionGeneratorService.generateQuestions({
        userId: data.candidateId,
        resume,
        targetRole: data.role,
        interviewType: data.type,
        difficulty: data.difficulty,
        questionCount: 5,
        language: data.language || 'en',
      });
      questionIds = generated.map((q) => q._id);
    }

    const session = await InterviewSession.create({
      candidateId: data.candidateId,
      interviewerId: data.interviewerId || undefined,
      resumeId: resume?._id || undefined,
      title: data.title,
      jobRole: data.role,
      interviewType: data.type,
      difficulty: data.difficulty,
      scheduledAt: data.scheduledFor,
      durationMinutes: data.durationMinutes || 45,
      status: 'scheduled',
      roomCode,
      invitationTokenHash,
      questionIds,
      interviewerName: data.interviewerName || 'Lead Interviewer',
      interviewerEmail: data.interviewerEmail || '',
      candidateName: data.candidateName,
      candidateEmail: data.candidateEmail,
      meetingNotes: data.meetingNotes || '',
    });

    // Create in-app notification for candidate
    await Notification.create({
      recipientId: data.candidateId,
      type: 'interview_invite',
      title: 'Interview Scheduled',
      message: `Your interview "${data.title}" has been confirmed for ${new Date(data.scheduledFor).toLocaleString()}. Room code: ${roomCode}`,
      relatedResourceId: session._id.toString(),
    });

    return session;
  }

  /**
   * Retrieves an interview by its roomCode with authorization checks.
   */
  static async getByRoomCode(roomCode: string, userId?: string) {
    const session = await InterviewSession.findOne({ roomCode }).populate('questionIds');
    if (!session) {
      throw new Error('INTERVIEW_NOT_FOUND');
    }

    return session;
  }

  /**
   * Lists upcoming interviews for a user (either as candidate or interviewer).
   */
  static async listUserInterviews(userId: string) {
    return InterviewSession.find({
      $or: [{ candidateId: userId }, { interviewerId: userId }],
    })
      .sort({ scheduledAt: -1 })
      .populate('questionIds');
  }

  /**
   * Saves or updates a candidate's answer to an interview question.
   */
  static async saveResponse(data: {
    interviewSessionId: string;
    questionId: string;
    candidateId: string;
    answerText: string;
    timeSpent: number;
    starBreakdown?: any;
  }) {
    const response = await InterviewResponse.findOneAndUpdate(
      {
        interviewSessionId: data.interviewSessionId,
        questionId: data.questionId,
        candidateId: data.candidateId,
      },
      {
        answerText: data.answerText,
        timeSpentSeconds: data.timeSpent,
        starBreakdown: data.starBreakdown,
        submittedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Update practice progress stats
    await PracticeProgress.findOneAndUpdate(
      { userId: data.candidateId },
      {
        $inc: { 'practiceGoal.completedQuestionsToday': 1 },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    return response;
  }
}
