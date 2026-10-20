import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/apticore'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),

  SESSION_SECRET: z.string().min(16).default('apticore-default-secret-session-key-32chars!'),
  SESSION_COOKIE_NAME: z.string().default('apticore_session'),
  SESSION_MAX_AGE_DAYS: z.coerce.number().default(7),

  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(5),
  UPLOAD_DIR: z.string().default('uploads/resumes'),

  AI_PROVIDER: z.enum(['gemini', 'openai', 'groq', 'mock']).default('mock'),
  AI_API_KEY: z.string().optional().default(''),
  AI_MODEL: z.string().default('gemini-1.5-flash'),

  EMAIL_PROVIDER: z.enum(['console', 'smtp', 'resend']).default('console'),
  EMAIL_FROM: z.string().default('AptiCore Support <support@apticore.com>'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),

  ICE_SERVERS_JSON: z.string().default('[{"urls":"stun:stun.l.google.com:19302"},{"urls":"stun:stun1.l.google.com:19302"}]'),

  // Photorealistic Avatar Video Provider
  AVATAR_PROVIDER: z.enum(['heygen', 'tavus', 'simli', 'none']).default('heygen'),
  HEYGEN_API_KEY: z.string().optional().default(''),
  HEYGEN_AVATAR_ID: z.string().optional().default(''),
  HEYGEN_VOICE_ID: z.string().optional().default(''),
  TAVUS_API_KEY: z.string().optional().default(''),
  TAVUS_REPLICA_ID: z.string().optional().default(''),
  TAVUS_PERSONA_ID: z.string().optional().default(''),
  SIMLI_API_KEY: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid backend environment configuration:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
