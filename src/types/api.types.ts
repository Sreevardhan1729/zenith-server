import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { JwtPayload } from './index';

export interface AuthenticatedRequest extends VercelRequest {
  user?: JwtPayload;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RegisterBody {
  email: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface LinkLeetCodeBody {
  username: string;
}

export interface UpdateSettingsBody {
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  problemsPerDay?: number;
  timezone?: string;
  mixRatio?: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface UpdateReminderSettingsBody {
  template: 'gentle' | 'moderate' | 'aggressive' | 'custom';
  customTimes?: string[];
}

export interface RegisterTokenBody {
  token: string;
  platform: 'ios' | 'android' | 'web' | 'macos';
}

export type ApiHandler = (
  req: AuthenticatedRequest,
  res: VercelResponse
) => Promise<void> | void;
