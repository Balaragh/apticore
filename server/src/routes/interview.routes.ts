import { Router } from 'express';
import { InterviewController } from '../controllers/interview.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
  scheduleInterviewSchema,
  submitResponseSchema,
  submitFeedbackSchema,
} from '../validators/interview.schema';

const router = Router();

// Get session details by roomCode (can be accessed by authenticated candidate/interviewer)
router.get('/room/:roomCode', authenticate, InterviewController.getInterviewByRoom);

// Protected routes
router.use(authenticate);

router.post('/', validateBody(scheduleInterviewSchema), InterviewController.scheduleInterview);
router.get('/', InterviewController.listUserInterviews);
router.patch('/:id/status', InterviewController.updateStatus);
router.post('/:id/responses', validateBody(submitResponseSchema), InterviewController.saveResponse);
router.post('/:id/feedback', validateBody(submitFeedbackSchema), InterviewController.submitFeedback);
router.get('/:id/feedback', InterviewController.getFeedback);

export default router;
