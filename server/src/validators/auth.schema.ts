import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Valid email is required').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['candidate', 'interviewer']).default('candidate'),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email is required').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  targetJobRoles: z.array(z.string()).optional(),
  profile: z
    .object({
      avatar: z.string().optional(),
      bio: z.string().max(500).optional(),
      github: z.string().optional(),
      linkedin: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  preferences: z
    .object({
      emailNotifications: z.boolean().optional(),
      practiceReminders: z.boolean().optional(),
      weeklyReport: z.boolean().optional(),
      theme: z.enum(['light', 'dark', 'system']).optional(),
      profileVisibility: z.enum(['public', 'private']).optional(),
      dailyGoal: z.number().min(1).max(20).optional(),
    })
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});
