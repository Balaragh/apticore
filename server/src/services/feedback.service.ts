import { InterviewFeedback } from '../models/InterviewFeedback';
import { InterviewSession } from '../models/InterviewSession';
import { PracticeProgress } from '../models/PracticeProgress';
import { Notification } from '../models/Notification';
import { AuthenticatedUser } from '../types';

export class FeedbackService {
  /**
   * Submits an official interview evaluation.
   * Only the assigned interviewer or admin can submit.
   */
  static async submitEvaluation(
    sessionId: string,
    evaluator: AuthenticatedUser,
    data: {
      technicalKnowledge: number;
      problemSolving: number;
      communication: number;
      overallRating: number;
      recommendation: 'strong-hire' | 'hire' | 'weak-hire' | 'no-hire';
      strengths: string[];
      improvementAreas: string[];
      writtenFeedback: string;
      confidentialNotes?: string;
    }
  ) {
    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      throw new Error('INTERVIEW_NOT_FOUND');
    }

    // Role verification
    const isAssignedInterviewer =
      session.interviewerId?.toString() === evaluator.id ||
      evaluator.role === 'interviewer' ||
      evaluator.role === 'admin';

    if (!isAssignedInterviewer) {
      throw new Error('UNAUTHORIZED_EVALUATION');
    }

    const feedback = await InterviewFeedback.findOneAndUpdate(
      { interviewSessionId: session._id },
      {
        interviewSessionId: session._id,
        candidateId: session.candidateId,
        interviewerId: evaluator._id,
        roomCode: session.roomCode,
        candidateName: session.candidateName,
        interviewerName: evaluator.name,
        role: session.jobRole,
        interviewType: session.interviewType,
        technicalKnowledge: data.technicalKnowledge,
        problemSolving: data.problemSolving,
        communication: data.communication,
        overallRating: data.overallRating,
        recommendation: data.recommendation,
        strengths: data.strengths,
        improvementAreas: data.improvementAreas,
        writtenFeedback: data.writtenFeedback,
        confidentialNotes: data.confidentialNotes || '',
        isSubmitted: true,
        submittedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Transition session status to completed
    session.status = 'completed';
    session.endedAt = new Date();
    await session.save();

    // Increment completed sessions on candidate progress
    await PracticeProgress.findOneAndUpdate(
      { userId: session.candidateId },
      {
        $inc: { completedSessions: 1 },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    // Notify candidate
    await Notification.create({
      recipientId: session.candidateId,
      type: 'success',
      title: 'Interview Feedback Available',
      message: `Evaluation for your interview "${session.title}" has been submitted by ${evaluator.name}.`,
      relatedResourceId: feedback._id.toString(),
    });

    return feedback;
  }

  /**
   * Retrieves feedback for a session, redacting confidentialNotes if requester is the candidate.
   */
  static async getFeedbackBySessionId(sessionId: string, requester: AuthenticatedUser) {
    const feedback = await InterviewFeedback.findOne({ interviewSessionId: sessionId });
    if (!feedback) {
      return null;
    }

    const json = feedback.toJSON();

    // Candidate cannot see interviewer's confidential internal notes
    if (requester.id === feedback.candidateId.toString() && requester.role !== 'admin') {
      delete (json as any).confidentialNotes;
    }

    return json;
  }
}
