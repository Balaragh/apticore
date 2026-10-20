import { Router } from 'express';
import { AptitudeController } from '../controllers/aptitude.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All aptitude endpoints require authentication
router.use(authenticate);

router.get('/dashboard', AptitudeController.getDashboard);
router.get('/domains', AptitudeController.getDomains);
router.get('/questions', AptitudeController.getQuestions);
router.post('/submit', AptitudeController.submitPractice);
router.post('/reset-domain', AptitudeController.resetDomainHistory);

export default router;
