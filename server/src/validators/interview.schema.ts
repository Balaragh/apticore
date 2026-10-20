import { z } from 'zod';

export const scheduleInterviewSchema = z.object({
  title: z.string().min(3).max(150),
  role: z.string().min(2).max(100),
  type: z.enum(['technical', 'behavioral', 'system-design', 'mixed', 'hr']).default('technical'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  scheduledFor: z.string().datetime().or(z.string().min(10)),
  durationMinutes: z.number().int().min(15).max(180).default(45),
  interviewerName: z.string().min(2).optional(),
  interviewerEmail: z.string().email().optional(),
  candidateName: z.string().min(2).optional(),
  candidateEmail: z.string().email().optional(),
  meetingNotes: z.string().max(1000).optional(),
  resumeId: z.string().optional(),
});

export const submitResponseSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().optional().default(''),
  timeSpent: z.number().int().nonnegative().default(0),
  starBreakdown: z
    .object({
      situation: z.string().optional().default(''),
      task: z.string().optional().default(''),
      action: z.string().optional().default(''),
      result: z.string().optional().default(''),
      reflection: z.string().optional(),
    })
    .optional(),
  interviewerNotes: z.string().max(2000).optional(),
});

export const submitFeedbackSchema = z.object({
  technicalKnowledge: z.number().min(1).max(5),
  problemSolving: z.number().min(1).max(5),
  communication: z.number().min(1).max(5),
  overallRating: z.number().min(1).max(5),
  recommendation: z.enum(['strong-hire', 'hire', 'weak-hire', 'no-hire']),
  strengths: z.array(z.string()).default([]),
  improvementAreas: z.array(z.string()).default([]),
  writtenFeedback: z.string().min(5, 'Feedback must be at least 5 characters'),
  confidentialNotes: z.string().optional().default(''),
});
