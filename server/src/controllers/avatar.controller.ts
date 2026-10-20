import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { AvatarService } from '../services/avatar.service';
import { ConversationalAIService } from '../services/conversational-ai.service';
import { Resume } from '../models/Resume';
import { InterviewSession } from '../models/InterviewSession';
import { InterviewResponse } from '../models/InterviewResponse';
import { sendSuccess, sendError } from '../utils/response';

export class AvatarController {
  /**
   * GET /api/interview/avatar/status
   */
  static async getStatus(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const status = AvatarService.getProviderStatus();
      sendSuccess(res, status, 'Avatar provider status retrieved');
    } catch (err: any) {
      sendError(res, err.message || 'Failed to retrieve avatar status', 500, 'AVATAR_STATUS_ERROR');
    }
  }

  /**
   * POST /api/interview/avatar/session
   */
  static async createSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { avatarId, voiceId, quality } = req.body;
      const session = await AvatarService.createSession({ avatarId, voiceId, quality });
      sendSuccess(res, session, 'Avatar streaming session initialized', 201);
    } catch (err: any) {
      sendError(res, err.message || 'Failed to create avatar session', 400, 'AVATAR_SESSION_ERROR');
    }
  }

  /**
   * POST /api/interview/avatar/speak
   */
  static async speak(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId, text } = req.body;
      if (!sessionId || !text) {
        sendError(res, 'Session ID and speech text are required', 400, 'VALIDATION_ERROR');
        return;
      }

      const result = await AvatarService.speak(sessionId, text);
      sendSuccess(res, result, 'Speech dispatched to avatar');
    } catch (err: any) {
      sendError(res, err.message || 'Failed to dispatch speech to avatar', 400, 'AVATAR_SPEAK_ERROR');
    }
  }

  /**
   * POST /api/interview/avatar/interrupt
   */
  static async interrupt(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.body;
      const result = await AvatarService.interrupt(sessionId);
      sendSuccess(res, result, 'Avatar speech interrupted');
    } catch (err: any) {
      sendError(res, err.message || 'Failed to interrupt avatar', 400, 'AVATAR_INTERRUPT_ERROR');
    }
  }

  /**
   * POST /api/interview/avatar/stop
   */
  static async stopSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.body;
      const result = await AvatarService.closeSession(sessionId);
      sendSuccess(res, result, 'Avatar session concluded');
    } catch (err: any) {
      sendError(res, err.message || 'Failed to stop avatar session', 400, 'AVATAR_STOP_ERROR');
    }
  }

  /**
   * POST /api/interview/avatar/chat
   * Evaluates candidate spoken answer, generates conversational response,
   * stores response in DB if interview session exists, and returns evaluation.
   */
  static async processCandidateAnswer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        candidateAnswer,
        currentQuestion,
        category,
        difficulty,
        targetRole,
        experienceLevel,
        interviewSessionId,
        questionId,
        avatarSessionId,
        conversationHistory,
        language = 'en',
      } = req.body;

      if (!candidateAnswer || !currentQuestion) {
        sendError(res, 'candidateAnswer and currentQuestion are required', 400, 'VALIDATION_ERROR');
        return;
      }

      // Optionally pull resume details if user is logged in
      let resumeDetails: any = undefined;
      if (req.user) {
        const resumeDoc = await Resume.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
        if (resumeDoc) {
          resumeDetails = {
            skills: resumeDoc.parsedSkills.map((s) => s.name),
            projects: resumeDoc.parsedProjects,
            extractedText: resumeDoc.extractedText,
          };
        }
      }

      const turnOutput = await ConversationalAIService.evaluateAndRespond({
        candidateAnswer,
        currentQuestion,
        category,
        difficulty,
        targetRole,
        experienceLevel,
        resumeDetails,
        conversationHistory,
        language,
      });

      // If active avatar session is provided, dispatch speech to avatar
      if (avatarSessionId) {
        try {
          await AvatarService.speak(avatarSessionId, turnOutput.interviewerSpokenReply);
        } catch (avatarErr) {
          console.warn('Avatar speech dispatch notice:', avatarErr);
        }
      }

      // Save response in MongoDB if interviewSessionId is provided and candidate is authenticated
      if (interviewSessionId && req.user) {
        try {
          await InterviewResponse.create({
            interviewSessionId,
            questionId: questionId || `q_${Date.now()}`,
            candidateId: req.user.id,
            answerText: candidateAnswer,
            timeSpentSeconds: 60,
            starBreakdown: turnOutput.evaluation.starAssessment
              ? {
                  situation: turnOutput.evaluation.starAssessment.situationPresent ? 'Addressed' : '',
                  task: turnOutput.evaluation.starAssessment.taskPresent ? 'Addressed' : '',
                  action: turnOutput.evaluation.starAssessment.actionPresent ? 'Addressed' : '',
                  result: turnOutput.evaluation.starAssessment.resultPresent ? 'Addressed' : '',
                  reflection: turnOutput.evaluation.starAssessment.critique,
                }
              : undefined,
            interviewerNotes: turnOutput.evaluation.improvements.join('; '),
            submittedAt: new Date(),
          });
        } catch (dbErr) {
          console.warn('Failed to record interview response in DB:', dbErr);
        }
      }

      sendSuccess(res, turnOutput, 'Candidate response evaluated and conversational reply generated');
    } catch (err: any) {
      console.error('Process candidate answer error:', err);
      sendError(res, err.message || 'Failed to process candidate response', 500, 'EVALUATION_ERROR');
    }
  }
}
