import { Router } from 'express';
import { ResumeController } from '../controllers/resume.controller';
import { authenticate } from '../middleware/auth.middleware';
import { handleResumeUpload } from '../middleware/upload.middleware';
import { uploadLimiter } from '../middleware/rate-limit.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { updateResumeProfileSchema } from '../validators/resume.schema';

const router = Router();

// All resume routes require authentication
router.use(authenticate);

router.post('/', uploadLimiter, handleResumeUpload, ResumeController.uploadResume);
router.get('/', ResumeController.listResumes);
router.get('/:id', ResumeController.getResume);
router.patch('/:id/profile', validateBody(updateResumeProfileSchema), ResumeController.updateResumeProfile);
router.post('/:id/analyze', ResumeController.reanalyzeResume);
router.delete('/:id', ResumeController.deleteResume);

export default router;
