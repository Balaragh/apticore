import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { InterviewService } from '../services/interview.service';
import { FeedbackService } from '../services/feedback.service';
import { InterviewSession } from '../models/InterviewSession';
import { sendSuccess, sendError } from '../utils/response';

export class InterviewController {
  static async scheduleInterview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const {
        title,
        role,
        type,
        difficulty,
        scheduledFor,
        durationMinutes,
        interviewerName,
        interviewerEmail,
        candidateName,
        candidateEmail,
        meetingNotes,
        resumeId,
      } = req.body;

      const session = await InterviewService.scheduleInterview({
        candidateId: req.user.role === 'interviewer' ? (candidateEmail ? req.user.id : req.user.id) : req.user.id,
        interviewerId: req.user.role === 'interviewer' ? req.user.id : undefined,
        title,
        role,
        type,
        difficulty,
        scheduledFor: new Date(scheduledFor),
        durationMinutes,
        interviewerName: interviewerName || (req.user.role === 'interviewer' ? req.user.name : 'Lead Interviewer'),
        interviewerEmail: interviewerEmail || (req.user.role === 'interviewer' ? req.user.email : ''),
        candidateName: candidateName || (req.user.role === 'candidate' ? req.user.name : 'Candidate'),
        candidateEmail: candidateEmail || (req.user.role === 'candidate' ? req.user.email : ''),
        meetingNotes,
        resumeId,
      });

      sendSuccess(res, session.toJSON(), 'Interview scheduled successfully', 201);
    } catch (error: any) {
      console.error('Schedule interview error:', error);
      sendError(res, error.message || 'Failed to schedule interview', 400, 'SCHEDULE_FAILED');
    }
  }

  static async listUserInterviews(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const interviews = await InterviewService.listUserInterviews(req.user.id);
      sendSuccess(
        res,
        interviews.map((i) => i.toJSON()),
        'User interviews retrieved'
      );
    } catch (error: any) {
      sendError(res, 'Failed to fetch interviews', 500, 'FETCH_ERROR');
    }
  }

  static async getInterviewByRoom(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const roomCode = String(req.params.roomCode);
      const session = await InterviewService.getByRoomCode(roomCode, req.user?.id);
      sendSuccess(res, session.toJSON(), 'Interview room session retrieved');
    } catch (error: any) {
      if (error.message === 'INTERVIEW_NOT_FOUND') {
        sendError(res, 'Interview room not found', 404, 'NOT_FOUND');
        return;
      }
      sendError(res, 'Failed to get interview details', 500, 'FETCH_ERROR');
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { status } = req.body;

      const session = await InterviewSession.findById(id);
      if (!session) {
        sendError(res, 'Interview session not found', 404, 'NOT_FOUND');
        return;
      }

      session.status = status;
      if (status === 'in_progress' && !session.startedAt) {
        session.startedAt = new Date();
      }
      if (status === 'completed' || status === 'cancelled') {
        session.endedAt = new Date();
      }

      await session.save();
      sendSuccess(res, session.toJSON(), 'Session status updated successfully');
    } catch (error: any) {
      sendError(res, 'Failed to update session status', 400, 'UPDATE_FAILED');
    }
  }

  static async saveResponse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const interviewSessionId = String(req.params.id);
      const { questionId, answer, timeSpent, starBreakdown } = req.body;

      const response = await InterviewService.saveResponse({
        interviewSessionId,
        questionId,
        candidateId: req.user.id,
        answerText: answer,
        timeSpent,
        starBreakdown,
      });

      sendSuccess(res, response.toJSON(), 'Response saved successfully');
    } catch (error: any) {
      sendError(res, 'Failed to save response', 500, 'SAVE_FAILED');
    }
  }

  static async submitFeedback(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const sessionId = String(req.params.id);
      const feedback = await FeedbackService.submitEvaluation(sessionId, req.user, req.body);

      sendSuccess(res, feedback.toJSON(), 'Interview evaluation submitted successfully', 201);
    } catch (error: any) {
      if (error.message === 'UNAUTHORIZED_EVALUATION') {
        sendError(res, 'Only the assigned interviewer can submit evaluations.', 403, 'FORBIDDEN');
        return;
      }
      sendError(res, error.message || 'Failed to submit feedback', 400, 'FEEDBACK_FAILED');
    }
  }

  static async getFeedback(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const sessionId = String(req.params.id);
      const feedback = await FeedbackService.getFeedbackBySessionId(sessionId, req.user);

      if (!feedback) {
        sendError(res, 'Feedback not found for this session', 404, 'NOT_FOUND');
        return;
      }

      sendSuccess(res, feedback, 'Feedback retrieved successfully');
    } catch (error: any) {
      sendError(res, 'Failed to fetch feedback', 500, 'FETCH_ERROR');
    }
  }
}
