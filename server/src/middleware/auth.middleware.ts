import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { Session, User } from '../models';
import { hashToken } from '../utils/crypto';
import { sendError } from '../utils/response';
import { env } from '../config/env';

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token = req.cookies?.[env.SESSION_COOKIE_NAME];

    // Fallback to Authorization header if cookie not sent
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      sendError(res, 'Authentication required. Please log in.', 401, 'UNAUTHORIZED');
      return;
    }

    const tokenHash = hashToken(token);

    const session = await Session.findOne({
      sessionTokenHash: tokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      // Clear invalid cookie
      res.clearCookie(env.SESSION_COOKIE_NAME);
      sendError(res, 'Session expired or invalid. Please log in again.', 401, 'SESSION_EXPIRED');
      return;
    }

    const user = await User.findById(session.userId);
    if (!user || user.accountStatus !== 'active') {
      sendError(res, 'User account is inactive or disabled.', 403, 'ACCOUNT_INACTIVE');
      return;
    }

    req.user = {
      id: user._id.toString(),
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isEmailVerified: Boolean(user.emailVerifiedAt),
      targetJobRoles: user.targetJobRoles,
    };
    req.sessionId = session._id.toString();

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    sendError(res, 'Internal authentication error', 500, 'AUTH_ERROR');
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(res, 'Access denied. You do not have the required permissions.', 403, 'FORBIDDEN');
      return;
    }

    next();
  };
}

export async function optionalAuthenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token = req.cookies?.[env.SESSION_COOKIE_NAME];
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    const tokenHash = hashToken(token);
    const session = await Session.findOne({
      sessionTokenHash: tokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (session) {
      const user = await User.findById(session.userId);
      if (user && user.accountStatus === 'active') {
        req.user = {
          id: user._id.toString(),
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isEmailVerified: Boolean(user.emailVerifiedAt),
          targetJobRoles: user.targetJobRoles,
        };
        req.sessionId = session._id.toString();
      }
    }

    next();
  } catch {
    next();
  }
}
