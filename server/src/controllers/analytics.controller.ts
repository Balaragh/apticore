import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { AnalyticsService } from '../services/analytics.service';
import { Notification } from '../models/Notification';
import { sendSuccess, sendError } from '../utils/response';

export class AnalyticsController {
  static async getDashboardAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const analytics = await AnalyticsService.getUserAnalytics(req.user.id);
      sendSuccess(res, analytics, 'Dashboard analytics retrieved');
    } catch (error: any) {
      sendError(res, 'Failed to fetch analytics', 500, 'ANALYTICS_ERROR');
    }
  }

  static async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const notifications = await Notification.find({ recipientId: req.user.id })
        .sort({ createdAt: -1 })
        .limit(20);

      sendSuccess(res, notifications.map((n) => n.toJSON()), 'Notifications retrieved');
    } catch (error: any) {
      sendError(res, 'Failed to fetch notifications', 500, 'NOTIFICATION_ERROR');
    }
  }

  static async markNotificationRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      await Notification.findOneAndUpdate(
        { _id: req.params.id, recipientId: req.user.id },
        { readAt: new Date() }
      );

      sendSuccess(res, null, 'Notification marked as read');
    } catch (error: any) {
      sendError(res, 'Failed to mark notification read', 400, 'UPDATE_ERROR');
    }
  }
}
