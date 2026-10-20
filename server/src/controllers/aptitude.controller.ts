import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { AptitudeService, ALL_APTITUDE_DOMAINS } from '../services/aptitude.service';
import { AptitudeDomain } from '../models/AptitudeQuestion';
import { sendSuccess, sendError } from '../utils/response';

export class AptitudeController {
  /**
   * GET /api/aptitude/dashboard
   * Returns domain summaries, active streaks, today's practice progress, and calendar history
   */
  static async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const timezone = (req.query.timezone as string) || 'Asia/Kolkata';
      const dashboard = await AptitudeService.getAptitudeDashboard(req.user._id, timezone);

      sendSuccess(res, dashboard, 'Aptitude dashboard retrieved successfully');
    } catch (error: any) {
      console.error('Aptitude dashboard error:', error);
      sendError(res, error.message || 'Failed to retrieve aptitude dashboard', 500, 'DASHBOARD_ERROR');
    }
  }

  /**
   * GET /api/aptitude/domains
   * Returns list of domains with user streak status and remaining questions
   */
  static async getDomains(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const timezone = (req.query.timezone as string) || 'Asia/Kolkata';
      const summary = await AptitudeService.getDomainSummary(req.user._id, timezone);

      sendSuccess(res, summary, 'Domains list retrieved successfully');
    } catch (error: any) {
      console.error('Aptitude domains error:', error);
      sendError(res, error.message || 'Failed to retrieve aptitude domains', 500, 'DOMAINS_ERROR');
    }
  }

  /**
   * GET /api/aptitude/questions
   * Fetches un-answered questions for the selected domain, excluding all previously answered questions
   */
  static async getQuestions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const domain = req.query.domain as AptitudeDomain;
      if (!domain || !ALL_APTITUDE_DOMAINS.includes(domain)) {
        sendError(
          res,
          `Invalid domain. Must be one of: ${ALL_APTITUDE_DOMAINS.join(', ')}`,
          400,
          'INVALID_DOMAIN'
        );
        return;
      }

      const difficulty = (req.query.difficulty as string) || 'All';
      const count = Number(req.query.count) || 5;

      const result = await AptitudeService.getQuestionsForPractice({
        userId: req.user._id,
        domain,
        difficulty,
        count,
      });

      sendSuccess(res, result, 'Practice questions retrieved successfully');
    } catch (error: any) {
      console.error('Aptitude getQuestions error:', error);
      sendError(res, error.message || 'Failed to retrieve practice questions', 500, 'QUESTIONS_ERROR');
    }
  }

  /**
   * POST /api/aptitude/submit
   * Submits practice session answers, updates streaks, and provides explanations
   */
  static async submitPractice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const { domain, answers, timezone } = req.body;
      if (!domain || !ALL_APTITUDE_DOMAINS.includes(domain)) {
        sendError(
          res,
          `Invalid domain. Must be one of: ${ALL_APTITUDE_DOMAINS.join(', ')}`,
          400,
          'INVALID_DOMAIN'
        );
        return;
      }

      if (!Array.isArray(answers) || answers.length === 0) {
        sendError(res, 'Answers array must contain at least one question response', 400, 'EMPTY_ANSWERS');
        return;
      }

      const result = await AptitudeService.submitPracticeSession({
        userId: req.user._id,
        domain,
        answers,
        timezone: timezone || 'Asia/Kolkata',
      });

      sendSuccess(res, result, 'Practice session evaluated and streak updated successfully', 200);
    } catch (error: any) {
      console.error('Aptitude submitPractice error:', error);
      sendError(res, error.message || 'Failed to submit practice session', 500, 'SUBMIT_ERROR');
    }
  }

  /**
   * POST /api/aptitude/reset-domain
   * Resets answered question history for a domain if user has exhausted questions
   */
  static async resetDomainHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      const { domain } = req.body;
      if (!domain || !ALL_APTITUDE_DOMAINS.includes(domain)) {
        sendError(
          res,
          `Invalid domain. Must be one of: ${ALL_APTITUDE_DOMAINS.join(', ')}`,
          400,
          'INVALID_DOMAIN'
        );
        return;
      }

      const result = await AptitudeService.resetDomainHistory(req.user._id, domain);
      sendSuccess(res, result, `Question history for ${domain} reset successfully`);
    } catch (error: any) {
      console.error('Aptitude resetDomainHistory error:', error);
      sendError(res, error.message || 'Failed to reset domain history', 500, 'RESET_ERROR');
    }
  }
}
