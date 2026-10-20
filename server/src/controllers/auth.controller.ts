import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { env } from '../config/env';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role } = req.body;
      const user = await AuthService.registerUser(
        name,
        email,
        password,
        role,
        res,
        req.headers['user-agent'],
        req.ip
      );
      sendSuccess(res, user, 'Registration successful', 201);
    } catch (error: any) {
      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        sendError(res, 'An account with this email address already exists.', 409, 'EMAIL_EXISTS');
        return;
      }
      sendError(res, error.message || 'Registration failed', 400, 'REGISTRATION_FAILED');
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const user = await AuthService.loginUser(
        email,
        password,
        res,
        req.headers['user-agent'],
        req.ip
      );
      sendSuccess(res, user, 'Login successful', 200);
    } catch (error: any) {
      if (error.message === 'INVALID_CREDENTIALS') {
        sendError(res, 'Invalid email or password.', 401, 'INVALID_CREDENTIALS');
        return;
      }
      if (error.message === 'ACCOUNT_SUSPENDED') {
        sendError(res, 'Your account is suspended. Please contact support.', 403, 'ACCOUNT_SUSPENDED');
        return;
      }
      sendError(res, 'Login failed', 400, 'LOGIN_FAILED');
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = req.cookies?.[env.SESSION_COOKIE_NAME];
      await AuthService.revokeSession(token, res);
      sendSuccess(res, null, 'Logged out successfully', 200);
    } catch (error: any) {
      sendError(res, 'Logout failed', 500, 'LOGOUT_ERROR');
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }
      const user = await User.findById(req.user.id);
      if (!user) {
        sendError(res, 'User not found', 404, 'NOT_FOUND');
        return;
      }
      sendSuccess(res, user.toJSON(), 'User session verified', 200);
    } catch (error: any) {
      sendError(res, 'Failed to fetch session user', 500, 'INTERNAL_ERROR');
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }
      const user = await User.findByIdAndUpdate(req.user.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!user) {
        sendError(res, 'User not found', 404, 'NOT_FOUND');
        return;
      }
      sendSuccess(res, user.toJSON(), 'Profile updated successfully', 200);
    } catch (error: any) {
      sendError(res, 'Failed to update profile', 400, 'UPDATE_FAILED');
    }
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      await AuthService.requestPasswordReset(email);
      // Always return 200 to prevent account enumeration
      sendSuccess(
        res,
        null,
        'If an account with that email exists, password reset instructions have been issued.'
      );
    } catch (error: any) {
      sendError(res, 'Request failed', 500, 'RESET_REQUEST_FAILED');
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;
      await AuthService.resetPasswordWithToken(token, password);
      sendSuccess(res, null, 'Password has been reset successfully. Please log in.');
    } catch (error: any) {
      if (error.message === 'INVALID_OR_EXPIRED_TOKEN') {
        sendError(res, 'Password reset token is invalid or has expired.', 400, 'INVALID_TOKEN');
        return;
      }
      sendError(res, 'Failed to reset password', 400, 'RESET_FAILED');
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id).select('+passwordHash');
      if (!user) {
        sendError(res, 'User not found', 404, 'NOT_FOUND');
        return;
      }

      const isMatch = await verifyPassword(currentPassword, user.passwordHash);
      if (!isMatch) {
        sendError(res, 'Current password does not match.', 400, 'INVALID_CURRENT_PASSWORD');
        return;
      }

      user.passwordHash = await hashPassword(newPassword);
      await user.save();

      sendSuccess(res, null, 'Password changed successfully');
    } catch (error: any) {
      sendError(res, 'Failed to change password', 500, 'CHANGE_PASSWORD_FAILED');
    }
  }
}
