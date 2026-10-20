import { Router } from 'express';
import { QuestionController } from '../controllers/question.controller';
import { authenticate } from '../middleware/auth.middleware';
import { aiLimiter } from '../middleware/rate-limit.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { generateQuestionsSchema } from '../validators/resume.schema';

const router = Router();

router.use(authenticate);

// Generate questions grounded in resume
router.post(
  '/resumes/:id/questions/generate',
  aiLimiter,
  validateBody(generateQuestionsSchema),
  QuestionController.generateResumeQuestions
);

router.get('/resumes/:id/questions', QuestionController.getResumeQuestions);
router.get('/interviews/:id/questions', QuestionController.getSessionQuestions);

export default router;
