import { Router } from 'express';
import { AvatarController } from '../controllers/avatar.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

// Retrieve provider configuration status and diagnostics
router.get('/status', optionalAuthenticate, AvatarController.getStatus);

// Process candidate spoken answer with Conversational AI
router.post('/chat', optionalAuthenticate, AvatarController.processCandidateAnswer);

// Photorealistic avatar streaming control endpoints
router.post('/session', optionalAuthenticate, AvatarController.createSession);
router.post('/speak', optionalAuthenticate, AvatarController.speak);
router.post('/interrupt', optionalAuthenticate, AvatarController.interrupt);
router.post('/stop', optionalAuthenticate, AvatarController.stopSession);

export default router;
