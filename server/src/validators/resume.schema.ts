import { z } from 'zod';

export const updateResumeProfileSchema = z.object({
  targetRole: z.string().min(2).max(100).optional(),
  parsedSkills: z
    .array(
      z.object({
        name: z.string().min(1),
        level: z.enum(['beginner', 'intermediate', 'advanced']),
        source: z.enum(['resume', 'inferred']).default('resume'),
      })
    )
    .optional(),
  parsedProjects: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional().default(''),
        technologies: z.array(z.string()).optional().default([]),
      })
    )
    .optional(),
  parsedExperience: z
    .array(
      z.object({
        role: z.string().min(1),
        company: z.string().min(1),
        duration: z.string().optional().default(''),
        highlights: z.array(z.string()).optional().default([]),
      })
    )
    .optional(),
});

export const generateQuestionsSchema = z.object({
  targetRole: z.string().min(2).default('Full Stack Engineer'),
  interviewType: z.enum(['technical', 'behavioral', 'system-design', 'mixed', 'hr']).default('technical'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  questionCount: z.number().int().min(1).max(15).default(5),
  language: z.enum(['en', 'ta', 'hi']).default('en'),
});
