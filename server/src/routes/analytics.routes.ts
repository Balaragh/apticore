import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/dashboard', AnalyticsController.getDashboardAnalytics);
router.get('/notifications', AnalyticsController.getNotifications);
router.patch('/notifications/:id/read', AnalyticsController.markNotificationRead);

export default router;
