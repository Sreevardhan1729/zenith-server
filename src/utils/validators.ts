import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const linkLeetCodeSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50),
});

export const updateSettingsSchema = z.object({
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Mixed']).optional(),
  problemsPerDay: z.number().int().min(1).max(5).optional(),
  timezone: z.string().optional(),
  mixRatio: z
    .object({
      easy: z.number().int().min(0),
      medium: z.number().int().min(0),
      hard: z.number().int().min(0),
    })
    .optional(),
});

export const updateReminderSettingsSchema = z.object({
  template: z.enum(['gentle', 'moderate', 'aggressive', 'custom']),
  customTimes: z.array(z.string().regex(/^\d{2}:\d{2}$/)).optional(),
});

export const registerTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web', 'macos']),
});

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join(', ');
    throw new (require('./errors').ValidationError)(message);
  }
  return result.data;
}
