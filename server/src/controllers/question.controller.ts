import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { Resume } from '../models/Resume';
import { InterviewQuestion } from '../models/InterviewQuestion';
import { InterviewSession } from '../models/InterviewSession';
import { QuestionGeneratorService } from '../services/question-generator.service';
import { sendSuccess, sendError } from '../utils/response';

export class QuestionController {
  static async generateResumeQuestions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const resume = await Resume.findById(req.params.id);
      if (!resume) {
        sendError(res, 'Resume not found', 404, 'NOT_FOUND');
        return;
      }

      // Ownership check
      if (resume.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        sendError(res, 'Access denied.', 403, 'FORBIDDEN');
        return;
      }

      const { targetRole, interviewType, difficulty, questionCount, language } = req.body;

      const questions = await QuestionGeneratorService.generateQuestions({
        userId: req.user.id,
        resume,
        targetRole: targetRole || resume.targetRole,
        interviewType: interviewType || 'technical',
        difficulty: difficulty || 'medium',
        questionCount: questionCount || 5,
        language: language || 'en',
      });

      sendSuccess(
        res,
        questions.map((q) => q.toJSON()),
        'Resume-grounded interview questions generated successfully',
        201
      );
    } catch (error: any) {
      console.error('Question generation error:', error);
      sendError(res, error.message || 'Failed to generate questions', 500, 'GENERATION_ERROR');
    }
  }

  static async getResumeQuestions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const questions = await InterviewQuestion.find({
        userId: req.user.id,
        resumeId: req.params.id,
      }).sort({ questionOrder: 1, createdAt: -1 });

      sendSuccess(res, questions.map((q) => q.toJSON()), 'Questions retrieved successfully');
    } catch (error: any) {
      sendError(res, 'Failed to fetch questions', 500, 'RETRIEVE_ERROR');
    }
  }

  static async getSessionQuestions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const session = await InterviewSession.findById(req.params.id).populate('questionIds');
      if (!session) {
        sendError(res, 'Interview session not found', 404, 'NOT_FOUND');
        return;
      }

      sendSuccess(res, (session.questionIds as any[]).map((q) => (q.toJSON ? q.toJSON() : q)), 'Session questions retrieved');
    } catch (error: any) {
      sendError(res, 'Failed to retrieve session questions', 500, 'RETRIEVE_ERROR');
    }
  }
}
