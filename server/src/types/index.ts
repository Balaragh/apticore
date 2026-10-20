import { Request } from 'express';
import { Types } from 'mongoose';

export type UserRole = 'candidate' | 'interviewer' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'pending';
export type InterviewType = 'technical' | 'behavioral' | 'system-design' | 'mixed' | 'hr';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type MeetingStatus = 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'expired';

export interface AuthenticatedUser {
  id: string;
  _id: Types.ObjectId;
  email: string;
  name: string;
  role: UserRole;
  isEmailVerified: boolean;
  targetJobRoles: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  sessionId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
