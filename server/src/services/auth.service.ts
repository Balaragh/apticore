import { Response } from 'express';
import { User, Session, VerificationToken } from '../models';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
} from '../utils/crypto';
import { env, isProd } from '../config/env';

export interface CookieConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  maxAge: number;
  path: string;
}

export function getSessionCookieOptions(): CookieConfig {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: env.SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

export class AuthService {
  /**
   * Creates a secure server-managed session in MongoDB and sets the HttpOnly cookie.
   */
  static async createSession(
    userId: string,
    res: Response,
    userAgent = '',
    ipAddress = ''
  ): Promise<string> {
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.SESSION_MAX_AGE_DAYS);

    await Session.create({
      userId,
      sessionTokenHash: tokenHash,
      userAgent,
      ipAddress,
      expiresAt,
    });

    res.cookie(env.SESSION_COOKIE_NAME, rawToken, getSessionCookieOptions());

    return rawToken;
  }

  /**
   * Revokes the current session and clears the cookie.
   */
  static async revokeSession(token: string, res: Response): Promise<void> {
    if (token) {
      const tokenHash = hashToken(token);
      await Session.findOneAndUpdate(
        { sessionTokenHash: tokenHash },
        { revokedAt: new Date() }
      );
    }
    res.clearCookie(env.SESSION_COOKIE_NAME, { path: '/' });
  }

  /**
   * Registers a new user and logs them in immediately.
   */
  static async registerUser(
    name: string,
    email: string,
    password: string,
    role: 'candidate' | 'interviewer',
    res: Response,
    userAgent?: string,
    ipAddress?: string
  ) {
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: role || 'candidate',
      accountStatus: 'active',
      emailVerifiedAt: new Date(), // Auto-verified in development
    });

    await this.createSession(user._id.toString(), res, userAgent, ipAddress);

    return user.toJSON();
  }

  /**
   * Authenticates user credentials and starts a session.
   */
  static async loginUser(
    email: string,
    password: string,
    res: Response,
    userAgent?: string,
    ipAddress?: string
  ) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      // Return generic error to prevent account enumeration
      throw new Error('INVALID_CREDENTIALS');
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('INVALID_CREDENTIALS');
    }

    if (user.accountStatus !== 'active') {
      throw new Error('ACCOUNT_SUSPENDED');
    }

    await this.createSession(user._id.toString(), res, userAgent, ipAddress);

    return user.toJSON();
  }

  /**
   * Sends password reset token (logs to console for testing/development).
   */
  static async requestPasswordReset(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Do not reveal if email does not exist
    if (!user) {
      return;
    }

    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    await VerificationToken.create({
      userId: user._id,
      tokenHash,
      type: 'password_reset',
      expiresAt,
    });

    // Development testing output
    console.log(`\n========================================`);
    console.log(`[PASSWORD RESET] For ${normalizedEmail}`);
    console.log(`Reset Token: ${rawToken}`);
    console.log(`Reset Link: ${env.FRONTEND_ORIGIN}/reset-password?token=${rawToken}`);
    console.log(`========================================\n`);
  }

  /**
   * Resets password using valid token.
   */
  static async resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(token);

    const record = await VerificationToken.findOne({
      tokenHash,
      type: 'password_reset',
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      throw new Error('INVALID_OR_EXPIRED_TOKEN');
    }

    const passwordHash = await hashPassword(newPassword);

    await User.findByIdAndUpdate(record.userId, { passwordHash });

    // Mark token as used
    record.usedAt = new Date();
    await record.save();

    // Revoke all existing sessions for this user for security
    await Session.updateMany(
      { userId: record.userId, revokedAt: null },
      { revokedAt: new Date() }
    );
  }
}
