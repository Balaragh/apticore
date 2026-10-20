import { Router, Request, Response } from 'express';
import { isDbConnected } from '../config/db';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'AptiCore Backend',
  });
});

router.get('/ready', (_req: Request, res: Response) => {
  const dbOk = isDbConnected();
  if (dbOk) {
    sendSuccess(res, {
      status: 'ready',
      database: 'connected',
    });
  } else {
    sendError(res, 'Database not ready', 503, 'SERVICE_UNAVAILABLE', { database: 'disconnected' });
  }
});

export default router;
