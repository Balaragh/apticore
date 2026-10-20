import { Request, Response, NextFunction } from 'express';
import { isProd } from '../config/env';
import { sendError } from '../utils/response';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.status || err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected internal error occurred';

  // Do not expose stack traces or internal DB details in production
  if (!isProd) {
    console.error('Unhandled Server Error:', err);
  } else {
    console.error(`[Error ${statusCode}] ${errorCode}: ${message}`);
  }

  sendError(
    res,
    isProd && statusCode === 500 ? 'An unexpected server error occurred' : message,
    statusCode,
    errorCode,
    !isProd ? { stack: err.stack } : undefined
  );
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(
    res,
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
}
